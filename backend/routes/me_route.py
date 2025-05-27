from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_jwt
import logging

def init_me_route(app):
    me_bp = Blueprint("me", __name__, url_prefix="/api")

    @me_bp.route("/me", methods=["GET"])
    def get_me():
        token = request.cookies.get("__session")
        if not token:
            logging.warning("🔒 /api/me：缺少 __session cookie")
            return "Unauthorized", 401

        decoded = verify_jwt(token)
        if not decoded:
            logging.warning("🔒 /api/me：JWT 驗證失敗")
            return "Unauthorized", 401

        channel_id = decoded.get("channelId")
        logging.info(f"✅ /api/me：驗證成功，channel_id = {channel_id}")

        return jsonify({"channelId": channel_id})

    app.register_blueprint(me_bp)
