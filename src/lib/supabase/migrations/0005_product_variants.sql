-- Llamablaze — per-color product variants with independent stock.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0004_product_status.sql.
--
-- What this adds:
--   * product_variants table: one row per color, per-variant stock
--   * Trigger keeping products.stock in sync with sum(variants.stock) when variants exist
--   * reservation_items.variant_id + name/hex snapshots (nullable — legacy items without a variant)
--   * Updated create_reservation() RPC that locks/decrements variants when variant_id is supplied
--     and refuses product-level ordering when a product has variants
--   * record_variant_purchase() RPC mirroring record_product_purchase() for variant-scoped restocks

-- =========================================================
-- product_variants table
-- =========================================================
create table if not exists public.product_variants (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid not null references public.products(id) on delete cascade,
  name          text not null check (char_length(trim(name)) > 0),
  hex           text not null check (char_length(trim(hex)) > 0),
  stock         integer not null default 0 check (stock >= 0),
  position      smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, position);

create unique index if not exists product_variants_unique_name_per_product
  on public.product_variants (product_id, lower(name));

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- =========================================================
-- Keep products.stock = sum(variants.stock) when variants exist.
-- When a product has zero variants, leave products.stock alone
-- (legacy behaviour — products without variants still manage stock directly).
-- =========================================================
create or replace function public.sync_product_stock_from_variants(p_product_id uuid)
returns void
language plpgsql
as $$
declare
  v_total   integer;
  v_count   integer;
begin
  select coalesce(sum(stock), 0), count(*)
    into v_total, v_count
    from public.product_variants
   where product_id = p_product_id;

  if v_count > 0 then
    update public.products
       set stock = v_total
     where id = p_product_id
       and stock is distinct from v_total;
  end if;
end;
$$;

create or replace function public.product_variants_sync_stock_trg()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_product_stock_from_variants(old.product_id);
    return old;
  end if;

  perform public.sync_product_stock_from_variants(new.product_id);
  if tg_op = 'UPDATE' and new.product_id <> old.product_id then
    perform public.sync_product_stock_from_variants(old.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists product_variants_sync_stock on public.product_variants;
create trigger product_variants_sync_stock
  after insert or update or delete on public.product_variants
  for each row execute function public.product_variants_sync_stock_trg();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.product_variants enable row level security;

-- Public can read variants only for products they're allowed to read (active products).
drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read
  on public.product_variants for select
  using (
    public.is_admin()
    or exists (
      select 1
        from public.products p
       where p.id = product_variants.product_id
         and p.status = 'active'
    )
  );

drop policy if exists product_variants_admin_all on public.product_variants;
create policy product_variants_admin_all
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- reservation_items: variant snapshot columns
-- =========================================================
alter table public.reservation_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete restrict;

alter table public.reservation_items
  add column if not exists variant_name_snapshot text;

alter table public.reservation_items
  add column if not exists variant_hex_snapshot text;

create index if not exists reservation_items_variant_idx
  on public.reservation_items (variant_id);

-- =========================================================
-- create_reservation() — variant-aware
-- =========================================================
create or replace function public.create_reservation(
  p_items    jsonb,
  p_customer jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation_id uuid;
  v_item           jsonb;
  v_product_id     uuid;
  v_variant_id     uuid;
  v_quantity       integer;
  v_product        public.products%rowtype;
  v_variant        public.product_variants%rowtype;
  v_has_variants   boolean;
  v_total_cents    integer := 0;
  v_currency       text;
  v_name           text;
  v_email          text;
  v_phone          text;
  v_notes          text;
begin
  v_name  := trim(coalesce(p_customer ->> 'name', ''));
  v_email := lower(trim(coalesce(p_customer ->> 'email', '')));
  v_phone := trim(coalesce(p_customer ->> 'phone', ''));
  v_notes := coalesce(p_customer ->> 'pickup_notes', '');

  if v_name = '' then
    raise exception 'customer name is required' using errcode = '22023';
  end if;
  if v_email = '' then
    raise exception 'customer email is required' using errcode = '22023';
  end if;
  if v_phone = '' then
    raise exception 'customer phone is required' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one item is required' using errcode = '22023';
  end if;

  -- Pass 1: lock + validate (ordered by product_id, variant_id to avoid deadlocks)
  for v_item in
    select * from jsonb_array_elements(p_items) as elem
    order by (elem ->> 'product_id'), coalesce(elem ->> 'variant_id', '')
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
    v_quantity   := coalesce((v_item ->> 'quantity')::int, 0);

    if v_quantity <= 0 then
      raise exception 'quantity must be positive for product %', v_product_id using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'product % not found', v_product_id using errcode = 'P0002';
    end if;
    if v_product.status <> 'active' then
      raise exception 'product % is not active', v_product_id using errcode = '22023';
    end if;

    select exists(
      select 1 from public.product_variants where product_id = v_product_id
    ) into v_has_variants;

    if v_has_variants then
      if v_variant_id is null then
        raise exception 'variant_id is required for product %', v_product_id using errcode = '22023';
      end if;

      select * into v_variant
      from public.product_variants
      where id = v_variant_id
        and product_id = v_product_id
      for update;

      if not found then
        raise exception 'variant % not found for product %', v_variant_id, v_product_id using errcode = 'P0002';
      end if;

      if v_variant.stock < v_quantity then
        raise exception 'insufficient stock for variant %', v_variant_id using errcode = '22023';
      end if;
    else
      if v_variant_id is not null then
        raise exception 'product % has no variants' , v_product_id using errcode = '22023';
      end if;

      if v_product.stock < v_quantity then
        raise exception 'insufficient stock for product %', v_product_id using errcode = '22023';
      end if;
    end if;

    if v_currency is null then
      v_currency := v_product.currency;
    elsif v_currency <> v_product.currency then
      raise exception 'mixed currencies are not supported' using errcode = '22023';
    end if;

    v_total_cents := v_total_cents + (v_product.price_cents * v_quantity);
  end loop;

  -- Pass 2: insert reservation row + decrement stock + insert item rows
  insert into public.reservations (
    status, customer_name, customer_email, customer_phone, pickup_notes, total_cents, currency
  ) values (
    'pending', v_name, v_email, v_phone, v_notes, v_total_cents, v_currency
  ) returning id into v_reservation_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
    v_quantity   := (v_item ->> 'quantity')::int;

    select * into v_product from public.products where id = v_product_id;

    if v_variant_id is not null then
      update public.product_variants
         set stock = stock - v_quantity
       where id = v_variant_id
      returning * into v_variant;
    else
      update public.products
         set stock = stock - v_quantity
       where id = v_product_id;
      v_variant := null;
    end if;

    insert into public.reservation_items (
      reservation_id,
      product_id,
      variant_id,
      product_name_snapshot,
      product_slug_snapshot,
      variant_name_snapshot,
      variant_hex_snapshot,
      unit_price_cents_snapshot,
      quantity
    ) values (
      v_reservation_id,
      v_product_id,
      v_variant_id,
      v_product.name,
      v_product.slug,
      v_variant.name,
      v_variant.hex,
      v_product.price_cents,
      v_quantity
    );
  end loop;

  return v_reservation_id;
end;
$$;

grant execute on function public.create_reservation(jsonb, jsonb) to anon, authenticated;

-- =========================================================
-- record_variant_purchase() — variant-scoped restock
-- =========================================================
-- Inserts a product_purchases ledger row targeted at a variant, bumps the
-- variant's stock (which cascades to products.stock via the sync trigger),
-- and refreshes the product's latest per-unit cost columns.
create or replace function public.record_variant_purchase(
  p_variant_id          uuid,
  p_quantity            integer,
  p_unit_cost_cents     integer,
  p_shipping_cost_cents integer,
  p_purchased_at        date default null,
  p_notes               text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id  uuid;
  v_variant      public.product_variants%rowtype;
  v_product      public.products%rowtype;
  v_purchased_at date;
begin
  if not public.is_admin() then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be positive' using errcode = '22023';
  end if;
  if p_unit_cost_cents is null or p_unit_cost_cents < 0 then
    raise exception 'unit_cost_cents must be non-negative' using errcode = '22023';
  end if;
  if p_shipping_cost_cents is null or p_shipping_cost_cents < 0 then
    raise exception 'shipping_cost_cents must be non-negative' using errcode = '22023';
  end if;

  v_purchased_at := coalesce(p_purchased_at, current_date);

  select * into v_variant
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'variant % not found', p_variant_id using errcode = 'P0002';
  end if;

  select * into v_product
  from public.products
  where id = v_variant.product_id
  for update;

  insert into public.product_purchases (
    product_id, purchased_at, quantity,
    unit_cost_cents, shipping_cost_cents,
    currency, notes
  ) values (
    v_variant.product_id, v_purchased_at, p_quantity,
    p_unit_cost_cents, p_shipping_cost_cents,
    v_product.currency, coalesce(p_notes, '')
  ) returning id into v_purchase_id;

  update public.product_variants
     set stock = stock + p_quantity
   where id = p_variant_id;

  update public.products
     set acquisition_cost_cents = p_unit_cost_cents,
         shipping_cost_cents    = p_shipping_cost_cents
   where id = v_variant.product_id;

  return v_purchase_id;
end;
$$;

grant execute on function public.record_variant_purchase(uuid, integer, integer, integer, date, text)
  to authenticated;
