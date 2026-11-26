-- Identity: people, organizations, memberships, entitlements, audit log.
-- Phase 0. See DATA_MODEL.md > Identity and ARCHITECTURE.md > Identity and access.
--
-- Not in this migration (later, once their open questions are settled):
--   seats, practice_profiles  (seats vs memberships is unresolved; directory is Phase 5)
--
-- Writes to memberships, entitlements, orgs (create) and audit_log happen only on the
-- server with the service role, never from the browser. The browser can read what
-- RLS allows and edit its own profile and (owners) their practice name and brand.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.org_type as enum ('aegis', 'practice', 'employer');

create type public.org_status as enum ('pending', 'active', 'suspended', 'closed');

create type public.member_role as enum (
  'aegis_admin',
  'aegis_staff',
  'rep',
  'practice_owner',
  'practice_staff',
  'practitioner',
  'patient',
  'affiliate'
);

create type public.entitlement_key as enum (
  'wholesale',
  'education_only',
  'af_certified',
  'live',
  'patient_portal'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one per person
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orgs: Aegis itself, each practice, later employers
-- ---------------------------------------------------------------------------
create table public.orgs (
  id                  uuid primary key default gen_random_uuid(),
  type                public.org_type not null,
  name                text not null check (length(trim(name)) > 0),
  brand               jsonb not null default '{}'::jsonb,  -- logo, primary, accent, font, mode
  shopify_company_id  text unique,
  status              public.org_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Exactly one Aegis org.
create unique index orgs_one_aegis on public.orgs (type) where type = 'aegis';

create trigger orgs_updated_at before update on public.orgs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- memberships: who belongs to which org, in which role
-- ---------------------------------------------------------------------------
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  org_id      uuid not null references public.orgs (id) on delete cascade,
  role        public.member_role not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, org_id, role)
);

create index memberships_org_idx on public.memberships (org_id);
create index memberships_user_idx on public.memberships (user_id);

create trigger memberships_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();

-- Aegis staff roles only exist inside the Aegis org; patients never do.
create function public.check_membership_role()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  t public.org_type;
begin
  select type into t from public.orgs where id = new.org_id;
  if new.role in ('aegis_admin', 'aegis_staff') and t <> 'aegis' then
    raise exception 'Role % is only allowed in the Aegis org', new.role;
  end if;
  if new.role = 'patient' and t = 'aegis' then
    raise exception 'Patients belong to a practice, not the Aegis org';
  end if;
  return new;
end;
$$;

create trigger memberships_role_check before insert or update on public.memberships
  for each row execute function public.check_membership_role();

-- ---------------------------------------------------------------------------
-- entitlements: what someone can access. Features check these, not roles.
-- ---------------------------------------------------------------------------
create table public.entitlements (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.orgs (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete cascade,
  key         public.entitlement_key not null,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint entitlements_one_owner check ((org_id is null) <> (user_id is null)),
  constraint entitlements_dates check (ends_at is null or ends_at > starts_at)
);

create index entitlements_org_idx on public.entitlements (org_id) where org_id is not null;
create index entitlements_user_idx on public.entitlements (user_id) where user_id is not null;

create trigger entitlements_updated_at before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log: every admin and money action. Append only.
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  target      text,              -- e.g. 'orgs:<uuid>'. Ids only, never names or health data.
  org_id      uuid references public.orgs (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index audit_log_org_idx on public.audit_log (org_id, created_at desc);

create function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append only';
end;
$$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();

-- ---------------------------------------------------------------------------
-- Access helpers. SECURITY DEFINER so policies can check memberships without
-- recursing through memberships' own RLS. All read auth.uid(); none take a user id.
-- ---------------------------------------------------------------------------
create function public.is_aegis_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.orgs o on o.id = m.org_id
    where m.user_id = (select auth.uid())
      and o.type = 'aegis'
      and m.role in ('aegis_admin', 'aegis_staff')
  );
$$;

create function public.is_aegis_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.orgs o on o.id = m.org_id
    where m.user_id = (select auth.uid())
      and o.type = 'aegis'
      and m.role = 'aegis_admin'
  );
$$;

-- Any membership in the org.
create function public.is_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.org_id = p_org
  );
$$;

-- A team member of the org: any role other than patient or affiliate.
create function public.is_team(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.org_id = p_org
      and m.role not in ('patient', 'affiliate')
  );
$$;

create function public.is_org_owner(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.org_id = p_org
      and m.role = 'practice_owner'
  );
$$;

-- Active entitlement for the current user, held personally or through any of their orgs.
create function public.has_entitlement(p_key public.entitlement_key)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.entitlements e
    where e.key = p_key
      and e.starts_at <= now()
      and (e.ends_at is null or e.ends_at > now())
      and (
        e.user_id = (select auth.uid())
        or e.org_id in (select m.org_id from public.memberships m where m.user_id = (select auth.uid()))
      )
  );
$$;

revoke execute on function
  public.is_aegis_staff(), public.is_aegis_admin(), public.is_member(uuid),
  public.is_team(uuid), public.is_org_owner(uuid), public.has_entitlement(public.entitlement_key)
from public, anon;

grant execute on function
  public.is_aegis_staff(), public.is_aegis_admin(), public.is_member(uuid),
  public.is_team(uuid), public.is_org_owner(uuid), public.has_entitlement(public.entitlement_key)
to authenticated;

-- ---------------------------------------------------------------------------
-- Create a profile when someone signs up
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.orgs         enable row level security;
alter table public.memberships  enable row level security;
alter table public.entitlements enable row level security;
alter table public.audit_log    enable row level security;

-- Signed-out visitors get nothing from these tables.
revoke all on public.profiles, public.orgs, public.memberships, public.entitlements, public.audit_log from anon;

-- profiles ------------------------------------------------------------------
-- You see yourself. Team members see everyone in their org. Patients see the team
-- in their practice but never other patients. Aegis staff see everyone.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_aegis_staff()
    or exists (
      select 1
      from public.memberships theirs
      where theirs.user_id = profiles.user_id
        and (
          public.is_team(theirs.org_id)
          or (public.is_member(theirs.org_id) and theirs.role not in ('patient', 'affiliate'))
        )
    )
  );

-- You can edit your own profile (but not move it to another account).
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, avatar_url) on public.profiles to authenticated;

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- orgs ----------------------------------------------------------------------
create policy orgs_select on public.orgs
  for select to authenticated
  using (public.is_member(id) or public.is_aegis_staff());

-- Practice owners can change their practice name and brand. Status and the
-- Shopify company link are changed only by Aegis on the server.
revoke update on public.orgs from authenticated;
grant update (name, brand) on public.orgs to authenticated;

create policy orgs_update_owner on public.orgs
  for update to authenticated
  using (public.is_org_owner(id))
  with check (public.is_org_owner(id));

-- memberships ---------------------------------------------------------------
-- You see your own memberships. Team members see who is in their org.
create policy memberships_select on public.memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_team(org_id)
    or public.is_aegis_staff()
  );

revoke insert, update, delete on public.memberships from authenticated;

-- entitlements --------------------------------------------------------------
create policy entitlements_select on public.entitlements
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (org_id is not null and public.is_member(org_id))
    or public.is_aegis_staff()
  );

revoke insert, update, delete on public.entitlements from authenticated;

-- audit_log -----------------------------------------------------------------
-- Only Aegis admins can read it. Nobody writes from the browser.
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (public.is_aegis_admin());

revoke insert, update, delete on public.audit_log from authenticated;
