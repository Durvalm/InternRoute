import os
from dotenv import load_dotenv

load_dotenv()

class Config:
  SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-32chars")
  SQLALCHEMY_DATABASE_URI = os.getenv(
      "DATABASE_URL",
      "postgresql+psycopg2://postgres:postgres@localhost:5432/internroute"
  )
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me-32chars")
