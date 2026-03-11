# Pre-Deploy Must-Do Checklist (MVP)

Last updated: 2026-03-10

## 1) Security + Auth (Do first)
- [x] Add rate limiting for `POST /auth/login` and `POST /auth/register`.
- [x] Move auth from `localStorage` token storage to `HttpOnly + Secure + SameSite` cookie auth.
- [x] Invalidate active sessions/tokens after password change.
- [x] Make protected-route auth checks fail closed (do not render app shell on auth-check failure).
- [ ] Add security headers: CSP baseline, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- [ ] Rotate production secrets and verify leaked/deprecated keys are not active.
- [ ] Verify production hardening: HTTPS only, production CORS origins, debug off, production DB, strong secrets.

## 2) Reliability + Observability
- [ ] Add error monitoring (frontend + backend).
- [ ] Add analytics for core funnel events (signup, onboarding complete, module completion, resume scoring, etc.).
- [ ] Add dependency vulnerability checks in CI (`npm audit`, `pip-audit`, or equivalent).

## 3) Product/SEO (Do last)
- [ ] Add favicon + app icons.
- [ ] Add SEO metadata baseline (title template, description, canonical, `metadataBase`, OG/Twitter tags).
- [ ] Add `robots.txt`.
- [ ] Add `sitemap.xml`.
- [ ] Add OG social preview image.

## Inputs Needed (for Product/SEO)
- [ ] Public domain/canonical URL.
- [ ] Favicon/icon assets.
- [ ] OG image (`1200x630`) + headline/description copy.
