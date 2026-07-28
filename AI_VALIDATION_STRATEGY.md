# AI Validation Strategy

## 1. Core rule

Zod.ai must not use one language model as both author and unquestioned judge.

The validation hierarchy is:

1. Deterministic facts
2. Structural/static analysis
3. Runtime evidence
4. Primary semantic review
5. Independent challenge
6. Human approval for high-risk ambiguity

## 2. What AI should validate

AI is useful for questions that are not completely captured by compilers or tests:

- Does the implementation satisfy the stated requirement?
- Are important branches or edge cases missing?
- Is the code inconsistent with project architecture?
- Does a test merely mirror implementation instead of proving behavior?
- Is an authorization check present but semantically ineffective?
- Did the change update one side of a cross-service contract but not the other?
- Is error handling likely to produce incorrect user-visible behavior?
- Does the change contradict repository-specific rules?

AI should not replace:
- compiler;
- linter;
- test runner;
- secret scanner;
- dependency scanner;
- schema validator;
- policy engine.

## 3. Recommended model topology

### Primary reviewer
Use the strongest code-reasoning model that meets your quality target. It receives:
- acceptance criteria;
- diff;
- relevant source context;
- architecture rules;
- deterministic results;
- affected contracts.

### Independent verifier
Use a strong model from a **different provider or model family**. Its task is not to repeat the review. It must:
- challenge each material finding;
- look for unsupported assumptions;
- identify missed high-risk issues;
- classify evidence strength;
- recommend confirm, downgrade, reject, or request more evidence.

### Economical classifier
Use a smaller, faster model for:
- file classification;
- log summarization;
- finding clustering;
- non-blocking explanation;
- routing.

Never use the cheapest model to make final high-risk security or merge decisions.

## 4. Practical launch configuration

A sensible starting setup:

- Primary semantic review: a top-tier Claude coding/reasoning model
- Independent verification: a top-tier OpenAI reasoning/coding model
- Fast classification and summarization: a lower-cost Gemini Flash-class or equivalent model
- Embeddings/retrieval: provider-independent embedding adapter
- Deterministic execution: TypeScript, ESLint, test runner, Semgrep, secret scanning, dependency audit, migration checks

Do not hard-code marketing names in business logic. Resolve exact current model identifiers through configuration, because model catalogs change.

## 5. Evidence contract

AI output must be structured:

```json
{
  "finding": {
    "title": "Organization ownership check can be bypassed",
    "severity": "critical",
    "category": "authorization",
    "claim": "The updated route fetches a tenant-owned record by id without constraining organization_id.",
    "evidence": [
      {
        "file": "app/api/orders/[id]/route.ts",
        "startLine": 42,
        "endLine": 48,
        "observation": "The query filters only by id."
      }
    ],
    "expectedBehavior": "Tenant-owned queries must constrain organization_id from authenticated context.",
    "confidence": 0.94,
    "requestedVerification": [
      "Run tenant-isolation policy check",
      "Inspect shared repository helper"
    ]
  }
}
```

Reject malformed or evidence-free model output.

## 6. Decision policy

A finding may block when one of these is true:

- deterministic failure;
- policy-as-code violation;
- reproducible runtime failure;
- structural rule with high confidence;
- semantic finding corroborated by independent review and high-risk policy.

An uncorroborated AI suspicion should normally be a warning, not an automatic block.

## 7. Evaluation dataset

Create a private golden dataset containing:
- safe changes;
- known logic bugs;
- authorization bugs;
- tenant-isolation bugs;
- incomplete feature implementations;
- misleading tests;
- database migration errors;
- fabricated APIs;
- dependency mistakes;
- webhook validation failures.

Each case needs expected findings and prohibited false positives.

## 8. Continuous evaluation

For every prompt or model change:
- run the golden dataset;
- compare precision and recall;
- compare cost and latency;
- inspect severity calibration;
- prevent regression before rollout;
- use canary deployment.

## 9. Feedback loop

Developer actions become labels:
- accepted;
- fixed;
- false positive;
- duplicate;
- irrelevant;
- intentionally accepted risk.

Do not automatically turn one dismissal into a global rule. Require repeated evidence or explicit user action.
