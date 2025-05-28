from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)

def init_my_settings_route(app):
    bp = Blueprint("my_settings", __name__, url_prefix="/api/my-settings")

    @bp.route("/get", methods=["GET"])
    def get_my_settings():
        channel_id = request.args.get("channelId")
        if not channel_id:
            return jsonify({"error": "Missing channelId"}), 400

        db = firestore.client()
        try:
            # 搜尋所有 batch 文件
            batch_docs = db.collection("channel_index_batch").stream()

            for doc in batch_docs:
                batch = doc.to_dict()
                for item in batch.get("channels", []):
                    if item.get("channel_id") == channel_id:
                        # 🔄 回傳完整頻道卡片需要的欄位
                        return jsonify({
                            "enabled": item.get("enabled", False),
                            "countryCode": item.get("countryCode", []),
                            "channel_id": item.get("channel_id"),
                            "name": item.get("name"),
                            "thumbnail": item.get("thumbnail"),
                            "url": item.get("url"),
                        })

            return jsonify({"error": "Channel not found"}), 404

        except Exception as e:
            logger.exception("❌ get_my_settings 發生例外錯誤")
            return jsonify({"error": str(e)}), 500

    @bp.route("/update", methods=["POST"])
    def update_my_settings():
        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            enabled = data.get("enabled")
            country_code = data.get("countryCode")

            if not channel_id:
                return jsonify({"error": "Missing channelId"}), 400

            if isinstance(country_code, list):
                country_code = country_code[:10]

            db = firestore.client()
            target_doc_ref = None
            target_channels = []

            # 🔍 找出該 channel 所在的 batch 文件
            batch_docs = db.collection("channel_index_batch").stream()
            for doc in batch_docs:
                doc_data = doc.to_dict()
                channels = doc_data.get("channels", [])
                for i, item in enumerate(channels):
                    if item.get("channel_id") == channel_id:
                        # ✅ 找到了，就記錄下來
                        target_doc_ref = doc.reference
                        target_channels = channels
                        # 更新欄位
                        target_channels[i]["enabled"] = enabled
                        target_channels[i]["countryCode"] = country_code
                        break
                if target_doc_ref:
                    break

            if not target_doc_ref:
                return jsonify({"error": "Channel not found"}), 404

            # 📝 寫回更新後的陣列
            target_doc_ref.update({
                "channels": target_channels
            })

            # ✅ 新增：同步寫入 channel_index/{channelId}
            index_doc_ref = db.collection("channel_index").document(channel_id)
            index_doc_ref.set({
                "countryCode": country_code,
                "enabled": enabled
            }, merge=True)

            return jsonify({"status": "ok"}), 200

        except Exception as e:
            logger.exception("❌ update_my_settings 發生例外錯誤")
            return jsonify({"error": str(e)}), 500


    app.register_blueprint(bp)