# Pre-Deploy Must-Do Checklist (MVP)

Last updated: 2026-03-10

## 2) Reliability + Observability

- [x] Add error monitoring (frontend + backend).
- [x] Add analytics for core MVP events (signup/login/session/active day, module progression, resume scoring, leetcode sync). See `ANALYTICS_MVP_SCHEMA.md`.
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
