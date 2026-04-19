-- Llamablaze reservation shop — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) for a new project.
--
-- What this sets up:
--   * reservation_status enum
--   * products, reservations, reservation_items tables
--   * is_admin() helper (checks auth.jwt() email against a comma-separated allowlist)
--   * Row Level Security policies (public can read active products; admins manage everything)
--   * create_reservation() SECURITY DEFINER RPC that atomically checks/decrements stock
--   * updated_at triggers
--
-- Prereqs: run once with service-role key:
--   ALTER DATABASE postgres SET "app.admin_emails" = 'me@example.com,other@example.com';
-- (Or use the Supabase dashboard → Database → Custom Postgres settings.)

-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists "uuid-ossp";

-- =========================================================
-- Enums
-- =========================================================
do $$ begin
  create type public.reservation_status as enum (
    'pending',
    'contacted',
    'confirmed',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

-- =========================================================
-- Tables
-- =========================================================
create table if not exists public.products (
  id            uuid primary key default uuid_generate_v4(),
  slug          text not null unique,
  name          text not null,
  description   text not null default '',
  price_cents   integer not null check (price_cents >= 0),
  currency      text not null default 'EUR' check (char_length(currency) = 3),
  stock         integer not null default 0 check (stock >= 0),
  images        text[] not null default '{}',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active);

create table if not exists public.reservations (
  id               uuid primary key default uuid_generate_v4(),
  status           public.reservation_status not null default 'pending',
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  pickup_notes     text not null default '',
  total_cents      integer not null check (total_cents >= 0),
  currency         text not null default 'EUR' check (char_length(currency) = 3),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists reservations_created_at_idx on public.reservations (created_at desc);

create table if not exists public.reservation_items (
  id                            uuid primary key default uuid_generate_v4(),
  reservation_id                uuid not null references public.reservations(id) on delete cascade,
  product_id                    uuid not null references public.products(id) on delete restrict,
  product_name_snapshot         text not null,
  product_slug_snapshot         text not null,
  unit_price_cents_snapshot     integer not null check (unit_price_cents_snapshot >= 0),
  quantity                      integer not null check (quantity > 0),
  created_at                    timestamptz not null default now()
);

create index if not exists reservation_items_reservation_idx on public.reservation_items (reservation_id);

-- =========================================================
-- updated_at triggers
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- =========================================================
-- Admin allowlist helper
-- =========================================================
-- Reads a comma-separated list of admin emails from the `app.admin_emails` GUC.
-- Configure via: `alter database postgres set "app.admin_emails" = 'a@x.com,b@y.com';`
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_allowlist text;
begin
  v_email := lower(coalesce((auth.jwt() ->> 'email'), ''));
  if v_email = '' then
    return false;
  end if;

  begin
    v_allowlist := lower(coalesce(current_setting('app.admin_emails', true), ''));
  exception when others then
    v_allowlist := '';
  end;

  if v_allowlist = '' then
    return false;
  end if;

  return v_email = any (string_to_array(v_allowlist, ','));
end;
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.products           enable row level security;
alter table public.reservations       enable row level security;
alter table public.reservation_items  enable row level security;

-- products: anyone can read active rows; admins can do anything
drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select
  using (active = true or public.is_admin());

drop policy if exists products_admin_all on public.products;
create policy products_admin_all
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- reservations: admin-only read/write; customer inserts go through create_reservation() RPC (SECURITY DEFINER)
drop policy if exists reservations_admin_all on public.reservations;
create policy reservations_admin_all
  on public.reservations for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists reservation_items_admin_all on public.reservation_items;
create policy reservation_items_admin_all
  on public.reservation_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================================
-- create_reservation() — atomic stock check + decrement + insert
-- =========================================================
-- Input shapes:
--   p_items:    jsonb array, each: { "product_id": "...", "quantity": 2 }
--   p_customer: jsonb object: { "name": "...", "email": "...", "phone": "...", "pickup_notes": "..." }
-- Returns the id of the newly created reservation.
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
  -- Validate customer payload
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

  -- Validate items payload
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one item is required' using errcode = '22023';
  end if;

  -- First pass: lock all referenced product rows in id order (prevents deadlocks)
  -- and verify stock availability.
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
    if not v_product.active then
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

  -- Second pass: decrement stock + insert rows
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

-- Publicly callable so the checkout server action can invoke it via the anon client.
grant execute on function public.create_reservation(jsonb, jsonb) to anon, authenticated;

-- =========================================================
-- Storage bucket for product images
-- =========================================================
-- Create a public bucket called `product-images`. Readable by anyone,
-- writable only by admins (checked via storage.objects policies).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists product_images_admin_write on storage.objects;
create policy product_images_admin_write
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
