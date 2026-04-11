# Module Specs

This file documents module-level behavior, completion gates, and the task identifiers currently used by progression logic.

## Intro (timeline)
- Purpose: teach recruiting timeline, seasons, and strategy.
- Completion model: checklist task, weighted 100.
- Known task seed: title-based timeline task (no stable challenge_id in migration seed).
- Unlock threshold: 100.

## Coding Skills (coding)
- Purpose: establish baseline coding logic and implementation ability.
- Completion model: challenge tasks (currently 5 active challenge IDs, each weighted 100 in task contract sync).
- Challenge IDs:
  - clean_username
  - word_counter
  - summarize_orders
  - cart_total
  - group_anagrams
- Unlock threshold: 80.
- Source files:
  - backend/app/services/skills_challenges.py
  - backend/migrations/versions/e3a8d5c1b2f4_sync_coding_challenge_tasks_to_contract.py

## Projects (projects)
- Purpose: verify backend project execution and architecture signal.
- Completion model: task completion synced from project submissions.
- Task IDs and logic:
  - projects_core_1: complete when passed project count >= 1
  - projects_core_2: complete when passed project count >= 2
  - projects_bonus_real_user: complete when a passed project includes deployed_url
- Unlock threshold: 80.
- Source files:
  - backend/app/routes/projects.py
  - backend/app/services/progression.py (sync_projects_submission_progress)

## Resume (resume)
- Purpose: ensure resume signal quality before scaling applications.
- Completion model: score-based task completion synced from best successful resume score.
- Task ID:
  - resume_pass_threshold
- Rule:
  - completed when best_successful_score >= 80
- Unlock threshold: 80.
- Source files:
  - backend/app/routes/resume.py
  - backend/app/services/progression.py (sync_resume_submission_progress)

## Applications (applications)
- Purpose: application system execution at volume.
- Completion model: checklist completion task.
- Task ID:
  - applications_checklist_complete
- Unlock threshold: 100.
- Source file:
  - backend/migrations/versions/1f9a8c7b6d5e_seed_applications_task.py

## Interview Prep (interview_prep)
- Purpose: interview conversion and preparation execution.
- Completion model: checklist completion task.
- Task ID:
  - interview_prep_checklist_complete
- Unlock threshold: 100.
- Source file:
  - backend/migrations/versions/2a4b6c8d0e1f_seed_interview_prep_task.py

## LeetCode (leetcode)
- Purpose: post-readiness interview depth and coding repetition.
- Completion model: synced verification task.
- Task IDs accepted by sync logic:
  - leetcode_verify_50_total_30_medium
  - leetcode_50_total_30_medium
- Rule:
  - complete when total_solved >= 50 and medium_solved >= 30
- Unlock threshold: 80.
- Source files:
  - backend/app/routes/leetcode.py
  - backend/app/services/progression.py (sync_leetcode_progress)

## Dependencies and sequence
Default order:
- timeline -> coding -> projects -> resume -> applications -> interview_prep -> leetcode

Source:
- backend/migrations/versions/8a1c9d2f4b6e_progression_foundation.py

## Notes for future changes
When changing any module completion behavior:
1. Update migration/task seed as needed.
2. Update progression sync logic.
3. Update dashboard summary/journey payloads if affected.
4. Update docs in this file and business-rules-and-thresholds.md.
