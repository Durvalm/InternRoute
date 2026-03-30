from __future__ import annotations

from datetime import date, timedelta
from typing import Any


SEASON_PEAK = "peak"
SEASON_LOWER = "lower"
SEASON_OFF = "off"

TRACK_DURATION_WEEKS: dict[str, int] = {
  "foundation_start": 31,  # ~7 months
  "coding_base_build_depth": 23,  # ~5 months
  "emerging_builder": 10,  # ~2 months
  "strong_builder_needs_positioning": 6,  # ~1 month
  "acceleration_track": 2,  # ~2 weeks
}


def _season_for_day(day: date) -> str:
  if day.month >= 8:
    return SEASON_PEAK
  if day.month <= 3:
    return SEASON_LOWER
  return SEASON_OFF


def _next_peak_start(from_day: date) -> date:
  candidate = date(from_day.year, 8, 1)
  if from_day <= candidate:
    return candidate
  return date(from_day.year + 1, 8, 1)


def _next_lower_start(from_day: date) -> date:
  candidate = date(from_day.year, 1, 1)
  if from_day <= candidate:
    return candidate
  return date(from_day.year + 1, 1, 1)


def _peak_cycle_open_for_day(day: date) -> date:
  return date(day.year, 8, 1)


def build_onboarding_timeline_plan(
  *,
  today: date,
  graduation_date: date | None,
  track_key: str,
) -> dict[str, Any]:
  duration_weeks = TRACK_DURATION_WEEKS.get(track_key, TRACK_DURATION_WEEKS["foundation_start"])
  estimated_ready_date = today + timedelta(weeks=duration_weeks)
  season_at_ready = _season_for_day(estimated_ready_date)
  peak_cycle_open = _peak_cycle_open_for_day(estimated_ready_date)
  next_peak_open = _next_peak_start(estimated_ready_date)
  next_lower_open = _next_lower_start(estimated_ready_date)

  ready_after_graduation = graduation_date is not None and estimated_ready_date > graduation_date
  graduates_before_next_peak = graduation_date is not None and graduation_date < next_peak_open

  recommendation_key = "prepare_for_peak"
  recommendation_title = "Prepare now, push hardest in peak season"
  recommendation_summary = (
    "Use this prep window to tighten projects and resume, then push applications hard when peak hiring opens."
  )
  recommended_start_date = next_peak_open
  recommended_season = SEASON_PEAK

  if ready_after_graduation:
    recommendation_key = "urgent_no_wait"
    recommendation_title = "No time buffer - apply as soon as you're ready"
    recommendation_summary = (
      "Your estimated readiness is after graduation. Don't wait for a later cycle - apply as soon as you are ready and keep improving weekly."
    )
    recommended_start_date = estimated_ready_date
    recommended_season = season_at_ready
  elif season_at_ready == SEASON_PEAK:
    recommendation_key = "apply_in_peak"
    recommendation_title = "You're ready in peak season"
    recommendation_summary = (
      "You'll be ready while internship hiring volume is highest. Start applying as soon as you hit readiness."
    )
    recommended_start_date = estimated_ready_date
    recommended_season = SEASON_PEAK
  elif season_at_ready == SEASON_LOWER:
    if graduates_before_next_peak:
      recommendation_key = "lower_no_wait"
      recommendation_title = "Don't wait for next peak"
      recommendation_summary = (
        "You'll be ready in lower season and graduate before the next peak cycle. Start applying in lower season while improving signal."
      )
      recommended_start_date = estimated_ready_date
      recommended_season = SEASON_LOWER
    else:
      recommendation_key = "lower_then_peak"
      recommendation_title = "Build in lower season, push in peak season"
      recommendation_summary = (
        "Lower season is useful for selective opportunities, but your main push should be next peak when volume opens."
      )
      recommended_start_date = next_peak_open
      recommended_season = SEASON_PEAK
  elif season_at_ready == SEASON_OFF:
    if graduates_before_next_peak:
      recommendation_key = "off_no_wait"
      recommendation_title = "No time to wait - start as soon as ready"
      recommendation_summary = (
        "You'll be ready off-season and graduate before next peak. Start applying once ready and use off-cycle opportunities."
      )
      recommended_start_date = estimated_ready_date
      recommended_season = SEASON_OFF
    else:
      recommendation_key = "off_then_peak"
      recommendation_title = "Finish roadmap, then launch in peak season"
      recommendation_summary = (
        "Use off-season to finish readiness, then start applications when peak hiring opens for better role volume."
      )
      recommended_start_date = next_peak_open
      recommended_season = SEASON_PEAK

  return {
    "estimated_ready_date": estimated_ready_date.isoformat(),
    "estimated_duration_weeks": duration_weeks,
    "season_at_ready": season_at_ready,
    "peak_cycle_open": peak_cycle_open.isoformat(),
    "peak_reference_is_current_cycle": season_at_ready == SEASON_PEAK,
    "next_peak_open": next_peak_open.isoformat(),
    "next_lower_open": next_lower_open.isoformat(),
    "recommended_start_date": recommended_start_date.isoformat(),
    "recommended_season": recommended_season,
    "recommendation_key": recommendation_key,
    "recommendation_title": recommendation_title,
    "recommendation_summary": recommendation_summary,
    "peak_hiring_note": "Peak internship hiring usually opens in August and stays strong through December.",
    "season_explainer": "Peak: Aug-Dec, Lower: Jan-Mar, Off: Apr-Jul.",
    "ready_after_graduation": ready_after_graduation,
    "graduates_before_next_peak": graduates_before_next_peak,
    "graduation_date": graduation_date.isoformat() if graduation_date else None,
  }
