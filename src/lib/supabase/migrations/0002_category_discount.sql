-- Llamablaze — adds product categories + discount percentages.
--
-- Run in the Supabase SQL editor (or via `supabase db push`) after 0001_init.sql.
--
-- What this adds:
--   * product_category enum (5 fixed categories)
--   * products.category (nullable — "uncategorised" is represented by NULL)
--   * products.discount_percentage (nullable integer, 1..90; NULL = no discount)
--   * index on products.category for fast filtering

-- =========================================================
-- Enums
-- =========================================================
do $$ begin
  create type public.product_category as enum (
    'abbigliamento',
    'scarpe',
    'borse',
    'accessori',
    'tech'
  );
exception
  when duplicate_object then null;
end $$;

-- =========================================================
-- Columns
-- =========================================================
alter table public.products
  add column if not exists category public.product_category;

alter table public.products
  add column if not exists discount_percentage integer
    check (discount_percentage is null or (discount_percentage > 0 and discount_percentage <= 90));

-- =========================================================
-- Indexes
-- =========================================================
create index if not exists products_category_idx on public.products (category);
