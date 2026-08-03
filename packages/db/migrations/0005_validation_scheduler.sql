-- Milestone 3: validation scheduler / worker control-plane fields.
-- Additive. Does not execute repository code. Rollback: drop new columns /
-- indexes / trigger / status constraint and restore prior status check.

-- ---------------------------------------------------------------------------
-- Status vocabulary: scheduler lifecycle (not code-correctness decisions)
-- ---------------------------------------------------------------------------
alter table validation_runs drop constraint if exists validation_runs_status_check;

-- Legacy unused product statuses → honest scheduler terminals before re-check.
update validation_runs set status = 'failed' where status = 'error';
update validation_runs set status = 'completed' where status in ('passed', 'inconclusive');

alter table validation_runs
  add constraint validation_runs_status_check check (
    status in (
      'queued',
      'claimed',
      'preparing',
      'running',
      'collecting',
      'completed',
      'failed',
      'timed_out',
      'cancelled',
      'superseded'
    )
  );

-- ---------------------------------------------------------------------------
-- Lease / retry / cancellation / timeout / result columns
-- ---------------------------------------------------------------------------
alter table validation_runs
  add column if not exists claimed_at timestamptz;

alter table validation_runs
  add column if not exists claimed_by text;

alter table validation_runs
  add column if not exists lease_expires_at timestamptz;

alter table validation_runs
  add column if not exists heartbeat_at timestamptz;

alter table validation_runs
  add column if not exists attempt_count integer not null default 0;

alter table validation_runs
  add column if not exists max_attempts integer not null default 3;

alter table validation_runs
  add column if not exists available_at timestamptz not null default now();

alter table validation_runs
  add column if not exists cancellation_requested_at timestamptz;

alter table validation_runs
  add column if not exists cancelled_at timestamptz;

alter table validation_runs
  add column if not exists timeout_at timestamptz;

alter table validation_runs
  add column if not exists failure_code text;

alter table validation_runs
  add column if not exists failure_message text;

alter table validation_runs
  add column if not exists run_version integer not null default 1;

alter table validation_runs
  add column if not exists updated_at timestamptz not null default now();

alter table validation_runs
  add column if not exists scheduler_result_json jsonb;

comment on column validation_runs.claimed_by is
  'Stable worker identity that currently owns the lease.';
comment on column validation_runs.available_at is
  'Earliest time a queued run may be claimed (supports delayed retry).';
comment on column validation_runs.attempt_count is
  'Number of claim attempts so far; begins at 0; incremented atomically on claim.';
comment on column validation_runs.scheduler_result_json is
  'Bounded structured scheduler placeholder result. Not a code-validation verdict.';
comment on column validation_runs.run_version is
  'Monotonic ownership generation; incremented on each successful claim.';

alter table validation_runs drop constraint if exists validation_runs_attempt_count_check;
alter table validation_runs
  add constraint validation_runs_attempt_count_check check (attempt_count >= 0);

alter table validation_runs drop constraint if exists validation_runs_max_attempts_check;
alter table validation_runs
  add constraint validation_runs_max_attempts_check check (max_attempts >= 1);

alter table validation_runs drop constraint if exists validation_runs_run_version_check;
alter table validation_runs
  add constraint validation_runs_run_version_check check (run_version >= 1);

alter table validation_runs drop constraint if exists validation_runs_failure_message_len;
alter table validation_runs
  add constraint validation_runs_failure_message_len check (
    failure_message is null or char_length(failure_message) <= 500
  );

-- Backfill: existing queued rows are immediately claimable.
update validation_runs
set available_at = created_at
where available_at is distinct from created_at
  and status = 'queued'
  and claimed_at is null;

-- ---------------------------------------------------------------------------
-- Indexes for claim polling and stale-lease recovery
-- ---------------------------------------------------------------------------
create index if not exists validation_runs_claim_idx
  on validation_runs (available_at, created_at)
  where status = 'queued';

create index if not exists validation_runs_stale_lease_idx
  on validation_runs (lease_expires_at)
  where status in ('claimed', 'preparing', 'running', 'collecting')
    and lease_expires_at is not null;

create index if not exists validation_runs_org_status_idx
  on validation_runs (organization_id, status);

create index if not exists validation_runs_claimed_by_idx
  on validation_runs (claimed_by)
  where claimed_by is not null;

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses set_updated_at from 0001)
-- ---------------------------------------------------------------------------
drop trigger if exists validation_runs_set_updated_at on validation_runs;
create trigger validation_runs_set_updated_at before update on validation_runs
  for each row execute function set_updated_at();
