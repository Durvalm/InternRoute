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

  CORS_ALLOWED_ORIGINS = _env_csv(
    "CORS_ALLOWED_ORIGINS",
    default=[] if IS_PRODUCTION else _DEFAULT_DEV_CORS_ORIGINS,
  )
  if IS_PRODUCTION and not CORS_ALLOWED_ORIGINS:
    raise RuntimeError("CORS_ALLOWED_ORIGINS is required when APP_ENV=production.")

  FLASK_RUN_HOST = _env_str("FLASK_RUN_HOST", "127.0.0.1")
  FLASK_RUN_PORT = _env_int("FLASK_RUN_PORT", 5000)

  SUPERUSER_EMAILS = os.getenv("SUPERUSER_EMAILS", "")
  RESUME_SCORER_ENABLED = _env_bool("RESUME_SCORER_ENABLED", default=False)
