# Agent Standardization Guide (Codex and Claude)

Use this when implementing or modifying features.

## Source-of-truth order
1. business-rules-and-thresholds.md
2. module-specs.md
3. api-surface.md
4. ui-design-standards.md
5. known-problems-and-fixes.md

If any source file in code contradicts these docs, update docs and code in the same PR.

## Required checklist for any feature PR
1. Product behavior: does it change thresholds, heuristics, progression, or season logic?
2. API contract: does request/response shape change?
3. UI standard: does it follow the size/color/radius conventions?
4. Analytics: is an event added/changed/removed and documented?
5. Docs update: were affected docs updated in this folder?

## Rules for threshold/heuristic changes
- Never hardcode new business constants in frontend copy only.
- Update backend constant source first.
- Expose values to frontend through API when user-facing.
- Add migration if module/task thresholds change in persistent data.

## Rules for module changes
- Keep challenge/task IDs stable unless a migration and compatibility plan is included.
- For new module tasks, define:
  - challenge/task identifier
  - completion trigger
  - weight
  - prerequisite behavior

## Rules for UI work
- Reuse existing module shell patterns before inventing new ones.
- Prefer semantic color roles over page-specific random colors.
- Keep typography scale aligned with module standards.

## Rules for retention-oriented features
For any feature intended to improve retention, document:
- Hypothesis
- Primary metric (for example D7 retention or weekly active progression users)
- Guardrail metric
- Rollout and rollback criteria

## Definition of done (documentation)
A feature is not done until docs are aligned in docs/.
