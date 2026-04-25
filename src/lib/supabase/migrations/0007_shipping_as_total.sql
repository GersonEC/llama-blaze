-- Llamablaze — reinterpret shipping_cost_cents as a flat total per purchase event.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after
-- 0006_required_product_costs.sql.
--
-- Semantic shift (no schema/columns are changed by this migration):
--   * `product_purchases.shipping_cost_cents` previously meant "per-unit shipping
--     cost for the batch". From now on it means "total shipping cost for the
--     whole batch" (a flat amount, not multiplied by quantity).
--   * `products.shipping_cost_cents` continues to represent the latest per-unit
--     shipping cost. The two RPCs below now derive that per-unit value from the
--     ledger total via integer division (`shipping_total / quantity`).
--
-- Cashflow Uscita is computed in the application layer as
-- `unit_cost_cents * quantity + shipping_cost_cents`, so the only change here
-- is how the per-unit reference column on `products` is populated.
--
-- Existing `product_purchases` rows are intentionally not backfilled: the user
-- has accepted that the totals shown for them will change under the new
-- interpretation and will fix any incorrect rows manually.

-- =========================================================
-- record_product_purchase()
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
         shipping_cost_cents    = p_shipping_cost_cents / p_quantity
   where id = p_product_id;

  return v_purchase_id;
end;
$$;

grant execute on function public.record_product_purchase(uuid, integer, integer, integer, date, text)
  to authenticated;

-- =========================================================
-- record_variant_purchase()
-- =========================================================
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
         shipping_cost_cents    = p_shipping_cost_cents / p_quantity
   where id = v_variant.product_id;

  return v_purchase_id;
end;
$$;

grant execute on function public.record_variant_purchase(uuid, integer, integer, integer, date, text)
  to authenticated;
