# Analytics Events (Current Inventory)

This inventory is extracted from current frontend and backend tracking calls.

## Frontend events
Source: frontend/src/lib/analytics.ts

- session_started
- active_day
- module_viewed
- logout_clicked

## Backend events
Sources: backend/app/analytics.py and route/service usages

- module_completed
- resume_score_requested
- resume_score_succeeded
- resume_score_failed
- project_evaluated
- onboarding_project_analyzed
- onboarding_assessment_finalized
- coding_skip_applied
- leetcode_linked
- leetcode_sync_succeeded
- leetcode_sync_failed

## Known gaps
- No formal schema document per event payload.
- No ownership metadata (who uses which event and for what decision).
- No event lifecycle policy (deprecate/rename/version).

## Next step
Add a table per event with:
- Trigger location
- Payload fields
- Primary dashboard use
- Data retention notes
