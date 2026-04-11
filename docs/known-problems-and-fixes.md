# Known Problems and Fixes

This is the current issue inventory based on codebase review.

## A. Product and retention problems

### 1) Retention loop is weak
Problem:
- Core modules are strong, but there is no explicit weekly habit loop documented and enforced in product behavior.
- Active-day events exist, but there is no documented retention dashboard or targets wired to product decisions.

Impact:
- Users can complete onboarding then drop off before reaching real readiness milestones.

Fixes:
- Define and ship a weekly loop: check dashboard -> complete one module action -> sync progress -> next action set.
- Add a retention KPI section to product reviews: D1, D7, D30 and weekly active progression users.
- Add in-app nudges for users with 7+ days inactivity.

### 2) Messaging mismatch risk around hiring window
Problem:
- Some product copy treats Aug-Mar as one long cycle, while backend recruiting seasons are modeled as Peak (Aug-Dec) and Lower (Jan-Mar).

Impact:
- Users and contributors may receive mixed timing guidance.

Fixes:
- Keep backend season model as canonical and align frontend wording everywhere.
- Add one standardized copy block for season definitions and reuse it across modules.

### 3) Onboarding friction can reduce activation
Problem:
- Onboarding asks for project signals and optional resume link; this can feel heavy for early users.

Impact:
- Drop-off before first value moment.

Fixes:
- Track onboarding step conversion rates.
- Add explicit fast-path for users with no repo/resume yet.
- Show clearer immediate next steps post-onboarding.

## B. Engineering and consistency problems

### 4) Threshold and heuristic duplication
Problem:
- Important numbers exist in multiple files (for example LeetCode targets and threshold-heavy copy).

Impact:
- Drift bugs when one location changes and others do not.

Fixes:
- Consolidate business constants in backend service/config module.
- Return constants in summary API payload and consume from frontend.

### 5) UI standardization is partial
Problem:
- Module redesign styling is not yet fully normalized across all pages/components.
- No centralized design-token primitives layer.

Impact:
- Visual drift and inconsistent UX quality.

Fixes:
- Implement shared primitives and semantic tokens.
- Migrate old pages incrementally to tokenized standards.

### 6) No central docs source existed before this set
Problem:
- Rules were mostly discoverable only by reading routes/services/migrations.

Impact:
- Harder for new contributors and AI agents to build aligned features.

Fixes:
- Keep docs in this folder as required update in every behavior-changing PR.

### 7) Next lint setup is incomplete
Problem:
- Running npm run lint triggers interactive first-time setup in frontend.

Impact:
- CI and local quality checks are inconsistent.

Fixes:
- Add non-interactive ESLint config committed to repo.
- Add lint script enforcement in CI.

### 8) Project evaluation logic has two separate service paths
Problem:
- There is architecture-evaluation logic in both project_analyzer.py and project_assessment.py with overlapping concerns.

Impact:
- Higher maintenance cost and potential behavior divergence.

Fixes:
- Decide one canonical evaluator path per use-case and document boundaries.
- Extract common helper layer for selection/parsing/error handling.

## C. Data and analytics problems

### 9) Event taxonomy is not documented
Problem:
- Tracking exists in backend and frontend, but no canonical event dictionary in docs.

Impact:
- Hard to trust metrics and compare funnels over time.

Fixes:
- Add analytics event catalog doc with owner, trigger, and payload schema.

### 10) No formal experiment process documented
Problem:
- Product changes (copy, thresholds, flow) do not have a documented experiment/rollback template.

Impact:
- Changes can ship without measurable validation.

Fixes:
- Add lightweight experiment template: hypothesis, metric, guardrail, rollout, rollback.

## Immediate priorities (recommended)
1. Finish constant centralization and remove threshold duplication.
2. Standardize season messaging from backend model across all modules.
3. Define retention loop and dashboard targets.
4. Complete ESLint config + CI lint enforcement.
5. Continue UI token/primitives rollout across remaining modules.
