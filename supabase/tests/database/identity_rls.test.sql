-- Row-level security tests for the identity migration.
-- Run with: supabase test db   (needs the Supabase CLI and Docker, or a linked staging project)
-- ROADMAP Phase 0 "done when": a second practice can't see the first one's data.

begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

-- ---------------------------------------------------------------------------
-- Fixtures (as the database owner, RLS bypassed)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'pract-b@example.test'),
  ('00000000-0000-0000-0000-0000000000a1', 'patient-a1@example.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'patient-a2@example.test'),
  ('00000000-0000-0000-0000-0000000000ff', 'staff@example.test');

insert into public.orgs (id, type, name, status) values
  ('10000000-0000-0000-0000-000000000000', 'aegis',    'Aegis',      'active'),
  ('10000000-0000-0000-0000-00000000000a', 'practice', 'Practice A', 'active'),
  ('10000000-0000-0000-0000-00000000000b', 'practice', 'Practice B', 'active');

insert into public.memberships (user_id, org_id, role) values
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'practice_owner'),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'practitioner'),
  ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'practitioner'),
  ('00000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-00000000000a', 'patient'),
  ('00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-00000000000a', 'patient'),
  ('00000000-0000-0000-0000-0000000000ff', '10000000-0000-0000-0000-000000000000', 'aegis_staff');

insert into public.entitlements (org_id, key) values
  ('10000000-0000-0000-0000-00000000000a', 'wholesale');

select is((select count(*)::int from public.profiles), 5, 'a profile is created for each new user');

select throws_ok(
  $$insert into public.memberships (user_id, org_id, role)
    values ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'aegis_admin')$$,
  'P0001', null, 'aegis_admin cannot be granted in a practice org'
);


-- ---------------------------------------------------------------------------
-- Practitioner in practice B
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select results_eq(
  'select name from public.orgs order by name', array['Practice B'],
  'practice B sees only its own org'
);
select is(
  (select count(*)::int from public.profiles where user_id in (
    '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1')),
  0, 'practice B cannot see practice A owner or patients'
);
select is(
  (select count(*)::int from public.memberships where org_id = '10000000-0000-0000-0000-00000000000a'),
  0, 'practice B cannot see practice A memberships'
);
select is(
  (select count(*)::int from public.entitlements where org_id = '10000000-0000-0000-0000-00000000000a'),
  0, 'practice B cannot see practice A entitlements'
);
select is_empty(
  $$update public.orgs set name = 'Hijacked' where id = '10000000-0000-0000-0000-00000000000a' returning id$$,
  'practice B cannot rename practice A'
);
select throws_ok(
  $$insert into public.memberships (user_id, org_id, role)
    values ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000a', 'practitioner')$$,
  '42501', null, 'practice B cannot add itself to practice A'
);
select is(public.has_entitlement('wholesale'), false, 'practice B has no wholesale entitlement');

-- ---------------------------------------------------------------------------
-- Owner of practice A
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.profiles where user_id in (
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2')),
  2, 'practice A owner sees their patients'
);
select is(public.has_entitlement('wholesale'), true, 'practice A has wholesale through its org');
select isnt_empty(
  $$update public.orgs set name = 'Practice A Renamed' where id = '10000000-0000-0000-0000-00000000000a' returning id$$,
  'owner can rename their practice'
);
select throws_ok(
  $$update public.orgs set status = 'suspended' where id = '10000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'owner cannot change their own status'
);
select is_empty('select id from public.audit_log', 'owner cannot read the audit log');

-- ---------------------------------------------------------------------------
-- Patient A1
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a2'),
  0, 'a patient cannot see another patient in the same practice'
);
select is(
  (select count(*)::int from public.profiles where user_id = '00000000-0000-0000-0000-00000000000a'),
  1, 'a patient can see their practitioner'
);

-- ---------------------------------------------------------------------------
-- Aegis staff
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ff","role":"authenticated"}', true);

select is((select count(*)::int from public.orgs), 3, 'Aegis staff see every org');

-- ---------------------------------------------------------------------------
-- Audit log is append only, even for the database owner
-- ---------------------------------------------------------------------------
reset role;
insert into public.audit_log (action, target) values ('test', 'orgs:x');
select throws_ok('delete from public.audit_log', 'P0001', 'audit_log is append only', 'audit log rows cannot be deleted');

select * from finish();
rollback;
