import os
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


class Config:
  SECRET_KEY = _require_env("SECRET_KEY")
  SQLALCHEMY_DATABASE_URI = os.getenv(
      "DATABASE_URL",
      "postgresql+psycopg2://postgres:postgres@localhost:5432/internroute"
  )
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  JWT_SECRET_KEY = _require_env("JWT_SECRET_KEY")
  SUPERUSER_EMAILS = os.getenv("SUPERUSER_EMAILS", "")
  RESUME_SCORER_ENABLED = _env_bool("RESUME_SCORER_ENABLED", default=False)
