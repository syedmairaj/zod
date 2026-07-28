# Design System

## 1. Brand direction

Zod.ai should feel precise, technical, fast, and trustworthy.

Avoid generic AI imagery, excessive neon, robot illustrations, and unrestrained glassmorphism.

## 2. Product personality

- Evidence over hype
- Calm authority
- Technical clarity
- Fast feedback
- Visible control
- Premium restraint

## 3. Visual language

- Dark graphite and neutral surfaces
- High-contrast typography
- Fine grid and code-oriented spatial rhythm
- Controlled gradient accents
- Thin borders
- Clear severity states
- Subtle depth
- Motion that explains system activity

Do not hard-code a large color palette before accessibility testing.

## 4. Typography

Use a modern grotesk/sans for product text and a readable monospaced face for code, evidence, hashes, and logs. Use licensed or system/web-safe fonts; do not bundle unauthorized font files.

## 5. Motion

Motion must communicate:
- validation progress;
- dependency traversal;
- evidence appearing;
- risk escalation;
- merge decision.

Rules:
- respect reduced-motion preference;
- avoid continuous decorative animation;
- keep interactions responsive;
- animate opacity and transforms where possible;
- do not delay content for animation.

## 6. Key screens

### Marketing hero
- headline: “The reliability layer for AI-generated code.”
- interactive PR validation demonstration
- real findings, not abstract particles
- immediate repository CTA

### Validation report
- overall decision
- risk score with explanation
- deterministic checks
- findings grouped by severity
- file evidence
- independent-verifier status
- timeline
- rerun and feedback controls

### Repository brain
- architecture map
- contracts
- rules
- detected stack
- indexing status

### Policy editor
- allow
- warn
- require approval
- block

## 7. Accessibility

- WCAG AA contrast
- full keyboard operation
- visible focus
- semantic status text in addition to icons
- no color-only severity indicators
- screen-reader labels for diff controls
