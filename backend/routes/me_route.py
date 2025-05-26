# routes/me_route.py
from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_jwt
import logging

def init_me_route(app):
    me_bp = Blueprint("me", __name__, url_prefix="/api")

    @me_bp.route("/me", methods=["GET"])
    def get_me():
        token = request.cookies.get("auth_token")

        # ✅ Debug log：顯示 cookie 有沒有收到
        if not token:
            logging.warning("🔒 /api/me：未提供 auth_token cookie")
            return "Unauthorized", 401

        # ✅ Debug log：驗證 token
        decoded = verify_jwt(token)
        if not decoded:
            logging.warning(f"🔒 /api/me：JWT 驗證失敗，token={token}")
            return "Unauthorized", 401

        channel_id = decoded.get("channelId")
        logging.info(f"✅ /api/me：已登入頻道 {channel_id}")
        return jsonify({"channelId": channel_id})

    app.register_blueprint(me_bp)
