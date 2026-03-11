from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import current_app

logger = logging.getLogger(__name__)


def _normalized_host() -> str:
  host = str(current_app.config.get("POSTHOG_HOST") or "").strip()
  if not host:
    return ""
  return host.rstrip("/")


def _api_key() -> str:
  return str(current_app.config.get("POSTHOG_API_KEY") or "").strip()


def _is_enabled() -> bool:
  return bool(_normalized_host() and _api_key())


def _common_properties() -> dict[str, Any]:
  app_version = (
    str(current_app.config.get("ANALYTICS_APP_VERSION") or "").strip()
    or str(current_app.config.get("SENTRY_RELEASE") or "").strip()
    or "unknown"
  )
  return {
    "env": str(current_app.config.get("APP_ENV") or "development"),
    "app_version": app_version,
    "platform": "backend",
  }


def analytics_insert_id(*parts: object) -> str:
  joined = ":".join(str(part) for part in parts)
  return hashlib.sha256(joined.encode("utf-8")).hexdigest()


def track_event(
  event: str,
  *,
  user_id: int | str | None = None,
  properties: dict[str, Any] | None = None,
  distinct_id: str | None = None,
  insert_id: str | None = None,
) -> None:
  if not _is_enabled():
    return

  now_iso = datetime.now(timezone.utc).isoformat()
  distinct = (distinct_id or "").strip() or (str(user_id) if user_id is not None else "anonymous")

  merged_properties: dict[str, Any] = {}
  merged_properties.update(_common_properties())
  merged_properties["timestamp"] = now_iso
  if user_id is not None:
    merged_properties["user_id"] = str(user_id)
  if properties:
    merged_properties.update(properties)
  if insert_id:
    merged_properties["$insert_id"] = insert_id

  payload = {
    "api_key": _api_key(),
    "event": event,
    "distinct_id": distinct,
    "timestamp": now_iso,
    "properties": merged_properties,
  }

  body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
  request = Request(
    url=f"{_normalized_host()}/capture/",
    data=body,
    method="POST",
    headers={"Content-Type": "application/json"},
  )

  try:
    with urlopen(request, timeout=0.5) as response:
      status = int(getattr(response, "status", 200))
      if status >= 400:
        logger.warning("analytics_track_failed status=%s event=%s", status, event)
  except HTTPError as err:
    logger.warning("analytics_track_http_error status=%s event=%s", err.code, event)
  except URLError as err:
    logger.warning("analytics_track_network_error event=%s reason=%s", event, err.reason)
  except Exception as err:
    logger.warning("analytics_track_unexpected_error event=%s error=%s", event, err)
