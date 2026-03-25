from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import logging
from utils.auth_decorator import require_auth
from utils.channel_validator import is_valid_channel_id

logger = logging.getLogger(__name__)

def init_skip_keyword_routes(app, db):
    bp = Blueprint("skip_keyword", __name__, url_prefix="/api/quick-editor/skip-keyword")

    @bp.route("/add", methods=["POST"])
    @require_auth
    def add_skipped_keyword(auth_channel_id=None):
        try:
            logger.info(f"✅ /skip-keyword/add 驗證成功，channel_id = {auth_channel_id}")

            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id or not keyword:
                return jsonify({"error": "channelId 與 keyword 為必填"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400

            if channel_id != auth_channel_id:
                logger.warning(f"⛔ 嘗試略過他人頻道：JWT={auth_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("skip_keywords")
            doc_ref.set({"skipped": firestore.ArrayUnion([keyword])}, merge=True)

            return jsonify({"success": True})

        except Exception as e:
            logger.error("🔥 加入略過關鍵字失敗：%s", str(e), exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    @bp.route("/remove", methods=["POST"])
    @require_auth
    def remove_skipped_keyword(auth_channel_id=None):
        try:
            logger.info(f"✅ /skip-keyword/remove 驗證成功，channel_id = {auth_channel_id}")

            data = request.get_json()
            channel_id = data.get("channelId")
            keyword = data.get("keyword")

            if not channel_id or not keyword:
                return jsonify({"error": "channelId 與 keyword 為必填"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400

            if channel_id != auth_channel_id:
                logger.warning(f"⛔ 嘗試移除他人略過關鍵字：JWT={auth_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            doc_ref = db.collection("channel_data").document(channel_id).collection("settings").document("skip_keywords")
            doc_ref.set({"skipped": firestore.ArrayRemove([keyword])}, merge=True)

            return jsonify({"success": True})

        except Exception as e:
            logger.error("🔥 移除略過關鍵字失敗：%s", str(e), exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    app.register_blueprint(bp)
