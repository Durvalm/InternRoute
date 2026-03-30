from datetime import date, datetime

from app.extensions import db
from app.models import Module, OnboardingAssessment, Task, User, UserProgress
from app.routes import dashboard as dashboard_route


class _FixedDate(date):
  @classmethod
  def today(cls):
    return cls(2027, 3, 15)


def _ensure_module(*, key: str, name: str, sort_order: int, overall_weight: int = 10) -> Module:
  module = Module.query.filter_by(key=key).first()
  if module is None:
    module = Module(
      key=key,
      name=name,
      category="other",
      overall_weight=overall_weight,
      unlock_threshold=80,
      sort_order=sort_order,
    )
    db.session.add(module)
    db.session.flush()
  else:
    module.name = name
    module.sort_order = sort_order
    module.overall_weight = overall_weight
    module.unlock_threshold = 80
  return module


def _ensure_task(*, module_id: int, challenge_id: str, title: str, sort_order: int = 1, weight: int = 100) -> None:
  task = Task.query.filter_by(module_id=module_id, challenge_id=challenge_id).first()
  if task is None:
    task = Task(
      module_id=module_id,
      challenge_id=challenge_id,
      title=title,
      description=title,
      weight=weight,
      is_bonus=False,
      sort_order=sort_order,
      is_active=True,
    )
    db.session.add(task)
    return

  task.title = title
  task.description = title
  task.weight = weight
  task.sort_order = sort_order
  task.is_bonus = False
  task.is_active = True


def _seed_foundation_modules() -> None:
  timeline = _ensure_module(key="timeline", name="Timeline & Strategy", sort_order=1, overall_weight=5)
  coding = _ensure_module(key="coding", name="Coding Skills", sort_order=2, overall_weight=20)
  projects = _ensure_module(key="projects", name="Projects", sort_order=3, overall_weight=30)
  resume = _ensure_module(key="resume", name="Resume", sort_order=4, overall_weight=10)
  applications = _ensure_module(key="applications", name="Applications", sort_order=5, overall_weight=5)

  _ensure_task(module_id=timeline.id, challenge_id="timeline_complete", title="Timeline complete")
  _ensure_task(module_id=coding.id, challenge_id="coding_core", title="Coding complete")
  _ensure_task(module_id=projects.id, challenge_id="projects_core_1", title="Project 1 passed", sort_order=1, weight=40)
  _ensure_task(module_id=projects.id, challenge_id="projects_core_2", title="Project 2 passed", sort_order=2, weight=40)
  _ensure_task(module_id=projects.id, challenge_id="projects_bonus_real_user", title="Project bonus", sort_order=3, weight=20)
  _ensure_task(module_id=resume.id, challenge_id="resume_pass_threshold", title="Resume threshold")
  _ensure_task(module_id=applications.id, challenge_id="applications_checklist_complete", title="Applications complete")



def test_dashboard_summary_includes_journey_payload(client, auth_headers):
  response = client.get("/dashboard/summary", headers=auth_headers)

  assert response.status_code == 200
  payload = response.get_json()
  assert "journey" in payload
  assert payload["journey"]["readiness_threshold"] == 62
  assert "original_anchor_date" in payload["journey"]
  assert "active_anchor_date" in payload["journey"]
  assert "readiness_target_date" in payload["journey"]
  assert isinstance(payload["journey"]["modules"], list)



def test_dashboard_journey_stale_detection_uses_fixed_dates(client, auth_headers, app, monkeypatch):
  monkeypatch.setattr(dashboard_route, "date", _FixedDate)

  with app.app_context():
    _seed_foundation_modules()
    user_id = int(app.config["TEST_USER_ID"])
    user = db.session.get(User, user_id)
    assert user is not None

    assessment = OnboardingAssessment(
      user_id=user_id,
      status="completed",
      track_key="foundation_start",
      completed_at=datetime(2026, 3, 1, 12, 0, 0),
    )
    db.session.add(assessment)
    db.session.commit()

  response = client.get("/dashboard/summary", headers=auth_headers)
  assert response.status_code == 200

  payload = response.get_json()
  journey = payload["journey"]
  assert journey["track_key"] == "foundation_start"
  assert journey["original_anchor_date"] == "2026-03-01"
  assert journey["active_anchor_date"] == "2026-03-01"
  assert journey["readiness_target_date"] == "2026-10-04"
  assert journey["is_stale"] is True
  assert journey["stale_reason"] == "timeline_expired_before_readiness"



def test_dashboard_rebaseline_updates_anchor_and_returns_journey(client, auth_headers, app, monkeypatch):
  monkeypatch.setattr(dashboard_route, "date", _FixedDate)

  with app.app_context():
    _seed_foundation_modules()
    user_id = int(app.config["TEST_USER_ID"])

    existing_assessment = (
      OnboardingAssessment.query
      .filter_by(user_id=user_id, status="completed")
      .first()
    )
    if existing_assessment is None:
      db.session.add(
        OnboardingAssessment(
          user_id=user_id,
          status="completed",
          track_key="foundation_start",
          completed_at=datetime(2026, 3, 1, 9, 0, 0),
        )
      )
    db.session.commit()

  response = client.post("/dashboard/journey/rebaseline", headers=auth_headers)
  assert response.status_code == 200
  payload = response.get_json()

  assert payload["ok"] is True
  assert payload["journey"]["active_anchor_date"] == "2027-03-15"
  assert payload["journey"]["readiness_target_date"] == "2027-10-18"
  assert payload["journey"]["is_stale"] is False

  with app.app_context():
    user_id = int(app.config["TEST_USER_ID"])
    progress = UserProgress.query.filter_by(user_id=user_id).first()
    assert progress is not None
    assert progress.journey_anchor_date == date(2027, 3, 15)
