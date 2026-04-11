# System Overview

## Stack
- Frontend: Next.js + React + Tailwind
- Backend: Flask + SQLAlchemy + Alembic
- DB: Postgres
- Infra: Render (API + Postgres)

## High-level flow
1. User signs in and completes onboarding.
2. Dashboard summary aggregates progression, recruiting context, journey, and timeline plan.
3. Module interactions update tasks/submissions.
4. Progression service recomputes readiness + category scores and module unlock states.

## Key service boundaries
- Progression engine: backend/app/services/progression.py
- Recruiting window logic: backend/app/services/recruiting.py
- Onboarding timeline recommendations: backend/app/services/onboarding_timeline.py
- Module evaluation services:
  - skills challenge harness and Judge0 integration
  - projects AI evaluation
  - resume scoring provider integration
  - leetcode sync API

## Data backbone
- Users
- UserProgress
- Modules
- Tasks
- UserTaskCompletion
- ResumeSubmission
- ProjectSubmission
- LeetcodeProgress
- OnboardingAssessment and OnboardingProjectAssessment

See backend/app/models.py for exact schema.
