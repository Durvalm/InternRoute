import os
from dotenv import load_dotenv

load_dotenv()


def _require_env(name: str) -> str:
  value = os.getenv(name)
  if not value:
    raise RuntimeError(f"{name} environment variable is required")
  return value


class Config:
  SECRET_KEY = _require_env("SECRET_KEY")
  SQLALCHEMY_DATABASE_URI = os.getenv(
      "DATABASE_URL",
      "postgresql+psycopg2://postgres:postgres@localhost:5432/internroute"
  )
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  JWT_SECRET_KEY = _require_env("JWT_SECRET_KEY")
  SUPERUSER_EMAILS = os.getenv("SUPERUSER_EMAILS", "")
