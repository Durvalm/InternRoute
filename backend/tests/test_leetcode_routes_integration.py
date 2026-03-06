from app.extensions import db
from app.models import LeetcodeProgress, Module, Task
from app.routes import leetcode as leetcode_route


def _seed_leetcode_module(app) -> None:
  with app.app_context():
    module = Module(
      key="leetcode",
      name="Leetcode",
      category="other",
      overall_weight=25,
      unlock_threshold=80,
      sort_order=7,
    )
    db.session.add(module)
    db.session.flush()

    task = Task(
      module_id=module.id,
      challenge_id="leetcode_50_total_30_medium",
      title="Leetcode Module: Reach 50 solved (30 medium).",
      description="Completion task.",
      weight=100,
      is_bonus=False,
      sort_order=1,
      is_active=True,
    )
    db.session.add(task)
    db.session.commit()


def test_link_username_and_sync_completes_module(client, auth_headers, app, monkeypatch):
  _seed_leetcode_module(app)

  monkeypatch.setattr(
    leetcode_route,
    "fetch_solved_counts",
    lambda _username: {
      "total_solved": 18,
      "easy_solved": 9,
      "medium_solved": 8,
      "hard_solved": 1,
    },
  )

  link_response = client.post(
    "/leetcode/progress/link",
    headers=auth_headers,
    json={"leetcode_username": "test_user_123"},
  )
  assert link_response.status_code == 200
  link_payload = link_response.get_json()
  assert link_payload["progress"]["linked"] is True
  assert link_payload["progress"]["leetcode_username"] == "test_user_123"
  assert link_payload["progress"]["completion_target_met"] is False

  monkeypatch.setattr(
    leetcode_route,
    "fetch_solved_counts",
    lambda _username: {
      "total_solved": 60,
      "easy_solved": 20,
      "medium_solved": 35,
      "hard_solved": 5,
    },
  )

  sync_response = client.post("/leetcode/progress/sync", headers=auth_headers, json={})
  assert sync_response.status_code == 200
  sync_payload = sync_response.get_json()
  assert sync_payload["progress"]["completion_target_met"] is True
  assert sync_payload["module_progress"]["module_key"] == "leetcode"
  assert sync_payload["module_progress"]["score"] == 100


def test_linked_username_can_be_updated_without_ownership_lock(client, auth_headers, app, monkeypatch):
  _seed_leetcode_module(app)

  monkeypatch.setattr(
    leetcode_route,
    "fetch_solved_counts",
    lambda _username: {
      "total_solved": 10,
      "easy_solved": 5,
      "medium_solved": 5,
      "hard_solved": 0,
    },
  )
  first_link = client.post(
    "/leetcode/progress/link",
    headers=auth_headers,
    json={"leetcode_username": "first_user"},
  )
  assert first_link.status_code == 200

  second_link = client.post(
    "/leetcode/progress/link",
    headers=auth_headers,
    json={"leetcode_username": "second_user"},
  )
  assert second_link.status_code == 200
  assert second_link.get_json()["progress"]["leetcode_username"] == "second_user"


def test_module_progress_is_incremental_before_completion(client, auth_headers, app, monkeypatch):
  _seed_leetcode_module(app)

  monkeypatch.setattr(
    leetcode_route,
    "fetch_solved_counts",
    lambda _username: {
      "total_solved": 25,
      "easy_solved": 10,
      "medium_solved": 15,
      "hard_solved": 0,
    },
  )

  response = client.post(
    "/leetcode/progress/link",
    headers=auth_headers,
    json={"leetcode_username": "incremental_user"},
  )
  assert response.status_code == 200
  payload = response.get_json()
  assert payload["progress"]["progress_percent_overall"] == 50
  assert payload["module_progress"]["score"] == 50

  with app.app_context():
    record = LeetcodeProgress.query.first()
    assert record is not None
    assert record.completion_verified_at is None
