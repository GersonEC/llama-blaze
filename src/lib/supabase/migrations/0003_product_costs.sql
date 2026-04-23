-- Llamablaze — adds per-unit product cost tracking + a purchase ledger.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0002_category_discount.sql.
--
-- What this adds:
--   * products.acquisition_cost_cents (nullable non-negative int) — latest per-unit cost paid
--   * products.shipping_cost_cents (nullable non-negative int) — latest per-unit shipping cost
--   * product_purchases table: append-only ledger of every restock event (for cashflow history)
--   * Admin-only RLS on product_purchases
--   * record_product_purchase() SECURITY DEFINER RPC that atomically inserts the ledger row,
--     bumps stock, and refreshes the "latest cost" columns on products

-- =========================================================
-- Columns on products
-- =========================================================
alter table public.products
  add column if not exists acquisition_cost_cents integer
    check (acquisition_cost_cents is null or acquisition_cost_cents >= 0);

alter table public.products
  add column if not exists shipping_cost_cents integer
    check (shipping_cost_cents is null or shipping_cost_cents >= 0);

-- =========================================================
-- product_purchases ledger
-- =========================================================
create table if not exists public.product_purchases (
  id                    uuid primary key default uuid_generate_v4(),
  product_id            uuid not null references public.products(id) on delete restrict,
  purchased_at          date not null default current_date,
  quantity              integer not null check (quantity > 0),
  unit_cost_cents       integer not null check (unit_cost_cents >= 0),
  shipping_cost_cents   integer not null default 0 check (shipping_cost_cents >= 0),
  currency              text not null default 'EUR' check (char_length(currency) = 3),
  notes                 text not null default '',
  created_at            timestamptz not null default now()
);

create index if not exists product_purchases_product_idx
  on public.product_purchases (product_id);
create index if not exists product_purchases_purchased_at_idx
  on public.product_purchases (purchased_at desc);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.product_purchases enable row level security;

drop policy if exists product_purchases_admin_all on public.product_purchases;
create policy product_purchases_admin_all
  on public.product_purchases for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- record_product_purchase() — atomic ledger insert + stock bump + latest-cost refresh
-- =========================================================
create or replace function public.record_product_purchase(
  p_product_id          uuid,
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

  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'product % not found', p_product_id using errcode = 'P0002';
  end if;

  insert into public.product_purchases (
    product_id, purchased_at, quantity,
    unit_cost_cents, shipping_cost_cents,
    currency, notes
  ) values (
    p_product_id, v_purchased_at, p_quantity,
    p_unit_cost_cents, p_shipping_cost_cents,
    v_product.currency, coalesce(p_notes, '')
  ) returning id into v_purchase_id;

  update public.products
     set stock                  = stock + p_quantity,
         acquisition_cost_cents = p_unit_cost_cents,
         shipping_cost_cents    = p_shipping_cost_cents
   where id = p_product_id;

  return v_purchase_id;
end;
$$;

grant execute on function public.record_product_purchase(uuid, integer, integer, integer, date, text)
  to authenticated;
