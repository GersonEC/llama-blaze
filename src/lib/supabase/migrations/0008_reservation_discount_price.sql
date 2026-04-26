-- Llamablaze — reservations now snapshot the discounted unit price.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after
-- 0007_shipping_as_total.sql.
--
-- Background:
--   The `create_reservation` RPC (last redefined in 0005_product_variants.sql)
--   computed both `reservation_items.unit_price_cents_snapshot` and
--   `reservations.total_cents` from `products.price_cents`, the *full* price.
--   The storefront cart, however, applies `products.discount_percentage` via
--   `finalPriceCents()` in `src/lib/domain/product.ts`. As a result, customers
--   saw the discounted total in the cart but the admin saw the full price on
--   every saved reservation.
--
--   This migration re-creates `create_reservation()` so the RPC computes the
--   discounted unit price server-side using the exact same formula as
--   `finalPriceCents()`:
--
--     round((price_cents * (100 - least(discount_percentage, 90))) / 100)
--
--   No schema is changed. Existing reservation rows are intentionally NOT
--   backfilled — only new reservations will reflect the fix.

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
  v_reservation_id  uuid;
  v_item            jsonb;
  v_product_id      uuid;
  v_variant_id      uuid;
  v_quantity        integer;
  v_product         public.products%rowtype;
  v_variant         public.product_variants%rowtype;
  v_has_variants    boolean;
  v_unit_price_cents integer;
  v_total_cents     integer := 0;
  v_currency        text;
  v_name            text;
  v_email           text;
  v_phone           text;
  v_notes           text;
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

    -- Mirror src/lib/domain/product.ts `finalPriceCents()`. Cap at 90% to match
    -- the column check on `products.discount_percentage`.
    v_unit_price_cents := case
      when v_product.discount_percentage is null
        or v_product.discount_percentage <= 0
      then v_product.price_cents
      else round(
        (v_product.price_cents::numeric
          * (100 - least(v_product.discount_percentage, 90)))
        / 100
      )::int
    end;

    v_total_cents := v_total_cents + (v_unit_price_cents * v_quantity);
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

    v_unit_price_cents := case
      when v_product.discount_percentage is null
        or v_product.discount_percentage <= 0
      then v_product.price_cents
      else round(
        (v_product.price_cents::numeric
          * (100 - least(v_product.discount_percentage, 90)))
        / 100
      )::int
    end;

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
      v_unit_price_cents,
      v_quantity
    );
  end loop;

  return v_reservation_id;
end;
$$;

grant execute on function public.create_reservation(jsonb, jsonb) to anon, authenticated;
