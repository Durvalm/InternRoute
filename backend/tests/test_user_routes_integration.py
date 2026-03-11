from app.models import User


def test_update_profile_success(client, auth_headers, app):
  response = client.patch(
    "/user/profile",
    headers=auth_headers,
    json={
      "name": "Taylor Student",
      "graduation_date": "2028-05",
    },
  )
  assert response.status_code == 200
  payload = response.get_json()
  assert payload["user"]["name"] == "Taylor Student"
  assert payload["user"]["graduation_date"] == "2028-05-01"

  with app.app_context():
    user = User.query.get(app.config["TEST_USER_ID"])
    assert user is not None
    assert user.name == "Taylor Student"
    assert user.graduation_date.isoformat() == "2028-05-01"


def test_change_password_success(client, auth_headers, app):
  response = client.post(
    "/user/password",
    headers=auth_headers,
    json={
      "current_password": "password123",
      "new_password": "new-password-123",
    },
  )
  assert response.status_code == 200

  login_response = client.post(
    "/auth/login",
    json={
      "email": "student@example.com",
      "password": "new-password-123",
    },
  )
  assert login_response.status_code == 200
  login_payload = login_response.get_json()
  assert isinstance(login_payload.get("user"), dict)
  set_cookie_headers = login_response.headers.getlist("Set-Cookie")
  assert any("internroute_access_token=" in header for header in set_cookie_headers)

  with app.app_context():
    user = User.query.get(app.config["TEST_USER_ID"])
    assert user is not None
    assert user.check_password("new-password-123") is True
    assert user.check_password("password123") is False


def test_change_password_rejects_incorrect_current_password(client, auth_headers):
  response = client.post(
    "/user/password",
    headers=auth_headers,
    json={
      "current_password": "wrong-password",
      "new_password": "new-password-123",
    },
  )
  assert response.status_code == 401
  payload = response.get_json()
  assert payload["error"] == "Current password is incorrect"
