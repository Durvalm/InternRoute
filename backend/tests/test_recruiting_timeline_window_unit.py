from datetime import date

from app.services.onboarding_timeline import build_onboarding_timeline_plan
from app.services.recruiting import build_recruiting_view, calculate_summers_left


def test_dec_2026_grad_has_one_summer_left_but_peak_window_closed_in_april_2026():
  today = date(2026, 4, 17)
  graduation_date = date(2026, 12, 15)

  assert calculate_summers_left(today, graduation_date) == 1

  recruiting = build_recruiting_view(today=today, readiness_score=25, graduation_date=graduation_date)
  eligible_window = recruiting["eligible_target_window"]

  assert eligible_window["status"] == "window_closed_off_cycle"
  assert eligible_window["label"] == "Apply as soon as ready"
  assert eligible_window["window_start"] == "2025-08-01"
  assert eligible_window["window_end"] == "2026-03-31"



def test_future_eligible_window_for_aug_2028_graduation():
  today = date(2027, 1, 6)
  graduation_date = date(2028, 8, 15)

  recruiting = build_recruiting_view(today=today, readiness_score=75, graduation_date=graduation_date)
  eligible_window = recruiting["eligible_target_window"]

  assert eligible_window["status"] == "future_window"
  assert eligible_window["label"] == "Aug 2027 - Mar 2028"



def test_current_to_end_label_when_inside_lower_season_of_eligible_cycle():
  today = date(2027, 2, 5)
  graduation_date = date(2027, 12, 15)

  recruiting = build_recruiting_view(today=today, readiness_score=70, graduation_date=graduation_date)
  eligible_window = recruiting["eligible_target_window"]

  assert eligible_window["status"] == "current_to_end"
  assert eligible_window["label"] == "Current - Mar 2027"



def test_post_grad_or_ineligible_window_label():
  today = date(2026, 9, 1)
  graduation_date = date(2026, 6, 1)

  recruiting = build_recruiting_view(today=today, readiness_score=55, graduation_date=graduation_date)
  eligible_window = recruiting["eligible_target_window"]

  assert eligible_window["status"] == "post_grad_or_ineligible"
  assert eligible_window["label"] == "Apply as soon as ready"



def test_timeline_plan_avoids_apply_in_peak_when_last_eligible_peak_window_already_closed():
  plan = build_onboarding_timeline_plan(
    today=date(2026, 4, 17),
    graduation_date=date(2026, 12, 15),
    track_key="foundation_start",
  )

  assert plan["eligible_target_window"]["status"] == "window_closed_off_cycle"
  assert plan["recommendation_key"] == "off_no_wait"



def test_timeline_plan_uses_current_cycle_message_when_inside_eligible_window():
  plan = build_onboarding_timeline_plan(
    today=date(2027, 2, 5),
    graduation_date=date(2027, 12, 15),
    track_key="acceleration_track",
  )

  assert plan["eligible_target_window"]["status"] == "current_to_end"
  assert plan["recommendation_key"] == "lower_no_wait"
