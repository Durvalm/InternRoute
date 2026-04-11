# Config and Environment

## Backend runtime config
Primary source: backend/app/config.py

Important env vars:
- APP_ENV
- SECRET_KEY
- JWT_SECRET_KEY
- DATABASE_URL
- CORS_ALLOWED_ORIGINS
- OPENAI_API_KEY
- GOOGLE_CLIENT_ID (optional)
- POSTHOG_API_KEY / POSTHOG_HOST
- SENTRY_DSN / SENTRY_ENVIRONMENT / SENTRY_RELEASE
- LEETCODE_API_BASE_URL / LEETCODE_API_TIMEOUT_SECONDS
- JUDGE0_BASE_URL and optional auth vars

## Frontend runtime config
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST
- NEXT_PUBLIC_SENTRY_DSN / NEXT_PUBLIC_SENTRY_ENVIRONMENT / NEXT_PUBLIC_SENTRY_RELEASE
- NEXT_PUBLIC_GOOGLE_CLIENT_ID

## Deployment reference
- Render manifest: render.yaml

## Current config risks
1. Multiple external services are optional by env; behavior changes silently when keys are missing.
2. No single documentation page existed before this set describing which variables are required per environment.
3. Some production assumptions are enforced in backend config, but frontend env requirements are not all mirrored in deployment docs.

## Recommended policy
- Keep one required/optional matrix for local, staging, production.
- Add startup checks for critical frontend env values in production builds.
- Document fallback behavior for each external dependency (PostHog, Sentry, Judge0, OpenAI, LeetCode API).
