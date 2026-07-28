# Architecture

## 1. Architectural principle

Separate the **control plane** from the **execution plane**.

The control plane manages users, organizations, repositories, policies, findings, billing, and orchestration. The execution plane runs untrusted repository code in ephemeral isolated workers.

## 2. Logical architecture

```text
GitHub
  |
  | signed webhook
  v
Webhook Ingress
  |
  v
Validation Orchestrator -----> PostgreSQL
  |                               |
  | enqueue                       +--> policies, runs, findings, audit
  v
Job Queue
  |
  v
Ephemeral Sandbox Worker
  |
  +--> checkout exact commit
  +--> deterministic tools
  +--> structured artifacts
  |
  v
Context Builder
  |
  v
Primary Logic Reviewer
  |
  v
Independent Verifier
  |
  v
Decision Engine
  |
  +--> GitHub Check
  +--> Dashboard
  +--> Audit Trail
```

## 3. Suggested stack

### Control plane
- Next.js App Router with TypeScript
- PostgreSQL/Supabase
- Supabase Auth initially
- Stripe
- Queue/orchestration: Trigger.dev, Inngest, or BullMQ
- Object storage for compressed logs and artifacts
- OpenTelemetry and Sentry

### Execution plane
- Separate worker service
- Ephemeral Docker or microVM sandbox
- Restricted egress
- CPU, memory, process, filesystem, and time limits
- Disposable workspace
- No production credentials

## 4. Services/modules

```text
apps/
  web/
  worker/
packages/
  db/
  auth/
  github/
  queue/
  policy-engine/
  validation-core/
  deterministic-runners/
  repository-intelligence/
  ai-gateway/
  finding-engine/
  observability/
  shared-types/
```

Start as a modular monorepo. Do not prematurely split every package into a network service.

## 5. AI provider abstraction

```ts
export interface ReviewModel {
  review(input: ReviewInput): Promise<ReviewResult>;
  challenge(input: ChallengeInput): Promise<ChallengeResult>;
  generateTests?(input: TestGenerationInput): Promise<TestProposal[]>;
}
```

The domain layer must not import a provider SDK directly. Provider-specific code belongs under adapters.

## 6. Event model

Important events:

- `repository.connected`
- `repository.profiled`
- `pull_request.received`
- `validation.queued`
- `sandbox.started`
- `deterministic_check.completed`
- `semantic_review.completed`
- `finding.created`
- `finding.challenged`
- `validation.completed`
- `github_check.published`
- `finding.feedback_received`

Events must be idempotent.

## 7. Multi-tenancy

- Every tenant-owned table has `organization_id`.
- Service functions require an authorization context.
- RLS is defense in depth, not the only protection.
- Storage paths are organization-scoped.
- Queue jobs include organization and repository identifiers.
- Workers receive only scoped, short-lived credentials.

## 8. Failure behavior

- A failed validator must not be represented as a passed validator.
- Timeout is `inconclusive`, not `pass`.
- Provider failure triggers configured fallback or partial report.
- High-risk validation fails closed only when organization policy explicitly requires it.
- Duplicate webhooks must not create duplicate billable runs.

## 9. Versioning

Persist:
- prompt version;
- policy version;
- rule version;
- repository snapshot;
- model provider and exact model identifier;
- deterministic tool versions;
- decision-engine version.
