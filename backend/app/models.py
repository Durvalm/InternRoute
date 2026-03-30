import json
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
  is_superuser = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
  token_version = db.Column(db.Integer, nullable=False, default=0, server_default=db.text("0"))
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
      "graduation_date": self.graduation_date.isoformat() if self.graduation_date else None,
      "is_superuser": self.is_superuser,
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
  journey_anchor_date = db.Column(db.Date, nullable=True)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  user = db.relationship("User", backref=db.backref("progress", uselist=False))


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


class LeetcodeProgress(db.Model):
  __tablename__ = "leetcode_verifications"

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
  leetcode_username = db.Column(db.String(100), nullable=False)
  ownership_code = db.Column(db.String(64), nullable=False, default="", server_default=db.text("''"))
  ownership_verified_at = db.Column(db.DateTime, nullable=True)
  total_solved = db.Column(db.Integer, nullable=False, default=0, server_default="0")
  easy_solved = db.Column(db.Integer, nullable=False, default=0, server_default="0")
  medium_solved = db.Column(db.Integer, nullable=False, default=0, server_default="0")
  hard_solved = db.Column(db.Integer, nullable=False, default=0, server_default="0")
  completion_verified_at = db.Column(db.DateTime, nullable=True)
  last_synced_at = db.Column(db.DateTime, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  __table_args__ = (
    db.UniqueConstraint("leetcode_username", name="uq_leetcode_verifications_username"),
  )

  user = db.relationship("User", backref=db.backref("leetcode_progress", uselist=False))


class ProjectSubmission(db.Model):
  __tablename__ = "project_submissions"

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
  repo_url = db.Column(db.String(500), nullable=False)
  deployed_url = db.Column(db.String(500), nullable=True)
  source_type = db.Column(db.String(32), nullable=False, default="github", server_default="github")
  source_label = db.Column(db.String(255), nullable=True)
  status = db.Column(db.String(32), nullable=False, default="pending", server_default="pending")
  review_notes = db.Column(db.Text, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  user = db.relationship("User", backref=db.backref("project_submissions", lazy=True))


class ResumeSubmission(db.Model):
  __tablename__ = "resume_submissions"

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
  file_name = db.Column(db.String(255), nullable=False)
  file_size_bytes = db.Column(db.Integer, nullable=False)
  page_count = db.Column(db.Integer, nullable=True)
  extracted_char_count = db.Column(db.Integer, nullable=True)
  status = db.Column(db.String(32), nullable=False, default="failed", server_default="failed")
  provider = db.Column(db.String(64), nullable=True)
  model = db.Column(db.String(120), nullable=True)
  prompt_version = db.Column(db.String(64), nullable=True)
  overall_score = db.Column(db.Integer, nullable=True)
  formatting_score = db.Column(db.Integer, nullable=True)
  content_score = db.Column(db.Integer, nullable=True)
  ats_score = db.Column(db.Integer, nullable=True)
  impact_score = db.Column(db.Integer, nullable=True)
  strengths_json = db.Column(db.Text, nullable=True)
  improvements_json = db.Column(db.Text, nullable=True)
  error_code = db.Column(db.String(64), nullable=True)
  error_message = db.Column(db.String(500), nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  user = db.relationship("User", backref=db.backref("resume_submissions", lazy=True))

  @property
  def strengths(self) -> list[str]:
    if not self.strengths_json:
      return []
    try:
      parsed = json.loads(self.strengths_json)
    except Exception:
      return []
    if not isinstance(parsed, list):
      return []
    return [str(item) for item in parsed if isinstance(item, str)]

  @property
  def improvements(self) -> list[str]:
    if not self.improvements_json:
      return []
    try:
      parsed = json.loads(self.improvements_json)
    except Exception:
      return []
    if not isinstance(parsed, list):
      return []
    return [str(item) for item in parsed if isinstance(item, str)]


class OnboardingAssessment(db.Model):
  __tablename__ = "onboarding_assessments"

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
  status = db.Column(db.String(32), nullable=False, default="draft", server_default="draft")
  track_key = db.Column(db.String(64), nullable=True)
  can_skip_coding_skills = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
  coding_skip_confidence = db.Column(db.Float, nullable=True)
  resume_submission_id = db.Column(db.Integer, db.ForeignKey("resume_submissions.id"), nullable=True)
  completed_at = db.Column(db.DateTime, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  user = db.relationship("User", backref=db.backref("onboarding_assessments", lazy=True))
  resume_submission = db.relationship("ResumeSubmission", foreign_keys=[resume_submission_id], lazy="joined")


class OnboardingProjectAssessment(db.Model):
  __tablename__ = "onboarding_project_assessments"

  id = db.Column(db.Integer, primary_key=True)
  assessment_id = db.Column(db.Integer, db.ForeignKey("onboarding_assessments.id"), nullable=False)
  slot_index = db.Column(db.Integer, nullable=False)
  input_mode = db.Column(db.String(32), nullable=False, default="repo", server_default="repo")
  repo_url = db.Column(db.String(500), nullable=True)
  uploaded_file_name = db.Column(db.String(255), nullable=True)
  has_api = db.Column(db.Boolean, nullable=True)
  has_database = db.Column(db.Boolean, nullable=True)
  has_coding_skills = db.Column(db.Boolean, nullable=True)
  coding_confidence = db.Column(db.Float, nullable=True)
  project_pass = db.Column(db.Boolean, nullable=True)
  is_coding_signal_only = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
  evidence_files_json = db.Column(db.Text, nullable=True)
  analysis_notes = db.Column(db.Text, nullable=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  __table_args__ = (
    db.UniqueConstraint("assessment_id", "slot_index", name="uq_onboarding_project_slot"),
  )

  assessment = db.relationship(
    "OnboardingAssessment",
    backref=db.backref("project_assessments", lazy=True, cascade="all, delete-orphan"),
  )

  @property
  def evidence_files(self) -> list[str]:
    if not self.evidence_files_json:
      return []
    try:
      parsed = json.loads(self.evidence_files_json)
    except Exception:
      return []
    if not isinstance(parsed, list):
      return []
    return [str(item) for item in parsed if isinstance(item, str)]
