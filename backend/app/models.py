from datetime import datetime
from passlib.hash import bcrypt
from .extensions import db

class User(db.Model):
  __tablename__ = "users"

  id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(255), unique=True, nullable=False)
  password_hash = db.Column(db.String(255), nullable=False)
  experience_level = db.Column(db.String(50), nullable=True)
  graduation_date = db.Column(db.Date, nullable=True)
  onboarding_completed = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  def set_password(self, password: str) -> None:
    if len(password.encode("utf-8")) > 72:
      raise ValueError("Password exceeds 72 bytes")
    self.password_hash = bcrypt.hash(password)

  def check_password(self, password: str) -> bool:
    return bcrypt.verify(password, self.password_hash)

  def to_dict(self):
    return {
      "id": self.id,
      "email": self.email,
      "experience_level": self.experience_level,
      "graduation_date": self.graduation_date.isoformat() if self.graduation_date else None,
      "onboarding_completed": self.onboarding_completed
    }


class UserProgress(db.Model):
  __tablename__ = "user_progress"

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
  readiness_score = db.Column(db.Integer, default=0)
  category_coding = db.Column(db.Integer, default=0)
  category_projects = db.Column(db.Integer, default=0)
  category_resume = db.Column(db.Integer, default=0)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  user = db.relationship("User", backref=db.backref("progress", uselist=False))

  def to_dict(self):
    return {
      "readiness_score": self.readiness_score,
      "category_readiness": {
        "coding": self.category_coding,
        "projects": self.category_projects,
        "resume": self.category_resume
      }
    }
