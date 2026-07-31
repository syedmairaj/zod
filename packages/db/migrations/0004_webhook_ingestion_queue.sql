-- Milestone 2: webhook ingestion queue fields on validation_runs.
-- Keeps existing webhook_deliveries table name (already serves as GitHub
-- delivery idempotency store). Additive only.

-- Allow push-triggered runs without a pull request revision.
alter table validation_runs
  alter column pull_request_id drop not null;

alter table validation_runs
  add column if not exists commit_sha text;

alter table validation_runs
  add column if not exists webhook_delivery_id text;

comment on column validation_runs.commit_sha is
  'Commit SHA the run is bound to (PR head or push tip). Required for enqueue.';
comment on column validation_runs.webhook_delivery_id is
  'GitHub X-GitHub-Delivery id that enqueued this run, when applicable.';

-- Expand trigger vocabulary for push events.
alter table validation_runs drop constraint if exists validation_runs_trigger_check;
alter table validation_runs
  add constraint validation_runs_trigger_check check (
    trigger in (
      'pull_request_opened',
      'pull_request_synchronize',
      'pull_request_reopened',
      'push',
      'manual'
    )
  );

-- PR-triggered runs must keep a pull_request_id; push may omit it.
alter table validation_runs drop constraint if exists validation_runs_pr_or_push_check;
alter table validation_runs
  add constraint validation_runs_pr_or_push_check check (
    (trigger = 'push' and pull_request_id is null)
    or (trigger <> 'push' and pull_request_id is not null)
  );

create index if not exists validation_runs_commit_sha_idx
  on validation_runs (organization_id, commit_sha);

create index if not exists validation_runs_webhook_delivery_id_idx
  on validation_runs (webhook_delivery_id);

create unique index if not exists validation_runs_delivery_trigger_uidx
  on validation_runs (webhook_delivery_id, trigger)
  where webhook_delivery_id is not null;
