import logging
import uuid

from flask import Blueprint, jsonify
from google.cloud.firestore import SERVER_TIMESTAMP

from utils.rate_limiter import limiter


def init_oauth_state_route(app, db):
    bp = Blueprint("oauth_state", __name__, url_prefix="/api")

    @bp.route("/oauth/state", methods=["POST"])
    @limiter.limit("10 per minute")
    def create_oauth_state():
        state = str(uuid.uuid4())
        db.collection("oauth_states").document(state).set(
            {
                "created_at": SERVER_TIMESTAMP,
            }
        )
        logging.info(f"✅ 已產生 OAuth state：{state[:8]}...")
        return jsonify({"state": state})

    app.register_blueprint(bp)
