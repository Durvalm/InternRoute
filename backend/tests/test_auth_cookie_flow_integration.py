from app.extensions import db
from app.models import User
from app.routes import auth as auth_route


def test_login_sets_auth_and_csrf_cookies_and_me_works(client):
  login_response = client.post(
    "/auth/login",
    json={"email": "student@example.com", "password": "password123"},
  )
  assert login_response.status_code == 200
  payload = login_response.get_json()
  assert isinstance(payload.get("user"), dict)

  set_cookie_headers = login_response.headers.getlist("Set-Cookie")
  assert any("internroute_access_token=" in header for header in set_cookie_headers)
  assert any("internroute_csrf_token=" in header for header in set_cookie_headers)

  me_response = client.get("/auth/me")
  assert me_response.status_code == 200


def test_logout_clears_cookie_session(client):
  login_response = client.post(
    "/auth/login",
    json={"email": "student@example.com", "password": "password123"},
  )
  assert login_response.status_code == 200

  csrf_cookie = client.get_cookie("internroute_csrf_token")
  assert csrf_cookie is not None

  logout_response = client.post(
    "/auth/logout",
    headers={"X-CSRF-TOKEN": csrf_cookie.value},
  )
  assert logout_response.status_code == 200

  me_response = client.get("/auth/me")
  assert me_response.status_code == 401


def test_password_change_invalidates_existing_cookie_session(client):
  login_response = client.post(
    "/auth/login",
    json={"email": "student@example.com", "password": "password123"},
  )
  assert login_response.status_code == 200

  csrf_cookie = client.get_cookie("internroute_csrf_token")
  assert csrf_cookie is not None

  password_response = client.post(
    "/user/password",
    headers={"X-CSRF-TOKEN": csrf_cookie.value},
    json={"current_password": "password123", "new_password": "new-password-123"},
  )
  assert password_response.status_code == 200

  me_response = client.get("/auth/me")
  assert me_response.status_code == 401

  login_again = client.post(
    "/auth/login",
    json={"email": "student@example.com", "password": "new-password-123"},
  )
  assert login_again.status_code == 200


def test_google_auth_creates_cookie_session_for_new_user(client, app, monkeypatch):
  app.config["GOOGLE_CLIENT_ID"] = "test-google-client-id"
  monkeypatch.setattr(
    auth_route,
    "_verify_google_credential",
    lambda credential, client_id: {
      "sub": "google-sub-123",
      "email": "google-user@example.com",
      "name": "Google User",
    },
  )

  response = client.post("/auth/google", json={"credential": "google-token"})
  assert response.status_code == 200

  payload = response.get_json()
  assert payload["user"]["email"] == "google-user@example.com"
  assert payload["user"]["password_login_enabled"] is False

  set_cookie_headers = response.headers.getlist("Set-Cookie")
  assert any("internroute_access_token=" in header for header in set_cookie_headers)
  assert any("internroute_csrf_token=" in header for header in set_cookie_headers)

  with app.app_context():
    user = db.session.query(User).filter_by(email="google-user@example.com").one()
    assert user.google_sub == "google-sub-123"
    assert user.password_login_enabled is False


def test_google_auth_links_existing_email_user(client, app, monkeypatch):
  app.config["GOOGLE_CLIENT_ID"] = "test-google-client-id"
  monkeypatch.setattr(
    auth_route,
    "_verify_google_credential",
    lambda credential, client_id: {
      "sub": "google-sub-existing",
      "email": "student@example.com",
      "name": "Student Example",
    },
  )

  response = client.post("/auth/google", json={"credential": "google-token"})
  assert response.status_code == 200

  with app.app_context():
    user = db.session.query(User).filter_by(email="student@example.com").one()
    assert user.google_sub == "google-sub-existing"
    assert user.password_login_enabled is True
