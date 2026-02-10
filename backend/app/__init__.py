from flask import Flask
from .config import Config
from .extensions import cors, db, jwt, migrate
from .routes.auth import bp as auth_bp
from .routes.user import bp as user_bp
from .routes.dashboard import bp as dashboard_bp


def create_app():
  app = Flask(__name__)
  app.config.from_object(Config)

  cors.init_app(app, resources={r"/*": {"origins": "*"}})
  db.init_app(app)
  jwt.init_app(app)
  migrate.init_app(app, db)

  app.register_blueprint(auth_bp)
  app.register_blueprint(user_bp)
  app.register_blueprint(dashboard_bp)

  @app.get("/")
  def health():
    return {"status": "ok"}

  return app
