-- Llamablaze — replace products.active boolean with a tri-state status enum.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0003_product_costs.sql.
--
-- What this changes:
--   * New product_status enum: 'active' | 'draft' | 'hidden'
--   * products.status column (backfilled from the old `active` boolean)
--   * RLS: public SELECT gated on status = 'active' (previously active = true)
--   * create_reservation() now checks status instead of active
--   * products.active column is dropped

-- =========================================================
-- Enum
-- =========================================================
do $$ begin
  create type public.product_status as enum ('active', 'draft', 'hidden');
exception
  when duplicate_object then null;
end $$;

-- =========================================================
-- products.status column (backfilled, then made NOT NULL)
-- =========================================================
alter table public.products
  add column if not exists status public.product_status;

update public.products
   set status = case when active then 'active'::public.product_status
                     else 'hidden'::public.product_status end
 where status is null;

alter table public.products alter column status set not null;
alter table public.products alter column status set default 'draft';

create index if not exists products_status_idx on public.products (status);

-- =========================================================
-- RLS: swap active-based read policy for status-based read policy
-- =========================================================
drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select
  using (status = 'active' or public.is_admin());

-- =========================================================
-- create_reservation: check status instead of active
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
  v_quantity       integer;
  v_product        public.products%rowtype;
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

  for v_item in
    select * from jsonb_array_elements(p_items) as elem
    order by (elem ->> 'product_id')
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
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
    if v_product.stock < v_quantity then
      raise exception 'insufficient stock for product %', v_product_id using errcode = '22023';
    end if;

    if v_currency is null then
      v_currency := v_product.currency;
    elsif v_currency <> v_product.currency then
      raise exception 'mixed currencies are not supported' using errcode = '22023';
    end if;

    v_total_cents := v_total_cents + (v_product.price_cents * v_quantity);
  end loop;

  insert into public.reservations (
    status, customer_name, customer_email, customer_phone, pickup_notes, total_cents, currency
  ) values (
    'pending', v_name, v_email, v_phone, v_notes, v_total_cents, v_currency
  ) returning id into v_reservation_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity   := (v_item ->> 'quantity')::int;

    select * into v_product from public.products where id = v_product_id;

    update public.products
       set stock = stock - v_quantity
     where id = v_product_id;

    insert into public.reservation_items (
      reservation_id,
      product_id,
      product_name_snapshot,
      product_slug_snapshot,
      unit_price_cents_snapshot,
      quantity
    ) values (
      v_reservation_id,
      v_product_id,
      v_product.name,
      v_product.slug,
      v_product.price_cents,
      v_quantity
    );
  end loop;

  return v_reservation_id;
end;
$$;

grant execute on function public.create_reservation(jsonb, jsonb) to anon, authenticated;

-- =========================================================
-- Drop the legacy boolean column + its index
-- =========================================================
drop index if exists public.products_active_idx;
alter table public.products drop column if exists active;
