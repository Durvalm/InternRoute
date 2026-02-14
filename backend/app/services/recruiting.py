from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any


SEASON_PEAK = "peak"
SEASON_LOWER = "lower"
SEASON_OFF = "off"
READY_THRESHOLD = 70


@dataclass
class RecruitingScenario:
  id: str
  name: str
  header: str
  subtext: str
  color_theme: str
  countdown_label: str
  countdown_target: date
  countdown_days: int
  countdown_direction: str
  show_one_summer_badge: bool

  def to_dict(self) -> dict[str, Any]:
    return {
      "id": self.id,
      "name": self.name,
      "header": self.header,
      "subtext": self.subtext,
      "color_theme": self.color_theme,
      "countdown_label": self.countdown_label,
      "countdown_target": self.countdown_target.isoformat(),
      "countdown_days": self.countdown_days,
      "countdown_direction": self.countdown_direction,
      "show_one_summer_badge": self.show_one_summer_badge,
    }


def _season_for_day(today: date) -> str:
  if today.month >= 8:
    return SEASON_PEAK
  if today.month <= 3:
    return SEASON_LOWER
  return SEASON_OFF


def _next_peak_start(today: date) -> date:
  year = today.year if today.month < 8 else today.year + 1
  return date(year, 8, 1)


def _recruiting_end_for_active_cycle(today: date, season: str) -> date | None:
  if season == SEASON_PEAK:
    return date(today.year + 1, 3, 31)
  if season == SEASON_LOWER:
    return date(today.year, 3, 31)
  return None


def _first_available_summer_year(today: date) -> int:
  return today.year if today < date(today.year, 8, 1) else today.year + 1


def _last_eligible_summer_year(graduation_date: date) -> int:
  cutoff = date(graduation_date.year, 8, 1)
  return graduation_date.year if graduation_date >= cutoff else graduation_date.year - 1


def calculate_summers_left(today: date, graduation_date: date | None) -> int | None:
  if graduation_date is None:
    return None
  first_year = _first_available_summer_year(today)
  last_year = _last_eligible_summer_year(graduation_date)
  return max(0, last_year - first_year + 1)


def _build_scenario(
  *,
  season: str,
  readiness_score: int,
  summers_left: int | None,
  today: date,
  recruiting_end: date | None,
  next_peak: date,
  graduation_date: date | None,
) -> RecruitingScenario:
  is_ready = readiness_score >= READY_THRESHOLD
  is_last_chance = summers_left == 1
  is_post_grad = summers_left is not None and summers_left <= 0

  if is_post_grad:
    target = graduation_date or today
    diff = (target - today).days
    return RecruitingScenario(
      id="K",
      name="Post-Graduation Mode",
      header="Transition: New Grad Mode",
      subtext="Internship windows are closed. Shift your strategy to full-time entry-level roles and selective off-season opportunities.",
      color_theme="slate",
      countdown_label="Since Graduation" if diff < 0 else "Until Graduation",
      countdown_target=target,
      countdown_days=abs(diff),
      countdown_direction="since" if diff < 0 else "until",
      show_one_summer_badge=False,
    )

  if season == SEASON_PEAK:
    target = recruiting_end or next_peak
    days = max(0, (target - today).days)
    if is_ready and is_last_chance:
      return RecruitingScenario(
        id="E",
        name="Ready + Peak + 1 Left",
        header="Last Recruiting Season",
        subtext="This is your last summer cycle. Apply daily and prioritize both quality and volume.",
        color_theme="amber",
        countdown_label="Season Ends",
        countdown_target=target,
        countdown_days=days,
        countdown_direction="until",
        show_one_summer_badge=True,
      )
    if (not is_ready) and is_last_chance:
      return RecruitingScenario(
        id="F",
        name="Not Ready + Peak + 1 Left",
        header="Emergency: Immediate Pivot",
        subtext="Last chance for summer internships. Raise readiness fast and begin applying immediately.",
        color_theme="amber",
        countdown_label="Season Ends",
        countdown_target=target,
        countdown_days=days,
        countdown_direction="until",
        show_one_summer_badge=True,
      )
    if is_ready:
      return RecruitingScenario(
        id="A",
        name="Ready + Peak",
        header="Peak Season: Apply Now",
        subtext="Top companies are actively posting roles. Push applications now while volume is highest.",
        color_theme="emerald",
        countdown_label="Season Ends",
        countdown_target=target,
        countdown_days=days,
        countdown_direction="until",
        show_one_summer_badge=False,
      )
    return RecruitingScenario(
      id="B",
      name="Not Ready + Peak",
      header="Peak Season: Catch Up",
      subtext="The window is open, but your profile needs work. Hit 70% readiness while still applying strategically.",
      color_theme="amber",
      countdown_label="Season Ends",
      countdown_target=target,
      countdown_days=days,
      countdown_direction="until",
      show_one_summer_badge=False,
    )

  if season == SEASON_LOWER:
    season_end = recruiting_end or next_peak
    season_end_days = max(0, (season_end - today).days)
    next_peak_days = max(0, (next_peak - today).days)
    if is_ready and is_last_chance:
      return RecruitingScenario(
        id="H",
        name="Ready + Lower + 1 Left",
        header="Last Opportunity: Hunt Local",
        subtext="You are ready. Focus on startups, local companies, and off-season internships before graduation.",
        color_theme="amber",
        countdown_label="Season Ends",
        countdown_target=season_end,
        countdown_days=season_end_days,
        countdown_direction="until",
        show_one_summer_badge=True,
      )
    if (not is_ready) and is_last_chance:
      return RecruitingScenario(
        id="G",
        name="Not Ready + Lower + 1 Left",
        header="Last Call: Sprint Mode",
        subtext="Lower season is ending. Build readiness quickly and focus on smaller companies and off-season paths.",
        color_theme="amber",
        countdown_label="Season Ends",
        countdown_target=season_end,
        countdown_days=season_end_days,
        countdown_direction="until",
        show_one_summer_badge=True,
      )
    if is_ready:
      return RecruitingScenario(
        id="D",
        name="Ready + Lower",
        header="Target Mid-Size & Startups",
        subtext="Peak is mostly closed, but many startups and local firms still hire. Keep applying with focus.",
        color_theme="emerald",
        countdown_label="Season Ends",
        countdown_target=season_end,
        countdown_days=season_end_days,
        countdown_direction="until",
        show_one_summer_badge=False,
      )
    return RecruitingScenario(
      id="C",
      name="Not Ready + Lower",
      header="Prep for Next Cycle",
      subtext="Major windows are closing. Build skills now so you can dominate when peak season opens.",
      color_theme="indigo",
      countdown_label="Next Peak Season",
      countdown_target=next_peak,
      countdown_days=next_peak_days,
      countdown_direction="until",
      show_one_summer_badge=False,
    )

  off_days = max(0, (next_peak - today).days)
  if is_last_chance:
    return RecruitingScenario(
      id="J",
      name="Off-Season + 1 Left",
      header="Your Final Training Camp",
      subtext="This is the last prep window of your degree. Max out readiness before August 1.",
      color_theme="amber",
      countdown_label="Last Prep Window",
      countdown_target=next_peak,
      countdown_days=off_days,
      countdown_direction="until",
      show_one_summer_badge=True,
    )

  return RecruitingScenario(
    id="I",
    name="Not Ready + Off-Season",
    header="The Calm Before the Storm",
    subtext="Recruiting is mostly closed. Use this time to finish your roadmap before peak season returns.",
    color_theme="slate",
    countdown_label="Peak Season Starts",
    countdown_target=next_peak,
    countdown_days=off_days,
    countdown_direction="until",
    show_one_summer_badge=False,
  )


def build_recruiting_view(*, today: date, readiness_score: int, graduation_date: date | None) -> dict[str, Any]:
  season = _season_for_day(today)
  next_peak = _next_peak_start(today)
  recruiting_end = _recruiting_end_for_active_cycle(today, season)
  summers_left = calculate_summers_left(today, graduation_date)

  scenario = _build_scenario(
    season=season,
    readiness_score=readiness_score,
    summers_left=summers_left,
    today=today,
    recruiting_end=recruiting_end,
    next_peak=next_peak,
    graduation_date=graduation_date,
  )

  return {
    "season": season,
    "readiness_status": "ready" if readiness_score >= READY_THRESHOLD else "not_ready",
    "summers_left": summers_left,
    "next_peak_date": next_peak.isoformat(),
    "recruiting_window_end": recruiting_end.isoformat() if recruiting_end else None,
    "season_explainer": "Peak: Aug-Dec, Lower: Jan-Mar, Off: Apr-Jul.",
    "scenario": scenario.to_dict(),
  }
