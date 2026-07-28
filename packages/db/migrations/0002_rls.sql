-- Row Level Security.
--
-- Design decision (documented per ARCHITECTURE.md 7 & DATABASE_SCHEMA.md RLS
-- section): all privileged writes in Milestone 1 are performed by trusted
-- server-side code using the Supabase service role key, which bypasses RLS,
-- AFTER an explicit application-level authorization check
-- (packages/db/src/auth-context.ts) that verifies organization membership
-- and role. RLS below is defense-in-depth for SELECT so that if a browser
-- ever queries Postgres directly with a user's session (anon key + JWT), it
-- can never see another organization's rows. No INSERT/UPDATE/DELETE
-- policies are granted to `authenticated`/`anon`, so those operations are
-- denied by default for those roles regardless of row contents.

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from organization_members
    where organization_id = target_org_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_org_member(uuid) to authenticated;

-- RLS policies are enforced in addition to, not instead of, ordinary table
-- grants. `authenticated` gets SELECT only -- no INSERT/UPDATE/DELETE grant
-- exists for `authenticated`/`anon`, so those operations are rejected before
-- RLS is even consulted, regardless of row contents.
grant usage on schema public to authenticated;
grant select on
  organizations,
  organization_members,
  github_installations,
  repositories,
  pull_requests,
  validation_runs,
  audit_events
to authenticated;

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table github_installations enable row level security;
alter table repositories enable row level security;
alter table pull_requests enable row level security;
alter table validation_runs enable row level security;
alter table audit_events enable row level security;
alter table webhook_deliveries enable row level security;

create policy organizations_select_members on organizations
  for select to authenticated
  using (is_org_member(id));

create policy organization_members_select_peers on organization_members
  for select to authenticated
  using (is_org_member(organization_id));

create policy github_installations_select_members on github_installations
  for select to authenticated
  using (is_org_member(organization_id));

create policy repositories_select_members on repositories
  for select to authenticated
  using (is_org_member(organization_id));

create policy pull_requests_select_members on pull_requests
  for select to authenticated
  using (is_org_member(organization_id));

create policy validation_runs_select_members on validation_runs
  for select to authenticated
  using (is_org_member(organization_id));

create policy audit_events_select_members on audit_events
  for select to authenticated
  using (organization_id is not null and is_org_member(organization_id));

-- webhook_deliveries is an operational/idempotency ledger, not user-facing
-- product data; no end-user SELECT policy is granted (no policy = default
-- deny for authenticated/anon; only service_role, which bypasses RLS, may
-- read or write it).
