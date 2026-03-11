import app.routes.auth as auth_routes


def test_register_rate_limited(client, app):
  previous_window = auth_routes.AUTH_RATE_LIMIT_WINDOW_SECONDS
  previous_register_limit = auth_routes.AUTH_REGISTER_LIMIT_PER_WINDOW
  auth_routes.AUTH_RATE_LIMIT_WINDOW_SECONDS = 60
  auth_routes.AUTH_REGISTER_LIMIT_PER_WINDOW = 1
  auth_routes._RATE_LIMIT_EVENTS.clear()

  try:
    first = client.post(
      "/auth/register",
      json={"email": "rate-limit-a@example.com", "password": "password123"},
    )
    assert first.status_code == 200

    second = client.post(
      "/auth/register",
      json={"email": "rate-limit-b@example.com", "password": "password123"},
    )
    assert second.status_code == 429
    payload = second.get_json()
    assert payload["error"] == "Too many register attempts. Try again soon."
    assert isinstance(payload.get("retry_after_seconds"), int)
    assert second.headers.get("Retry-After") is not None
  finally:
    auth_routes.AUTH_RATE_LIMIT_WINDOW_SECONDS = previous_window
    auth_routes.AUTH_REGISTER_LIMIT_PER_WINDOW = previous_register_limit
    auth_routes._RATE_LIMIT_EVENTS.clear()


def test_login_rate_limited(client, app):
  previous_window = auth_routes.AUTH_RATE_LIMIT_WINDOW_SECONDS
  previous_login_limit = auth_routes.AUTH_LOGIN_LIMIT_PER_WINDOW
  auth_routes.AUTH_RATE_LIMIT_WINDOW_SECONDS = 60
  auth_routes.AUTH_LOGIN_LIMIT_PER_WINDOW = 1
  auth_routes._RATE_LIMIT_EVENTS.clear()

  try:
    first = client.post(
      "/auth/login",
      json={"email": "student@example.com", "password": "password123"},
    )
    assert first.status_code == 200

    second = client.post(
      "/auth/login",
      json={"email": "student@example.com", "password": "password123"},
    )
    assert second.status_code == 429
    payload = second.get_json()
    assert payload["error"] == "Too many login attempts. Try again soon."
    assert isinstance(payload.get("retry_after_seconds"), int)
    assert second.headers.get("Retry-After") is not None
  finally:
    auth_routes.AUTH_RATE_LIMIT_WINDOW_SECONDS = previous_window
    auth_routes.AUTH_LOGIN_LIMIT_PER_WINDOW = previous_login_limit
    auth_routes._RATE_LIMIT_EVENTS.clear()
