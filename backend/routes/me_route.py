from flask import Blueprint, request, jsonify
from utils.jwt_util import verify_jwt
import logging

def init_me_route(app, db):
    me_bp = Blueprint("me", __name__, url_prefix="/api")

    @me_bp.route("/me", methods=["GET"])
    def get_me():
        token = request.cookies.get("__session")
        if not token:
            logging.info("🔓 /api/me：匿名訪問")
            return jsonify({"channelId": None}), 200

        decoded = verify_jwt(token)
        if not decoded:
            logging.warning("🔒 /api/me：JWT 驗證失敗，非法 token")
            return jsonify({"error": "Invalid token"}), 403

        channel_id = decoded.get("channelId")
        logging.info(f"✅ /api/me：驗證成功，channel_id = {channel_id}")

        # Firestore 讀取使用者名稱與頭像
        doc_ref = db.collection("channel_index").document(channel_id)
        doc = doc_ref.get()

        if not doc.exists:
            logging.error(f"❌ Firestore 找不到頻道：{channel_id}")
            return jsonify({"channelId": channel_id, "name": None, "thumbnail": None}), 200

        data = doc.to_dict()
        return jsonify({
            "channelId": channel_id,
            "name": data.get("name"),
            "thumbnail": data.get("thumbnail"),
        }), 200

    app.register_blueprint(me_bp)
