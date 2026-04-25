-- Llamablaze — make per-unit product costs mandatory.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0005_product_variants.sql.
--
-- What this changes:
--   * Backfills any null `acquisition_cost_cents` / `shipping_cost_cents` to 0
--   * Sets both columns NOT NULL with a default of 0
--
-- Existing CHECK constraints (>= 0) introduced in 0003_product_costs.sql stay in place.
--
-- Caveat: legacy products created before cost tracking will have their costs
-- backfilled to 0. Admin should revisit them in the product editor to enter
-- real values.

-- =========================================================
-- Backfill
-- =========================================================
update public.products
   set acquisition_cost_cents = 0
 where acquisition_cost_cents is null;

update public.products
   set shipping_cost_cents = 0
 where shipping_cost_cents is null;

-- =========================================================
-- Tighten the columns
-- =========================================================
alter table public.products
  alter column acquisition_cost_cents set default 0,
  alter column acquisition_cost_cents set not null,
  alter column shipping_cost_cents    set default 0,
  alter column shipping_cost_cents    set not null;
