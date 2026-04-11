# API Surface (Current)

This is a practical contract map for the current backend routes used by the app.

## Auth and user
- /auth/*
  - login/register/google auth and session operations.
- /user/*
  - profile updates, graduation date, password changes.

## Dashboard
- GET /dashboard/summary
  - Returns readiness, module progress, recruiting view, journey payload, timeline plan.
- POST /dashboard/journey/rebaseline
  - Resets journey anchor date to today and recomputes journey and progress payload.
- GET /dashboard/tasks?module_key=...
  - Returns tasks for a module + completion state.
- PATCH /dashboard/tasks/{task_id}
  - Manually marks task complete/incomplete (subject to prerequisites).
- GET /dashboard/admin/engagement
  - Superuser endpoint for user/module completion overview.

## Skills module
- GET /skills/challenges
  - Challenge catalog/contracts.
- POST /skills/challenges/{challenge_id}/run
  - Runs code against sample tests.
- POST /skills/challenges/{challenge_id}/submit
  - Evaluates and may grant task completion.

## Projects module
- GET /projects/submissions
  - User project submission history.
- POST /projects/submissions
  - Creates submission from GitHub repo URL, runs AI architecture evaluation, syncs progression.

## Resume module
- GET /resume/submissions
  - Resume scoring submission history.
- POST /resume/score
  - Scores resume PDF and syncs progression.
  - Supports query context=onboarding for onboarding path.

## LeetCode module
- GET /leetcode/progress
- POST /leetcode/progress/link
- POST /leetcode/progress/sync

Behavior:
- Username link and sync fetch solved counts from external API.
- Completion granted at total >= 50 and medium >= 30.

## Onboarding assessment
- POST /onboarding/projects/analyze
  - Analyzes repo/upload signal for API/DB/coding capability.
- POST /onboarding/resume/link
  - Links a resume submission to onboarding draft.
- POST /onboarding/finalize
  - Finalizes track, may auto-sync modules (projects/resume/coding skip), returns timeline plan.

## Error handling conventions (current)
- Validation errors: 400
- Not found: 404
- Conflict/prerequisite/duplicate: 409
- Rate limit: 429 with Retry-After when applicable
- External dependency issues: usually 502/503

## Recommendation
Create OpenAPI-style schemas for these endpoints in a future docs iteration, with explicit field-level contracts and versioning notes.
