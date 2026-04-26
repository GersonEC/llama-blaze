-- Llamablaze — let admins hard-delete products by cascading dependent rows.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after
-- 0009_shipping_total_on_products.sql.
--
-- Background:
--   `deleteProductAction` (src/app/admin/products/actions.ts) issues a plain
--   `delete from products`. Three foreign keys were declared with
--   `on delete restrict`, so any product that ever had a restock or a
--   reservation could not be deleted at all:
--
--     * product_purchases.product_id    -> products(id)         restrict (0003)
--     * reservation_items.product_id    -> products(id)         restrict (0001)
--     * reservation_items.variant_id    -> product_variants(id) restrict (0005)
--
--   Compounding this, the create flow auto-inserts a `product_purchases` row
--   whenever a product is created with stock > 0, so even brand-new draft
--   products immediately became undeletable.
--
--   Product decision: deleting a product hard-deletes its cashflow ledger
--   rows and reservation items too. We accept losing that history; admins
--   who want to keep it should change the product's status instead.
--
-- Why we also flip `reservation_items.variant_id`:
--   `product_variants.product_id` is already `on delete cascade`, so deleting
--   a product cascades into its variants. Each variant deletion then triggers
--   the FK check on `reservation_items.variant_id`, which under `restrict`
--   would block the cascade chain even though the same reservation_items
--   rows are scheduled to be deleted by the `product_id` cascade. Setting
--   variant_id to cascade keeps the chain consistent.
--
-- No data backfill is needed. Constraint names are the Postgres defaults
-- generated when no explicit `constraint <name>` was specified at create
-- time (`<table>_<column>_fkey`).

-- =========================================================
-- product_purchases.product_id  ->  products(id)
-- =========================================================
alter table public.product_purchases
  drop constraint if exists product_purchases_product_id_fkey;

alter table public.product_purchases
  add constraint product_purchases_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

-- =========================================================
-- reservation_items.product_id  ->  products(id)
-- =========================================================
alter table public.reservation_items
  drop constraint if exists reservation_items_product_id_fkey;

alter table public.reservation_items
  add constraint reservation_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

-- =========================================================
-- reservation_items.variant_id  ->  product_variants(id)
-- =========================================================
alter table public.reservation_items
  drop constraint if exists reservation_items_variant_id_fkey;

alter table public.reservation_items
  add constraint reservation_items_variant_id_fkey
  foreign key (variant_id) references public.product_variants(id) on delete cascade;
