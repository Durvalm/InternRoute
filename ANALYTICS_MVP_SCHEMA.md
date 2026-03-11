# Analytics Event Schema (MVP)

Last updated: 2026-03-11

## Goal

Track activation, outcome, and retention for beta users with a small, stable event set.

## Rules

- Use these event names exactly as written.
- Do not send PII (email, resume text, tokens, cookies, raw headers).
- Send `active_day` at most once per user per calendar day.
- Prefer server-side tracking for backend outcomes (resume + leetcode results).
- Keep all timestamps in ISO-8601 UTC.

## Required Properties (all events)

- `user_id` (string or int)
- `env` (`development`, `staging`, `production`)
- `app_version` (git SHA or release id)
- `platform` (`web` for now)
- `timestamp` (ISO-8601 UTC)

## Event Definitions

### 1) `signup_completed`

- Trigger: account creation succeeds.
- Extra properties: `auth_method` (`email_password`)

### 2) `login_succeeded`

- Trigger: login API succeeds.
- Extra properties: `auth_method` (`email_password`)

### 3) `session_started`

- Trigger: authenticated app shell loads (after `/auth/me` success).
- Extra properties: `entry_path` (example: `/dashboard`)

### 4) `active_day`

- Trigger: first authenticated app activity for that user on a given UTC date.
- Extra properties: `active_date` (`YYYY-MM-DD`)

### 5) `module_viewed`

- Trigger: user opens a module page.
- Extra properties: `module_key` (example: `timeline`, `projects`, `resume`, `leetcode`)

### 6) `module_completed`

- Trigger: module is marked complete by backend progression logic.
- Extra properties: `module_key`, `score` (0-100), `unlock_threshold` (int)

### 7) `project_submitted`

- Trigger: project submission successfully created/updated.
- Extra properties: `project_id`, `module_key` (if tied to a module)

### 8) `resume_score_requested`

- Trigger: resume score request accepted by backend.
- Extra properties: `file_size_bytes`

### 9) `resume_score_succeeded`

- Trigger: resume scoring finishes successfully.
- Extra properties: `submission_id`, `overall_score`, `provider`, `model`, `elapsed_ms`

### 10) `resume_score_failed`

- Trigger: resume scoring fails.
- Extra properties: `submission_id` (nullable), `error_code`, `status_code`

### 11) `leetcode_linked`

- Trigger: LeetCode username link succeeds.
- Extra properties: `leetcode_username` (optional; can be hashed if you prefer)

### 12) `leetcode_sync_succeeded`

- Trigger: LeetCode sync succeeds.
- Extra properties: `total_solved`, `medium_solved`, `hard_solved`

### 13) `leetcode_sync_failed`

- Trigger: LeetCode sync fails.
- Extra properties: `error_code`, `status_code`

### 14) `logout_clicked`

- Trigger: user clicks logout.
- Extra properties: `from_path`

## MVP Dashboards

### 1) Activation Funnel

`signup_completed -> login_succeeded -> first module_completed`

### 2) Outcome Funnel

`first module_completed -> resume_score_succeeded` and `first module_completed -> leetcode_sync_succeeded`

### 3) Retention

- DAU/WAU/MAU from `active_day`
- D1 and D7 retention cohorts from `active_day`

### 4) Reliability

- Resume success rate: `resume_score_succeeded / (resume_score_succeeded + resume_score_failed)`
- LeetCode sync success rate: `leetcode_sync_succeeded / (leetcode_sync_succeeded + leetcode_sync_failed)`
