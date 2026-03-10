from app import create_app

app = create_app()

if __name__ == "__main__":
  app.run(
    host=app.config.get("FLASK_RUN_HOST", "127.0.0.1"),
    port=int(app.config.get("FLASK_RUN_PORT", 5000)),
    debug=bool(app.config.get("DEBUG", False)),
  )
