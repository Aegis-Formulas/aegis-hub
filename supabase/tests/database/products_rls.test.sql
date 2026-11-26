-- Row-level security tests for the products cache.
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select table_privs_are('public', 'products', 'authenticated', array['SELECT'], 'authenticated: select only on products');
select table_privs_are('public', 'products', 'anon', array[]::text[], 'anon: nothing on products');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'pract-c@example.test');

insert into public.products (shopify_product_id, shopify_variant_id, handle, name, status, retail_price) values
  ('gid://shopify/Product/t1', 'gid://shopify/ProductVariant/t1', 'test-active', 'Test active', 'active', 60),
  ('gid://shopify/Product/t2', 'gid://shopify/ProductVariant/t2', 'test-draft', 'Test draft', 'draft', 70);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.products where shopify_product_id in ('gid://shopify/Product/t1', 'gid://shopify/Product/t2')),
  1, 'a signed-in practitioner sees active products only'
);
select throws_ok(
  $$insert into public.products (shopify_product_id, shopify_variant_id, handle, name, status, retail_price)
    values ('gid://shopify/Product/x', 'gid://shopify/ProductVariant/x', 'x', 'x', 'active', 1)$$,
  '42501', null, 'a signed-in user cannot add products'
);
select throws_ok(
  $$update public.products set retail_price = 1 where shopify_product_id = 'gid://shopify/Product/t1'$$,
  '42501', null, 'a signed-in user cannot change prices'
);

reset role;
select throws_ok(
  $$insert into public.products (shopify_product_id, shopify_variant_id, handle, name, status, retail_price)
    values ('gid://shopify/Product/y', 'gid://shopify/ProductVariant/y', 'y', 'y', 'active', -5)$$,
  '23514', null, 'negative prices are rejected'
);

select * from finish();
rollback;
