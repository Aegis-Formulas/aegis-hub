-- Fix: patients could not see their practitioner's profile.
--
-- Found by the staging tests (Nov 25, 2026, test "a patient can see their practitioner").
-- The profiles rule looked up the other person's memberships, but that lookup ran under
-- the patient's own permissions, and patients can only see their own memberships. So the
-- check always came back empty for them.
--
-- The rule itself is unchanged. It now runs inside a SECURITY DEFINER helper, the same
-- way the other access helpers do:
--   You see yourself. Team members see everyone in their org. Patients see the team in
--   their practice but never other patients. Aegis staff see everyone.

create function public.can_see_profile(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships theirs
    where theirs.user_id = p_target
      and (
        public.is_team(theirs.org_id)
        or (public.is_member(theirs.org_id) and theirs.role not in ('patient', 'affiliate'))
      )
  );
$$;

revoke execute on function public.can_see_profile(uuid) from public, anon;
grant execute on function public.can_see_profile(uuid) to authenticated;

drop policy profiles_select on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_aegis_staff()
    or public.can_see_profile(user_id)
  );
