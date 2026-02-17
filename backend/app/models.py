from datetime import datetime
from passlib.hash import bcrypt
from .extensions import db


class User(db.Model):
  __tablename__ = "users"

  id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(255), unique=True, nullable=False)
  password_hash = db.Column(db.String(255), nullable=False)
  name = db.Column(db.String(120), nullable=True)
  coding_skill_level = db.Column(db.String(50), nullable=True)
  graduation_date = db.Column(db.Date, nullable=True)
  onboarding_completed = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
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
      "name": self.name,
      "coding_skill_level": self.coding_skill_level,
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
  coding_override_score = db.Column(db.Integer, nullable=True)
  coding_override_source = db.Column(db.String(100), nullable=True)
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


class Module(db.Model):
  __tablename__ = "modules"

  id = db.Column(db.Integer, primary_key=True)
  key = db.Column(db.String(64), unique=True, nullable=False)
  name = db.Column(db.String(120), nullable=False)
  category = db.Column(db.String(32), nullable=False)
  overall_weight = db.Column(db.Integer, nullable=False)
  unlock_threshold = db.Column(db.Integer, nullable=False, default=80, server_default=db.text("80"))
  next_module_id = db.Column(db.Integer, db.ForeignKey("modules.id"), nullable=True)
  sort_order = db.Column(db.Integer, nullable=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  next_module = db.relationship("Module", remote_side=[id], uselist=False)


class Task(db.Model):
  __tablename__ = "tasks"

  id = db.Column(db.Integer, primary_key=True)
  module_id = db.Column(db.Integer, db.ForeignKey("modules.id"), nullable=False)
  challenge_id = db.Column(db.String(64), nullable=True)
  title = db.Column(db.String(255), nullable=False)
  description = db.Column(db.Text, nullable=True)
  weight = db.Column(db.Integer, nullable=False)
  is_bonus = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
  sort_order = db.Column(db.Integer, nullable=False, default=0, server_default="0")
  is_active = db.Column(db.Boolean, nullable=False, default=True, server_default=db.text("true"))
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  module = db.relationship("Module", backref=db.backref("tasks", lazy=True))


class UserTaskCompletion(db.Model):
  __tablename__ = "user_task_completions"

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
  task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
  completed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

  __table_args__ = (
    db.UniqueConstraint("user_id", "task_id", name="uq_user_task_completion"),
  )

  user = db.relationship("User", backref=db.backref("task_completions", lazy=True))
  task = db.relationship("Task", backref=db.backref("completions", lazy=True))
