# Beta Deployment Runbook (Vercel + Render)

This runbook deploys:
- Frontend: Next.js app on Vercel
- Backend: Flask API on Render
- Database: Render Postgres

Use one root domain for both apps:
- `app.<yourdomain>.com` -> Vercel
- `api.<yourdomain>.com` -> Render

## 1) Backend on Render

This repo includes `render.yaml` at project root. It provisions:
- Web service: `internroute-api`
- Postgres database: `internroute-db`
- Production start command with Gunicorn
- Pre-deploy migration command: `flask db upgrade`

### Required Render environment values to set

In Render service env vars, set these before first production deploy:
- `CORS_ALLOWED_ORIGINS=https://app.<yourdomain>.com`
- `JWT_COOKIE_DOMAIN=<yourdomain.com>`
- `OPENAI_API_KEY=<your-openai-key>`

Recommended now:
- `SUPERUSER_EMAILS=<comma-separated-admin-emails>`
- `SENTRY_DSN=<backend-sentry-dsn>`
- `SENTRY_RELEASE=<git-sha-or-release-id>`
- `POSTHOG_API_KEY=<posthog-project-key>`
- `ANALYTICS_APP_VERSION=<git-sha-or-release-id>`
- `JUDGE0_API_KEY` / `JUDGE0_RAPIDAPI_HOST` / `JUDGE0_AUTH_TOKEN` (if required by your Judge0 provider)

### Backend sanity checks

After deploy:
- `GET https://api.<yourdomain>.com/` returns `{"status":"ok"}`
- Render deploy logs show `flask db upgrade` completed
- No `RuntimeError` about missing required env vars

## 2) Frontend on Vercel

Deploy `frontend/` as a Vercel project.

### Required Vercel environment values
- `NEXT_PUBLIC_API_URL=https://api.<yourdomain>.com`

Recommended now:
- `NEXT_PUBLIC_SENTRY_DSN=<frontend-sentry-dsn>`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
- `NEXT_PUBLIC_SENTRY_RELEASE=<git-sha-or-release-id>`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1`
- `NEXT_PUBLIC_POSTHOG_KEY=<posthog-project-key>`
- `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
- `NEXT_PUBLIC_POSTHOG_ENVIRONMENT=production`
- `NEXT_PUBLIC_APP_VERSION=<git-sha-or-release-id>`

## 3) Domain + DNS

1. Buy/add domain in your DNS provider.
2. Add `app.<yourdomain>.com` in Vercel custom domains.
3. Add `api.<yourdomain>.com` in Render custom domains.
4. Create DNS records exactly as Vercel/Render instruct.
5. Wait for TLS certificates to issue on both.

## 4) Go/No-Go Test Checklist

### Auth/session
- Register works.
- Login works.
- Refreshing a protected page keeps session.
- Opening a new tab stays authenticated.
- Logout clears session.
- Changing password invalidates prior sessions.

### Cross-origin + CSRF
- `POST`, `PATCH`, and `DELETE` from frontend succeed.
- Browser console has no CORS/CSRF errors.

### Core API flows
- Dashboard summary loads.
- Resume score request succeeds or fails with controlled error payload.
- LeetCode link/sync works with a valid username.

### Observability
- Frontend and backend errors appear in Sentry (if configured).
- Core analytics events appear in PostHog (if configured).

## 5) First Incident Triage

If login loops or every protected request is `401`:
- Confirm frontend is using `https://api.<yourdomain>.com`
- Confirm `CORS_ALLOWED_ORIGINS` exactly matches `https://app.<yourdomain>.com`
- Confirm `JWT_COOKIE_DOMAIN` is set to your root domain (example: `internroute.com`)
- Confirm both app and API are served over HTTPS
- Clear browser cookies and retry

If backend fails to boot:
- Check missing required env vars in Render logs
- Confirm `DATABASE_URL` is attached from `internroute-db`
- Confirm migrations succeeded (`flask db upgrade`)
