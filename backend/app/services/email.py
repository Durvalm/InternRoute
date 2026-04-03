from __future__ import annotations

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from flask import current_app


class EmailDeliveryError(RuntimeError):
  pass


@dataclass(frozen=True)
class OutboundEmail:
  to_email: str
  subject: str
  text_body: str
  html_body: str | None = None


def _build_message(payload: OutboundEmail) -> EmailMessage:
  from_address = (current_app.config.get("EMAIL_FROM_ADDRESS") or "").strip()
  if not from_address:
    from_address = "no-reply@internroute.local"

  from_name = (current_app.config.get("EMAIL_FROM_NAME") or "").strip()
  from_header = f"{from_name} <{from_address}>" if from_name else from_address

  message = EmailMessage()
  message["Subject"] = payload.subject
  message["From"] = from_header
  message["To"] = payload.to_email
  message.set_content(payload.text_body)
  if payload.html_body:
    message.add_alternative(payload.html_body, subtype="html")
  return message


def _send_with_smtp(message: EmailMessage) -> None:
  host = (current_app.config.get("SMTP_HOST") or "").strip()
  port = int(current_app.config.get("SMTP_PORT", 587))
  username = (current_app.config.get("SMTP_USERNAME") or "").strip() or None
  password = (current_app.config.get("SMTP_PASSWORD") or "").strip() or None
  use_ssl = bool(current_app.config.get("SMTP_USE_SSL", False))
  use_tls = bool(current_app.config.get("SMTP_USE_TLS", True))

  if not host:
    raise EmailDeliveryError("SMTP host is not configured.")

  smtp_cls = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
  try:
    with smtp_cls(host=host, port=port, timeout=15) as client:
      if use_tls and not use_ssl:
        client.starttls()
      if username:
        client.login(username, password or "")
      client.send_message(message)
  except Exception as exc:  # pragma: no cover - vendor/network variability
    raise EmailDeliveryError("Failed to deliver email via SMTP.") from exc


def send_email(payload: OutboundEmail) -> None:
  mode = str(current_app.config.get("EMAIL_DELIVERY_MODE") or "log").strip().lower()
  message = _build_message(payload)

  if mode == "disabled":
    current_app.logger.info(
      "Email delivery disabled. Skipping outbound email to %s with subject '%s'.",
      payload.to_email,
      payload.subject,
    )
    return

  if mode == "log":
    current_app.logger.info(
      "Email(log) to=%s subject=%s body=%s",
      payload.to_email,
      payload.subject,
      payload.text_body,
    )
    return

  if mode == "smtp":
    _send_with_smtp(message)
    return

  raise EmailDeliveryError(f"Unsupported email delivery mode: {mode}")
