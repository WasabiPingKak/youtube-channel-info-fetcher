from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import logging
from utils.jwt_util import verify_jwt
from utils.channel_validator import is_valid_channel_id

logger = logging.getLogger(__name__)

def init_my_settings_route(app):
    bp = Blueprint("my_settings", __name__, url_prefix="/api/my-settings")

    def verify_auth():
        token = request.cookies.get("__session")
        if not token:
            logger.warning("🔒 未提供 __session cookie")
            return None, (jsonify({"error": "未登入或權限不足"}), 401)

        decoded = verify_jwt(token)
        if not decoded:
            logger.warning("🔒 無效的 __session token")
            return None, (jsonify({"error": "無效的 token"}), 403)

        channel_id = decoded.get("channelId")
        if not channel_id:
            logger.warning("🔒 token 中缺少 channelId")
            return None, (jsonify({"error": "無效的使用者身份"}), 403)

        return channel_id, None

    @bp.route("/get", methods=["GET"])
    def get_my_settings():
        user_channel_id, error = verify_auth()
        if error:
            return error

        logger.info(f"✅ /my-settings/get 驗證成功，channel_id = {user_channel_id}")

        channel_id = request.args.get("channelId")
        if not channel_id:
            return jsonify({"error": "Missing channelId"}), 400
        if not is_valid_channel_id(channel_id):
            return jsonify({"error": "channelId 格式不合法"}), 400

        if channel_id != user_channel_id:
            logger.warning(f"⛔ get_my_settings 嘗試讀取他人頻道設定：JWT={user_channel_id}, 請求 channel_id={channel_id}")
            return jsonify({"error": "無權限存取此頻道"}), 403

        db = firestore.client()
        try:
            batch_docs = db.collection("channel_index_batch").stream()

            for doc in batch_docs:
                batch = doc.to_dict()
                for item in batch.get("channels", []):
                    if item.get("channel_id") == channel_id:
                        return jsonify({
                            "enabled": item.get("enabled", False),
                            "countryCode": item.get("countryCode", []),
                            "channel_id": item.get("channel_id"),
                            "name": item.get("name"),
                            "thumbnail": item.get("thumbnail"),
                            "url": item.get("url"),
                            "show_live_status": item.get("show_live_status", True) # 若缺少則預設為 True
                        })

            return jsonify({"error": "Channel not found"}), 404

        except Exception as e:
            logger.exception("❌ get_my_settings 發生例外錯誤")
            return jsonify({"error": str(e)}), 500

    @bp.route("/update", methods=["POST"])
    def update_my_settings():
        user_channel_id, error = verify_auth()
        if error:
            return error

        logger.info(f"✅ /my-settings/update 驗證成功，channel_id = {user_channel_id}")

        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            enabled = data.get("enabled")
            country_code = data.get("countryCode")
            show_live_status = data.get("show_live_status", True)  # 若缺少則預設為 True

            if not channel_id:
                return jsonify({"error": "Missing channelId"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400
            if channel_id != user_channel_id:
                logger.warning(f"⛔ update_my_settings 嘗試修改他人頻道資料：JWT={user_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限修改此頻道資料"}), 403

            if isinstance(country_code, list):
                country_code = country_code[:10]

            db = firestore.client()
            target_doc_ref = None
            target_channels = []

            batch_docs = db.collection("channel_index_batch").stream()
            for doc in batch_docs:
                doc_data = doc.to_dict()
                channels = doc_data.get("channels", [])
                for i, item in enumerate(channels):
                    if item.get("channel_id") == channel_id:
                        target_doc_ref = doc.reference
                        target_channels = channels
                        target_channels[i]["enabled"] = enabled
                        target_channels[i]["countryCode"] = country_code
                        target_channels[i]["show_live_status"] = show_live_status
                        break
                if target_doc_ref:
                    break

            if not target_doc_ref:
                return jsonify({"error": "Channel not found"}), 404

            target_doc_ref.update({
                "channels": target_channels
            })

            index_doc_ref = db.collection("channel_index").document(channel_id)
            index_doc_ref.set({
                "countryCode": country_code,
                "enabled": enabled,
                "show_live_status": show_live_status
            }, merge=True)

            return jsonify({"status": "ok"}), 200

        except Exception as e:
            logger.exception("❌ update_my_settings 發生例外錯誤")
            return jsonify({"error": str(e)}), 500

    app.register_blueprint(bp)
