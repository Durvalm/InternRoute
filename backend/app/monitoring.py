from __future__ import annotations

import logging
from typing import Any

from flask import Flask

_SENTRY_INITIALIZED = False

try:
  import sentry_sdk
  from sentry_sdk.integrations.flask import FlaskIntegration
  from sentry_sdk.integrations.logging import LoggingIntegration
  from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
except Exception:  # pragma: no cover
  sentry_sdk = None
  FlaskIntegration = None
  LoggingIntegration = None
  SqlalchemyIntegration = None


def _before_send(event: dict[str, Any], hint: dict[str, Any]):
  request = event.get("request")
  if isinstance(request, dict):
    headers = request.get("headers")
    if isinstance(headers, dict):
      for key in list(headers.keys()):
        if key.lower() in {"authorization", "cookie", "set-cookie", "x-csrf-token"}:
          headers[key] = "[Filtered]"
    request.pop("data", None)
    request.pop("cookies", None)

  user = event.get("user")
  if isinstance(user, dict):
    user.pop("email", None)
    user.pop("ip_address", None)
    user.pop("username", None)

  return event


def init_error_monitoring(app: Flask) -> None:
  global _SENTRY_INITIALIZED
  dsn = (app.config.get("SENTRY_DSN") or "").strip()
  if not dsn:
    app.logger.info("Sentry monitoring disabled: SENTRY_DSN is not configured.")
    return

  if sentry_sdk is None or FlaskIntegration is None or LoggingIntegration is None or SqlalchemyIntegration is None:
    app.logger.warning("Sentry DSN is configured but sentry-sdk is not installed.")
    return

  sentry_sdk.init(
    dsn=dsn,
    environment=app.config.get("SENTRY_ENVIRONMENT"),
    release=app.config.get("SENTRY_RELEASE"),
    send_default_pii=False,
    traces_sample_rate=float(app.config.get("SENTRY_TRACES_SAMPLE_RATE", 0.0)),
    integrations=[
      FlaskIntegration(transaction_style="endpoint"),
      SqlalchemyIntegration(),
      LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
    ],
    before_send=_before_send,
  )
  _SENTRY_INITIALIZED = True
  app.logger.info("Sentry monitoring enabled.")


def capture_monitored_exception(
  err: Exception,
  *,
  tags: dict[str, str] | None = None,
  context: dict[str, Any] | None = None,
) -> None:
  if not _SENTRY_INITIALIZED or sentry_sdk is None:
    return

  with sentry_sdk.push_scope() as scope:
    for key, value in (tags or {}).items():
      scope.set_tag(str(key), str(value))
    if context:
      scope.set_context("app_context", context)
    sentry_sdk.capture_exception(err)
