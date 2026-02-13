from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.post("/register")
def register():
  data = request.get_json() or {}
  email = data.get("email")
  password = data.get("password")

  if not email or not password:
    return jsonify({"error": "Email and password are required"}), 400

  if User.query.filter_by(email=email).first():
    return jsonify({"error": "Email already registered"}), 409

  user = User(email=email)
  try:
    user.set_password(password)
  except ValueError:
    return jsonify({"error": "Password too long (max 72 bytes)."}), 400
  db.session.add(user)
  db.session.commit()

  token = create_access_token(identity=str(user.id))
  return jsonify({"access_token": token, "user": user.to_dict()})

@bp.post("/login")
def login():
  data = request.get_json() or {}
  email = data.get("email")
  password = data.get("password")

  if not email or not password:
    return jsonify({"error": "Email and password are required"}), 400

  user = User.query.filter_by(email=email).first()
  if not user or not user.check_password(password):
    return jsonify({"error": "Invalid credentials"}), 401

  token = create_access_token(identity=str(user.id))
  return jsonify({"access_token": token, "user": user.to_dict()})

@bp.get("/me")
@jwt_required()
def me():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  return jsonify({"user": user.to_dict()})
