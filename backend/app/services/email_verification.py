from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlencode, urlsplit, urlunsplit

from flask import current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from ..models import User
from .email import OutboundEmail, send_email

_EMAIL_VERIFICATION_SALT = "internroute.email-verification.v1"


class EmailVerificationError(ValueError):
  pass


@dataclass(frozen=True)
class EmailVerificationTokenPayload:
  user_id: int
  email: str


def _serializer() -> URLSafeTimedSerializer:
  secret = (current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY") or "").strip()
  if not secret:
    raise RuntimeError("Missing secret for email verification token generation.")
  return URLSafeTimedSerializer(secret_key=secret)


def generate_email_verification_token(user: User) -> str:
  payload = {
    "user_id": int(user.id),
    "email": str(user.email),
  }
  return _serializer().dumps(payload, salt=_EMAIL_VERIFICATION_SALT)


def decode_email_verification_token(token: str) -> EmailVerificationTokenPayload:
  max_age_seconds = int(current_app.config.get("EMAIL_VERIFICATION_TOKEN_TTL_SECONDS", 86400))
  try:
    data = _serializer().loads(token, salt=_EMAIL_VERIFICATION_SALT, max_age=max_age_seconds)
  except SignatureExpired as exc:
    raise EmailVerificationError("This verification link has expired.") from exc
  except BadSignature as exc:
    raise EmailVerificationError("This verification link is invalid.") from exc

  user_id = data.get("user_id")
  email = (data.get("email") or "").strip().lower()
  if not isinstance(user_id, int) or not email:
    raise EmailVerificationError("This verification link is invalid.")
  return EmailVerificationTokenPayload(user_id=user_id, email=email)


def _frontend_verification_url(token: str) -> str:
  base_url = (current_app.config.get("FRONTEND_APP_URL") or "").strip().rstrip("/")
  if not base_url:
    raise RuntimeError("FRONTEND_APP_URL is not configured.")
  parts = urlsplit(f"{base_url}/verify-email")
  query = urlencode({"token": token})
  return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


def send_signup_verification_email(user: User) -> None:
  token = generate_email_verification_token(user)
  verification_url = _frontend_verification_url(token)
  subject = "Confirm your email for InternRoute"
  text_body = (
    "Welcome to InternRoute.\n\n"
    "Confirm your email to finish creating your account:\n"
    f"{verification_url}\n\n"
    "If you did not request this, you can ignore this email."
  )

  send_email(
    OutboundEmail(
      to_email=user.email,
      subject=subject,
      text_body=text_body,
      html_body=(
        "<p>Welcome to InternRoute.</p>"
        "<p>Confirm your email to finish creating your account:</p>"
        f"<p><a href=\"{verification_url}\">{verification_url}</a></p>"
        "<p>If you did not request this, you can ignore this email.</p>"
      ),
    )
  )
