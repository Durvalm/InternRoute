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
