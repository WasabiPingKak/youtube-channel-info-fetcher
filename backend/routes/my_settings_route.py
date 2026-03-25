from flask import Blueprint, request, jsonify
import logging
from utils.auth_decorator import require_auth
from utils.channel_validator import is_valid_channel_id

logger = logging.getLogger(__name__)

def init_my_settings_route(app, db):
    bp = Blueprint("my_settings", __name__, url_prefix="/api/my-settings")

    @bp.route("/get", methods=["GET"])
    @require_auth
    def get_my_settings(auth_channel_id=None):
        logger.info(f"✅ /my-settings/get 驗證成功，channel_id = {auth_channel_id}")

        channel_id = request.args.get("channelId")
        if not channel_id:
            return jsonify({"error": "Missing channelId"}), 400
        if not is_valid_channel_id(channel_id):
            return jsonify({"error": "channelId 格式不合法"}), 400

        if channel_id != auth_channel_id:
            logger.warning(f"⛔ get_my_settings 嘗試讀取他人頻道設定：JWT={auth_channel_id}, 請求 channel_id={channel_id}")
            return jsonify({"error": "無權限存取此頻道"}), 403

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
                            "show_live_status": item.get("show_live_status", True)
                        })

            return jsonify({"error": "Channel not found"}), 404

        except Exception as e:
            logger.exception("❌ get_my_settings 發生例外錯誤")
            return jsonify({"error": "內部伺服器錯誤"}), 500

    @bp.route("/update", methods=["POST"])
    @require_auth
    def update_my_settings(auth_channel_id=None):
        logger.info(f"✅ /my-settings/update 驗證成功，channel_id = {auth_channel_id}")

        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            enabled = data.get("enabled")
            country_code = data.get("countryCode")
            show_live_status = data.get("show_live_status", True)

            if not channel_id:
                return jsonify({"error": "Missing channelId"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400
            if channel_id != auth_channel_id:
                logger.warning(f"⛔ update_my_settings 嘗試修改他人頻道資料：JWT={auth_channel_id}, 請求 channel_id={channel_id}")
                return jsonify({"error": "無權限修改此頻道資料"}), 403

            if isinstance(country_code, list):
                country_code = country_code[:10]

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
            return jsonify({"error": "內部伺服器錯誤"}), 500

    app.register_blueprint(bp)
