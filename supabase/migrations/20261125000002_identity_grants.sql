-- Explicit table permissions for the identity tables.
--
-- Found on staging (Nov 25, 2026): this Supabase project does not give new tables any
-- read or write permissions by default. Signed-in users could not read anything (so the
-- row-level security rules never even ran), the server's service role could not write,
-- and signed-in users had been given TRUNCATE, which ignores row-level security.
--
-- Rule from here on: every migration that creates a table grants its permissions
-- explicitly, the same way this one does.

-- Remove permissions nobody outside the database owner should have.
revoke truncate, references, trigger
  on public.profiles, public.orgs, public.memberships, public.entitlements, public.audit_log
  from anon, authenticated;

-- Signed-in users: read, filtered row by row by the RLS policies in 20261125000001.
grant select
  on public.profiles, public.orgs, public.memberships, public.entitlements, public.audit_log
  to authenticated;

-- Column edits stay as granted in 20261125000001:
--   profiles: first_name, last_name, phone, avatar_url (own row only)
--   orgs:     name, brand (practice owners only)

-- Server (service role, never in the browser): manages orgs, memberships and entitlements.
grant select, insert, update, delete
  on public.profiles, public.orgs, public.memberships, public.entitlements
  to service_role;

-- Audit log is append only: the server can add and read rows, never change them.
grant select, insert on public.audit_log to service_role;
