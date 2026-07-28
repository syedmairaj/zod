# Database Schema

Use PostgreSQL UUID primary keys and UTC timestamps.

## Core tables

### organizations
- id
- name
- slug
- plan
- created_at
- updated_at

### organization_members
- organization_id
- user_id
- role
- created_at

### github_installations
- id
- organization_id
- installation_id
- account_login
- encrypted_credentials_reference
- status
- created_at
- updated_at

### repositories
- id
- organization_id
- github_installation_id
- provider_repository_id
- owner
- name
- default_branch
- is_private
- status
- created_at
- updated_at

### repository_profiles
- id
- organization_id
- repository_id
- commit_sha
- framework
- language
- package_manager
- commands_json
- architecture_summary
- profile_version
- created_at

### project_rules
- id
- organization_id
- repository_id
- name
- description
- category
- severity
- enforcement
- rule_definition_json
- source
- version
- enabled
- created_at
- updated_at

### pull_requests
- id
- organization_id
- repository_id
- provider_pr_number
- head_sha
- base_sha
- title
- author
- state
- created_at
- updated_at

### validation_runs
- id
- organization_id
- repository_id
- pull_request_id
- status
- trigger
- risk_level
- decision
- superseded_by
- started_at
- completed_at
- created_at

### validation_steps
- id
- organization_id
- validation_run_id
- step_type
- tool_name
- tool_version
- status
- result_summary
- artifact_reference
- started_at
- completed_at

### model_invocations
- id
- organization_id
- validation_run_id
- provider
- model_identifier
- purpose
- prompt_version
- input_tokens
- output_tokens
- latency_ms
- cost_usd
- status
- created_at

### findings
- id
- organization_id
- validation_run_id
- repository_id
- fingerprint
- title
- claim
- category
- severity
- confidence
- confidence_basis
- source_type
- blocking
- status
- suggested_fix
- created_at
- updated_at

### finding_evidence
- id
- organization_id
- finding_id
- evidence_type
- file_path
- start_line
- end_line
- observation
- artifact_reference
- created_at

### finding_feedback
- id
- organization_id
- finding_id
- user_id
- feedback_type
- comment
- created_at

### sandbox_runs
- id
- organization_id
- validation_run_id
- provider
- image_digest
- status
- cpu_limit
- memory_limit_mb
- timeout_seconds
- exit_code
- started_at
- completed_at

### audit_events
- id
- organization_id
- actor_type
- actor_id
- action
- target_type
- target_id
- metadata_json
- created_at

### usage_records
- id
- organization_id
- validation_run_id
- metric
- quantity
- cost_usd
- created_at

## Constraints

- Unique `(repository_id, provider_pr_number, head_sha)` for a PR revision.
- Unique idempotency key for webhook processing.
- Index every foreign key.
- Index `(organization_id, created_at)` on tenant activity tables.
- Unique finding fingerprint within a validation run.
- Check constraints for enums where practical.

## RLS

Every tenant table must restrict rows to authenticated organization membership. Background workers should use narrowly scoped server authorization, not browser credentials.
