from app.models import User
from app.services.email_verification import generate_email_verification_token


def test_signup_requires_email_verification_before_login(client, app):
  register_response = client.post(
    "/auth/register",
    json={"email": "pending@example.com", "password": "password123"},
  )
  assert register_response.status_code == 202
  register_payload = register_response.get_json()
  assert register_payload["requires_email_verification"] is True
  assert register_payload["email"] == "pending@example.com"

  with app.app_context():
    user = User.query.filter_by(email="pending@example.com").one()
    assert user.email_verified is False
    token = generate_email_verification_token(user)

  blocked_login = client.post(
    "/auth/login",
    json={"email": "pending@example.com", "password": "password123"},
  )
  assert blocked_login.status_code == 403
  assert blocked_login.get_json()["error"] == "Email not verified. Check your inbox for the verification link."

  confirm_response = client.post("/auth/email-verification/confirm", json={"token": token})
  assert confirm_response.status_code == 200
  assert confirm_response.get_json()["already_verified"] is False

  login_response = client.post(
    "/auth/login",
    json={"email": "pending@example.com", "password": "password123"},
  )
  assert login_response.status_code == 200
  assert login_response.get_json()["user"]["email_verified"] is True


def test_resend_verification_is_cooldown_limited(client):
  register_response = client.post(
    "/auth/register",
    json={"email": "cooldown@example.com", "password": "password123"},
  )
  assert register_response.status_code == 202

  resend_response = client.post(
    "/auth/email-verification/resend",
    json={"email": "cooldown@example.com"},
  )
  assert resend_response.status_code == 429
  payload = resend_response.get_json()
  assert payload["error"] == "Please wait before requesting another verification email."
  assert isinstance(payload.get("retry_after_seconds"), int)
