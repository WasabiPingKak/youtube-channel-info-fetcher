from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import logging
from utils.jwt_util import verify_jwt
from utils.channel_validator import is_valid_channel_id

logger = logging.getLogger(__name__)

def init_skip_keyword_routes(app, db):
    bp = Blueprint("skip_keyword", __name__, url_prefix="/api/quick-editor/skip-keyword")

    def verify_auth():
        token = request.cookies.get("__session")
        if not token:
            logger.warning("🔒 未提供 __session JWT")
            return None, (jsonify({"error": "未登入或權限不足"}), 401)

        decoded = verify_jwt(token)
        if not decoded:
            logger.warning("🔒 JWT 驗證失敗")
            return None, (jsonify({"error": "無效的 token"}), 403)

        channel_id = decoded.get("channelId")
        if not channel_id:
            logger.warning("🔒 JWT 中缺少 channelId")
            return None, (jsonify({"error": "無效的使用者身份"}), 403)

        return channel_id, None

    @bp.route("/add", methods=["POST"])
    def add_skipped_keyword():
        try:
            user_channel_id, error = verify_auth()
            if error:
                return error

            logger.info(f"✅ /skip-keyword/add 驗證成功，channel_id = {user_channel_id}")

            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id or not keyword:
                return jsonify({"error": "channelId 與 keyword 為必填"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400

            if channel_id != user_channel_id:
                logger.warning(f"⛔ 嘗試略過他人頻道：JWT={user_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("skip_keywords")
            doc_ref.set({"skipped": firestore.ArrayUnion([keyword])}, merge=True)

            return jsonify({"success": True})

        except Exception as e:
            logger.error("🔥 加入略過關鍵字失敗：%s", str(e), exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    @bp.route("/remove", methods=["POST"])
    def remove_skipped_keyword():
        try:
            user_channel_id, error = verify_auth()
            if error:
                return error

            logger.info(f"✅ /skip-keyword/remove 驗證成功，channel_id = {user_channel_id}")

            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id or not keyword:
                return jsonify({"error": "channelId 與 keyword 為必填"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400

            if channel_id != user_channel_id:
                logger.warning(f"⛔ 嘗試移除他人略過關鍵字：JWT={user_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("skip_keywords")
            doc_ref.set({"skipped": firestore.ArrayRemove([keyword])}, merge=True)

            return jsonify({"success": True})

        except Exception as e:
            logger.error("🔥 移除略過關鍵字失敗：%s", str(e), exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    app.register_blueprint(bp)
