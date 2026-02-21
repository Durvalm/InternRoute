from flask import Flask
from .config import Config
from .extensions import cors, db, jwt, migrate
from .routes.auth import bp as auth_bp
from .routes.user import bp as user_bp
from .routes.dashboard import bp as dashboard_bp
from .routes.skills import bp as skills_bp
from .routes.projects import bp as projects_bp


def create_app():
  app = Flask(__name__)
  app.config.from_object(Config)

  cors.init_app(
    app,
    resources={
      r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
      }
    }
  )
  db.init_app(app)
  jwt.init_app(app)
  migrate.init_app(app, db)

  app.register_blueprint(auth_bp)
  app.register_blueprint(user_bp)
  app.register_blueprint(dashboard_bp)
  app.register_blueprint(skills_bp)
  app.register_blueprint(projects_bp)

  @app.get("/")
  def health():
    return {"status": "ok"}

  return app
