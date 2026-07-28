-- Milestone 1 schema.
-- Conventions: UUID primary keys, UTC timestamps, every tenant-owned table
-- carries organization_id, every FK is indexed, RLS is enabled everywhere
-- (defense in depth; the application service layer is the primary
-- authorization boundary per ARCHITECTURE.md section 7).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create table organization_members (
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (
    role in ('owner', 'admin', 'developer', 'reviewer', 'billing', 'read_only')
  ),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_id_idx on organization_members (user_id);
create index organization_members_org_id_idx on organization_members (organization_id);

-- ---------------------------------------------------------------------------
-- github_installations
-- ---------------------------------------------------------------------------
create table github_installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  installation_id bigint not null unique,
  account_login text not null,
  -- Encrypted (AES-256-GCM) envelope for any short-lived, sensitive cached
  -- value (e.g. a cached installation access token). The GitHub App private
  -- key itself is never stored here; it lives only in server environment
  -- configuration. See packages/github/src/crypto.ts.
  encrypted_credentials_reference jsonb,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index github_installations_org_id_idx on github_installations (organization_id);
create unique index github_installations_installation_id_idx on github_installations (installation_id);

-- ---------------------------------------------------------------------------
-- repositories
-- ---------------------------------------------------------------------------
create table repositories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  github_installation_id uuid not null references github_installations (id) on delete cascade,
  provider_repository_id bigint not null,
  owner text not null,
  name text not null,
  default_branch text not null default 'main',
  is_private boolean not null default true,
  status text not null default 'active' check (status in ('active', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (github_installation_id, provider_repository_id)
);

create index repositories_org_id_idx on repositories (organization_id);
create index repositories_installation_id_idx on repositories (github_installation_id);
create index repositories_org_created_idx on repositories (organization_id, created_at);

-- ---------------------------------------------------------------------------
-- pull_requests
-- Each row is one revision (head_sha) of a PR, per the unique constraint
-- required by DATABASE_SCHEMA.md.
-- ---------------------------------------------------------------------------
create table pull_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  repository_id uuid not null references repositories (id) on delete cascade,
  provider_pr_number integer not null,
  head_sha text not null,
  base_sha text not null,
  title text not null,
  author text not null,
  state text not null default 'open' check (state in ('open', 'closed', 'merged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (repository_id, provider_pr_number, head_sha)
);

create index pull_requests_org_id_idx on pull_requests (organization_id);
create index pull_requests_repo_id_idx on pull_requests (repository_id);
create index pull_requests_org_created_idx on pull_requests (organization_id, created_at);
create index pull_requests_repo_number_idx on pull_requests (repository_id, provider_pr_number);

-- ---------------------------------------------------------------------------
-- validation_runs
-- ---------------------------------------------------------------------------
create table validation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  repository_id uuid not null references repositories (id) on delete cascade,
  pull_request_id uuid not null references pull_requests (id) on delete cascade,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'passed', 'failed', 'inconclusive', 'error', 'superseded')
  ),
  trigger text not null check (
    trigger in (
      'pull_request_opened',
      'pull_request_synchronize',
      'pull_request_reopened',
      'manual'
    )
  ),
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  decision text check (
    decision in ('pass', 'pass_with_warnings', 'changes_requested', 'inconclusive', 'system_error')
  ),
  superseded_by uuid references validation_runs (id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index validation_runs_org_id_idx on validation_runs (organization_id);
create index validation_runs_repo_id_idx on validation_runs (repository_id);
create index validation_runs_pr_id_idx on validation_runs (pull_request_id);
create index validation_runs_org_created_idx on validation_runs (organization_id, created_at);
create index validation_runs_superseded_by_idx on validation_runs (superseded_by);

-- ---------------------------------------------------------------------------
-- audit_events (append-only at the application level; DB grants below
-- additionally revoke UPDATE/DELETE from the application role)
-- ---------------------------------------------------------------------------
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  actor_type text not null check (actor_type in ('user', 'system', 'github')),
  actor_id text,
  action text not null,
  target_type text not null,
  target_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_org_id_idx on audit_events (organization_id);
create index audit_events_org_created_idx on audit_events (organization_id, created_at);

-- ---------------------------------------------------------------------------
-- webhook_deliveries
-- Not present in DATABASE_SCHEMA.md's table list, but required by its
-- constraint "unique idempotency key for webhook processing". organization_id
-- is nullable because some deliveries (e.g. `ping`, or an `installation`
-- event that has not yet been linked) precede org resolution.
-- ---------------------------------------------------------------------------
create table webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete set null,
  delivery_id text not null unique,
  event_type text not null,
  action text,
  status text not null default 'processed' check (status in ('processed', 'rejected', 'ignored')),
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index webhook_deliveries_org_id_idx on webhook_deliveries (organization_id);
create index webhook_deliveries_created_idx on webhook_deliveries (created_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger github_installations_set_updated_at before update on github_installations
  for each row execute function set_updated_at();
create trigger repositories_set_updated_at before update on repositories
  for each row execute function set_updated_at();
create trigger pull_requests_set_updated_at before update on pull_requests
  for each row execute function set_updated_at();
