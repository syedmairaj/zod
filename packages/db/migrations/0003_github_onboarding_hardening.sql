-- Milestone 1 GitHub onboarding hardening.
-- Additive only: new nullable columns for legacy rows, immutability triggers,
-- and a deprecation comment on encrypted_credentials_reference.
-- No fake backfill of account_id / permissions / installer / timestamps.

-- ---------------------------------------------------------------------------
-- github_installations: new columns
-- ---------------------------------------------------------------------------
alter table github_installations
  add column if not exists account_id bigint,
  add column if not exists permissions_json jsonb,
  add column if not exists installed_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists revoked_at timestamptz;

comment on column github_installations.account_id is
  'GitHub account numeric id for the installation target. Null only for legacy rows until refreshed.';
comment on column github_installations.permissions_json is
  'Exact permissions object returned by GitHub for this installation. Null for legacy rows; empty object only when GitHub returns none.';
comment on column github_installations.installed_by_user_id is
  'Zod.ai user who completed the successful install connection. Null for legacy rows.';
comment on column github_installations.revoked_at is
  'Set when the installation is manually disconnected, revoked, or discovered deleted. Cleared only on explicit same-organization reconnection.';
comment on column github_installations.encrypted_credentials_reference is
  'DEPRECATED for GitHub installation access tokens. Installation tokens must remain ephemeral and in-memory only. Column retained for backward compatibility; do not write installation tokens here.';

create index if not exists github_installations_installed_by_user_id_idx
  on github_installations (installed_by_user_id);

-- ---------------------------------------------------------------------------
-- repositories: disconnected_at
-- ---------------------------------------------------------------------------
alter table repositories
  add column if not exists disconnected_at timestamptz;

comment on column repositories.disconnected_at is
  'Set when repository access is removed or the repository is deselected. Cleared when the same provider_repository_id is validly reactivated.';

-- ---------------------------------------------------------------------------
-- Immutability: installation cannot change organization_id
-- ---------------------------------------------------------------------------
create or replace function public.prevent_github_installation_org_reassign()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'github_installations.organization_id is immutable'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists github_installations_org_immutable on github_installations;
create trigger github_installations_org_immutable
  before update on github_installations
  for each row
  execute function public.prevent_github_installation_org_reassign();

-- ---------------------------------------------------------------------------
-- Immutability: repositories cannot move org or installation
-- ---------------------------------------------------------------------------
create or replace function public.prevent_repository_tenant_reassign()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and (
    new.organization_id is distinct from old.organization_id
    or new.github_installation_id is distinct from old.github_installation_id
  ) then
    raise exception 'repositories.organization_id and github_installation_id are immutable'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists repositories_tenant_immutable on repositories;
create trigger repositories_tenant_immutable
  before update on repositories
  for each row
  execute function public.prevent_repository_tenant_reassign();
