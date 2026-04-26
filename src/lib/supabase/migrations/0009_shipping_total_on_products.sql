-- Llamablaze — store shipping_cost_cents as a flat batch total on products too.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after
-- 0008_reservation_discount_price.sql.
--
-- Background:
--   Migration 0007 redefined `product_purchases.shipping_cost_cents` to mean
--   "total shipping cost for the whole batch" (a flat amount). To preserve a
--   per-unit reference for margin calculations, the two purchase RPCs were
--   changed to populate `products.shipping_cost_cents` with
--   `p_shipping_cost_cents / p_quantity` (integer division).
--
--   The admin product form, however, treats `Costo di spedizione` as the
--   batch total on both create and edit — which means the value the admin
--   types is divided by the quantity on save and the form shows a different
--   value on reload (e.g. typing 10 with stock 2 reloads as 5). The "per-unit
--   reference" is also unused in the application (`unitCostCents()` in
--   `src/lib/domain/product.ts` has no callers).
--
--   This migration drops the per-unit derivation: from now on
--   `products.shipping_cost_cents` carries the same total-batch units as
--   `product_purchases.shipping_cost_cents`. Whatever the admin enters in the
--   form is exactly what's stored and displayed back.
--
-- No schema is changed. Existing `products` rows are intentionally not
-- backfilled — admins can save any product to refresh the column under the
-- new interpretation.

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
         shipping_cost_cents    = p_shipping_cost_cents
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
         shipping_cost_cents    = p_shipping_cost_cents
   where id = v_variant.product_id;

  return v_purchase_id;
end;
$$;

grant execute on function public.record_variant_purchase(uuid, integer, integer, integer, date, text)
  to authenticated;
