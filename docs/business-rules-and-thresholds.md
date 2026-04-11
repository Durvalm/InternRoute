# Business Rules and Thresholds

This document captures the current implemented rules that drive readiness, progression, and timeline guidance.

## Canonical constants (current)

### Readiness and recruiting
- Ready threshold: `62`
  - Source: `backend/app/services/recruiting.py` (`READY_THRESHOLD`)
- Season mapping:
  - Peak: Aug-Dec
  - Lower: Jan-Mar
  - Off: Apr-Jul
  - Source: `backend/app/services/recruiting.py`

### Resume
- Resume pass threshold: `80`
  - Source: `backend/app/services/resume_scoring.py` (`PASS_THRESHOLD_SCORE`)
  - Used in progression sync: `backend/app/services/progression.py`

### LeetCode
- Completion target:
  - Total solved >= `50`
  - Medium solved >= `30`
  - Sources:
    - `backend/app/services/progression.py` (`LEETCODE_TOTAL_TARGET`, `LEETCODE_MEDIUM_TARGET`)
    - `backend/app/routes/leetcode.py` (`TOTAL_TARGET`, `MEDIUM_TARGET`)

### Onboarding coding skip
- Skip confidence threshold: `0.65`
  - Source: `backend/app/routes/onboarding_assessment.py` (`CODING_SKIP_CONFIDENCE_THRESHOLD`)

### Onboarding track durations
- `foundation_start`: 31 weeks
- `coding_base_build_depth`: 23 weeks
- `emerging_builder`: 10 weeks
- `strong_builder_needs_positioning`: 6 weeks
- `acceleration_track`: 2 weeks
- Source: `backend/app/services/onboarding_timeline.py` (`TRACK_DURATION_WEEKS`)

## Module weights and unlock thresholds
Source of seeded defaults: `backend/migrations/versions/8a1c9d2f4b6e_progression_foundation.py`

- Intro (`timeline`): weight 5, unlock 100
- Coding Skills (`coding`): weight 20, unlock 80
- Projects (`projects`): weight 30, unlock 80
- Resume (`resume`): weight 10, unlock 80
- Applications (`applications`): weight 5, unlock 100
- Interview Prep (`interview_prep`): weight 5, unlock 100
- LeetCode (`leetcode`): weight 25, unlock 80

## Progression formulas
Source: `backend/app/services/progression.py`

- Task-based module score:
  - `floor((completed_task_weight * 100) / total_task_weight)`
- Overall readiness score:
  - Weighted sum of module scores using `module.overall_weight`
  - Final value rounded to integer (`round(weighted_total / 100)`)
- Category readiness (coding/projects/resume):
  - Weighted average of modules in each category

## Module prerequisite behavior
- Users cannot complete later-module tasks if prerequisite modules are below unlock thresholds.
- Source: `module_completion_allowed_or_error` in `backend/app/services/progression.py`

## Journey timeline behavior
Source: `backend/app/routes/dashboard.py`

- Journey track key is selected from latest completed onboarding assessment.
- Journey target dates are computed from anchor date + cumulative weeks by track.
- Journey can be marked stale when target horizon has passed before user reaches readiness threshold.

## Drift risk (important)
Some constants are duplicated across files.

Examples:
- LeetCode targets exist in both route and progression service.
- Threshold numbers are also hardcoded in some frontend copy/UI logic.

Recommendation:
- Move all business constants to one backend config module (single source of truth).
- Have frontend consume thresholds from API summary payload whenever possible.
