# Deploy Fix Tracker

Last updated: 2026-03-10

Purpose: track pre-deploy fixes discussed in audit, in the same numbering used in chat.

## Active Fixes

1. Advanced onboarding coding override bug
- Status: `completed`
- Summary: Advanced users are assigned an override score, but scoring currently uses task completion first, so override is effectively ignored.
- Decision needed: keep coding skill level + advanced behavior, or remove coding skill level from onboarding.
- Current recommendation (2026-03-10): keep modules open for everyone and remove self-reported-skill scoring effects. Keep `coding_skill_level` as profile metadata only (or remove the question later if you don't use it for personalization).
- Applied (2026-03-10): removed coding skill from onboarding/profile flow and removed override scoring logic; readiness now stays objective (task/submission-based).

2. Module lock vs open access model alignment
- Status: `completed`
- Summary: product direction is to keep modules visible/open.
- Action: align naming/logic to "recommended path" (not hard unlock semantics).
- Applied (2026-03-10): modules remain viewable, but completion credit is now blocked until prior modules are completed; backend enforcement added for checklist/task completion and module-completion actions.

3. Project progression duplicate inflation risk
- Status: `accepted_for_now`
- Summary: duplicate project passes can inflate progress; currently mitigated by manual review policy.

4. Resume content tone ("embellish")
- Status: `accepted_for_now`
- Summary: product owner preference is to keep current tone/lingo.

5. Production config wiring
- Status: `completed`
- Summary: configure production CORS, frontend API URL, secrets, DB, and service endpoints.
- Applied (2026-03-10): backend now supports `APP_ENV` + `FLASK_DEBUG` toggles, env-driven CORS origins, env-driven host/port runtime, and production guardrails for DB/CORS. Frontend now requires `NEXT_PUBLIC_API_URL` in production (local fallback only in development). Added env templates for backend/frontend.

6. Lint/CI setup
- Status: `deferred`
- Summary: intentionally not prioritized right now.

7. Resume scoring availability
- Status: `completed`
- Summary: remove disable flag path and require scorer configuration (always-on behavior).
- Applied (2026-03-10): removed `RESUME_SCORER_ENABLED` gating from resume scoring flow; scorer is always active. Added production config guard requiring `OPENAI_API_KEY` when `APP_ENV=production`.

8. Threshold/docs alignment
- Status: `completed`
- Summary: docs and product messaging should reflect the implemented readiness threshold.
- Applied (2026-03-10): aligned docs with implementation (`ready` threshold = 62%, module completion target = 80%), and removed frontend hardcoded readiness badge text by wiring threshold from backend recruiting payload.

9. Graduation date fallback UX
- Status: `pending`
- Summary: replace fake fallback date with explicit "not set" state.

10. Opportunities WIP state
- Status: `accepted_for_now`
- Summary: acceptable for MVP.

11. Production runtime mode
- Status: `completed`
- Summary: ensure non-debug production run path.
- Applied (2026-03-10): removed hardcoded `debug=True` and wired runtime mode to environment configuration.

## Next Up

- #9 (current)
