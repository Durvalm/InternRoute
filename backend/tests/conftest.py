import os

import pytest
from flask_jwt_extended import create_access_token

os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("RESUME_SCORER_ENABLED", "true")
os.environ.setdefault("SUPERUSER_EMAILS", "")

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import Module, Task, User, UserProgress  # noqa: E402


@pytest.fixture()
def app():
  app = create_app()
  app.config.update(
    TESTING=True,
    SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
    RESUME_SCORER_ENABLED=True,
  )

  with app.app_context():
    db.create_all()

    resume_module = Module(
      key="resume",
      name="Resume",
      category="resume",
      overall_weight=10,
      unlock_threshold=80,
      sort_order=1,
    )
    db.session.add(resume_module)
    db.session.flush()

    resume_task = Task(
      module_id=resume_module.id,
      challenge_id="resume_pass_threshold",
      title="Resume Module: Reach resume score threshold.",
      description="Upload your resume and reach a score of at least 80.",
      weight=100,
      is_bonus=False,
      sort_order=1,
      is_active=True,
    )
    db.session.add(resume_task)

    user = User(email="student@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.flush()
    db.session.add(UserProgress(user_id=user.id))
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    app.config["TEST_USER_ID"] = user.id
    app.config["TEST_RESUME_TASK_ID"] = resume_task.id
    app.config["TEST_TOKEN"] = token

    yield app

    db.session.remove()
    db.drop_all()


@pytest.fixture()
def client(app):
  return app.test_client()


@pytest.fixture()
def auth_headers(app):
  return {"Authorization": f"Bearer {app.config['TEST_TOKEN']}"}
