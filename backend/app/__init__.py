from flask import Flask
from .config import Config
from .extensions import cors, db, jwt, migrate
from .routes.auth import bp as auth_bp
from .routes.user import bp as user_bp
from .routes.dashboard import bp as dashboard_bp
from .routes.skills import bp as skills_bp
from .routes.projects import bp as projects_bp
from .routes.resume import bp as resume_bp
from .routes.leetcode import bp as leetcode_bp


def create_app():
  app = Flask(__name__)
  app.config.from_object(Config)

  cors.init_app(
    app,
    supports_credentials=True,
    resources={
      r"/*": {
        "origins": app.config.get("CORS_ALLOWED_ORIGINS", []),
        "allow_headers": ["Content-Type", "Authorization", "X-CSRF-TOKEN"],
        "methods": ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
      }
    }
  )
  db.init_app(app)
  jwt.init_app(app)
  migrate.init_app(app, db)

  @jwt.token_in_blocklist_loader
  def is_token_revoked(jwt_header, jwt_payload):
    subject = jwt_payload.get("sub")
    token_version = jwt_payload.get("token_version")
    try:
      user_id = int(subject)
      token_version_value = int(token_version)
    except (TypeError, ValueError):
      return True

    from .models import User

    user = db.session.get(User, user_id)
    if user is None:
      return True
    return token_version_value != int(user.token_version or 0)

  app.register_blueprint(auth_bp)
  app.register_blueprint(user_bp)
  app.register_blueprint(dashboard_bp)
  app.register_blueprint(skills_bp)
  app.register_blueprint(projects_bp)
  app.register_blueprint(resume_bp)
  app.register_blueprint(leetcode_bp)

  @app.after_request
  def apply_security_headers(response):
    if not app.config.get("SECURITY_HEADERS_ENABLED", True):
      return response
    response.headers.setdefault("Content-Security-Policy", app.config.get("SECURITY_CSP", ""))
    response.headers.setdefault(
      "Referrer-Policy",
      app.config.get("SECURITY_REFERRER_POLICY", "strict-origin-when-cross-origin"),
    )
    response.headers.setdefault("X-Frame-Options", app.config.get("SECURITY_X_FRAME_OPTIONS", "DENY"))
    response.headers.setdefault(
      "X-Content-Type-Options",
      app.config.get("SECURITY_X_CONTENT_TYPE_OPTIONS", "nosniff"),
    )
    if app.config.get("IS_PRODUCTION"):
      response.headers.setdefault("Strict-Transport-Security", app.config.get("SECURITY_HSTS", ""))
    return response

  @app.get("/")
  def health():
    return {"status": "ok"}

  return app
