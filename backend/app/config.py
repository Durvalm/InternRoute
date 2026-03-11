import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def _require_env(name: str) -> str:
  value = os.getenv(name)
  if not value:
    raise RuntimeError(f"{name} environment variable is required")
  return value


def _env_bool(name: str, default: bool = False) -> bool:
  value = os.getenv(name)
  if value is None:
    return default
  normalized = value.strip().lower()
  if normalized in {"1", "true", "yes", "on"}:
    return True
  if normalized in {"0", "false", "no", "off"}:
    return False
  return default


def _env_int(name: str, default: int) -> int:
  value = os.getenv(name)
  if value is None:
    return default
  try:
    parsed = int(value.strip())
    return parsed if parsed > 0 else default
  except ValueError:
    return default


def _env_float(name: str, default: float) -> float:
  value = os.getenv(name)
  if value is None:
    return default
  try:
    parsed = float(value.strip())
    return parsed if parsed >= 0 else default
  except ValueError:
    return default


def _env_csv(name: str, default: list[str] | None = None) -> list[str]:
  value = os.getenv(name)
  if value is None:
    return list(default or [])
  return [item.strip() for item in value.split(",") if item.strip()]


def _env_str(name: str, default: str) -> str:
  value = os.getenv(name)
  if value is None:
    return default
  normalized = value.strip()
  return normalized if normalized else default


APP_ENV = (os.getenv("APP_ENV") or "development").strip().lower()
IS_PRODUCTION = APP_ENV in {"production", "prod"}

_DEFAULT_DATABASE_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/internroute"
_DEFAULT_DEV_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


class Config:
  APP_ENV = APP_ENV
  IS_PRODUCTION = IS_PRODUCTION
  DEBUG = _env_bool("FLASK_DEBUG", default=not IS_PRODUCTION)

  SECRET_KEY = _require_env("SECRET_KEY")
  SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", _DEFAULT_DATABASE_URL)
  if IS_PRODUCTION and SQLALCHEMY_DATABASE_URI == _DEFAULT_DATABASE_URL:
    raise RuntimeError(
      "DATABASE_URL must be set to a production database when APP_ENV=production."
    )
  SQLALCHEMY_TRACK_MODIFICATIONS = False

  JWT_SECRET_KEY = _require_env("JWT_SECRET_KEY")
  JWT_ACCESS_TOKEN_EXPIRES = timedelta(
    minutes=_env_int("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 60 * 24 * 14)
  )
  JWT_TOKEN_LOCATION = ["headers", "cookies"]
  JWT_COOKIE_SECURE = IS_PRODUCTION
  JWT_COOKIE_SAMESITE = "Lax"
  JWT_COOKIE_CSRF_PROTECT = True
  JWT_ACCESS_COOKIE_NAME = "internroute_access_token"
  JWT_ACCESS_CSRF_COOKIE_NAME = "internroute_csrf_token"
  JWT_ACCESS_CSRF_HEADER_NAME = "X-CSRF-TOKEN"

  CORS_ALLOWED_ORIGINS = _env_csv(
    "CORS_ALLOWED_ORIGINS",
    default=[] if IS_PRODUCTION else _DEFAULT_DEV_CORS_ORIGINS,
  )
  if IS_PRODUCTION and not CORS_ALLOWED_ORIGINS:
    raise RuntimeError("CORS_ALLOWED_ORIGINS is required when APP_ENV=production.")

  OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
  if IS_PRODUCTION and not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is required when APP_ENV=production.")

  POSTHOG_API_KEY = (os.getenv("POSTHOG_API_KEY") or "").strip()
  POSTHOG_HOST = _env_str("POSTHOG_HOST", "https://us.i.posthog.com").rstrip("/")
  ANALYTICS_APP_VERSION = (
    (os.getenv("ANALYTICS_APP_VERSION") or "").strip()
    or (os.getenv("SENTRY_RELEASE") or "").strip()
    or "dev"
  )

  SENTRY_DSN = (os.getenv("SENTRY_DSN") or "").strip()
  SENTRY_ENVIRONMENT = _env_str("SENTRY_ENVIRONMENT", APP_ENV)
  SENTRY_RELEASE = (os.getenv("SENTRY_RELEASE") or "").strip() or None
  SENTRY_TRACES_SAMPLE_RATE = _env_float(
    "SENTRY_TRACES_SAMPLE_RATE",
    default=0.1 if IS_PRODUCTION else 0.0,
  )

  FLASK_RUN_HOST = _env_str("FLASK_RUN_HOST", "127.0.0.1")
  FLASK_RUN_PORT = _env_int("FLASK_RUN_PORT", 5000)

  SECURITY_HEADERS_ENABLED = True
  SECURITY_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  SECURITY_HSTS = "max-age=31536000; includeSubDomains; preload"
  SECURITY_REFERRER_POLICY = "strict-origin-when-cross-origin"
  SECURITY_X_FRAME_OPTIONS = "DENY"
  SECURITY_X_CONTENT_TYPE_OPTIONS = "nosniff"

  SUPERUSER_EMAILS = os.getenv("SUPERUSER_EMAILS", "")
