-- Products cache: a copy of the Shopify catalog for speed. Shopify stays the source of truth.
-- Phase 0. See DATA_MODEL.md > Catalog and ARCHITECTURE.md > Shopify Plus.
--
-- Differences from DATA_MODEL.md, on purpose:
--   * No wholesale_price column. Wholesale prices come from each practice's Shopify B2B
--     price list, so one product can have different wholesale prices for different
--     practices. The hub reads them per practice instead of storing one number.
--   * shopify_variant_id is stored, because draft orders are created by variant.
--   * status mirrors Shopify (active, draft, archived) so archived products disappear.
--
-- Products are catalog data, not customer or patient data, so there is no org_id.
-- Every signed-in person can read active products; only the server writes.

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  shopify_product_id  text not null unique,   -- gid://shopify/Product/...
  shopify_variant_id  text not null,          -- default variant, used for draft orders
  handle              text not null,
  name                text not null,
  phase               text check (phase in ('P1', 'P2', 'P3')),  -- set in the hub, not Shopify
  status              text not null check (status in ('active', 'draft', 'archived')),
  retail_price        numeric(10, 2) not null check (retail_price >= 0),
  currency            text not null default 'USD',
  image_url           text,
  synced_at           timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index products_status_idx on public.products (status);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Explicit permissions (this Supabase project grants nothing by default).
revoke all on public.products from anon, authenticated;
grant select on public.products to authenticated;
grant select, insert, update, delete on public.products to service_role;

-- Signed-in people see active products. Aegis staff also see drafts and archived ones.
create policy products_select on public.products
  for select to authenticated
  using (status = 'active' or public.is_aegis_staff());
