import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore

from schemas.common import ChannelIdCamelQuery
from schemas.settings_schemas import UpdateSettingsRequest
from utils.auth_decorator import require_auth

logger = logging.getLogger(__name__)


def init_my_settings_route(app, db):
    bp = APIBlueprint("my_settings", __name__, url_prefix="/api/my-settings", tag="Settings")

    @bp.route("/get", methods=["GET"])
    @bp.doc(
        summary="取得個人設定", description="取得目前登入使用者的頻道設定", security="CookieAuth"
    )
    @require_auth(db)
    @bp.input(ChannelIdCamelQuery, location="query", arg_name="query")
    def get_my_settings(query, auth_channel_id=None):
        logger.info(f"✅ /my-settings/get 驗證成功，channel_id = {auth_channel_id}")

        channel_id = query.channelId

        if channel_id != auth_channel_id:
            logger.warning(
                f"⛔ get_my_settings 嘗試讀取他人頻道設定：JWT={auth_channel_id}, 請求 channel_id={channel_id}"
            )
            return jsonify({"error": "無權限存取此頻道"}), 403

        try:
            doc_ref = db.collection("channel_index").document(channel_id)
            doc = doc_ref.get()

            if not doc.exists:
                return jsonify({"error": "Channel not found"}), 404

            data = doc.to_dict()
            return jsonify(
                {
                    "enabled": data.get("enabled", False),
                    "countryCode": data.get("countryCode", []),
                    "channel_id": channel_id,
                    "name": data.get("name"),
                    "thumbnail": data.get("thumbnail"),
                    "url": data.get("url"),
                    "show_live_status": data.get("show_live_status", True),
                }
            )

        except GoogleAPIError:
            logger.exception("❌ Firestore 操作失敗")
            return jsonify({"error": "Firestore 操作失敗"}), 500

        except Exception:
            logger.exception("❌ get_my_settings 發生例外錯誤")
            return jsonify({"error": "內部伺服器錯誤"}), 500

    @bp.route("/update", methods=["POST"])
    @bp.doc(
        summary="更新個人設定", description="更新頻道的顯示、國家代碼等設定", security="CookieAuth"
    )
    @require_auth(db)
    @bp.input(UpdateSettingsRequest, arg_name="body")
    def update_my_settings(body, auth_channel_id=None):
        logger.info(f"✅ /my-settings/update 驗證成功，channel_id = {auth_channel_id}")

        try:
            if body.channelId != auth_channel_id:
                logger.warning(
                    f"⛔ update_my_settings 嘗試修改他人頻道資料：JWT={auth_channel_id}, 請求 channel_id={body.channelId}"
                )
                return jsonify({"error": "無權限修改此頻道資料"}), 403

            # 先掃描找到目標 batch doc ref
            target_doc_ref = None
            batch_docs = db.collection("channel_index_batch").stream()
            for doc in batch_docs:
                doc_data = doc.to_dict()
                channels = doc_data.get("channels", [])
                if any(item.get("channel_id") == body.channelId for item in channels):
                    target_doc_ref = doc.reference
                    break

            if not target_doc_ref:
                return jsonify({"error": "Channel not found"}), 404

            # Transaction 內讀取最新版本再修改
            @firestore.transactional
            def _update_batch_in_transaction(transaction):
                fresh_doc = target_doc_ref.get(transaction=transaction)
                fresh_channels = fresh_doc.to_dict().get("channels", [])
                for i, item in enumerate(fresh_channels):
                    if item.get("channel_id") == body.channelId:
                        fresh_channels[i]["enabled"] = body.enabled
                        fresh_channels[i]["countryCode"] = body.countryCode
                        fresh_channels[i]["show_live_status"] = body.show_live_status
                        break
                transaction.update(target_doc_ref, {"channels": fresh_channels})

            transaction = db.transaction()
            _update_batch_in_transaction(transaction)

            # channel_index 是獨立文件的 merge，不需 Transaction
            index_doc_ref = db.collection("channel_index").document(body.channelId)
            index_doc_ref.set(
                {
                    "countryCode": body.countryCode,
                    "enabled": body.enabled,
                    "show_live_status": body.show_live_status,
                },
                merge=True,
            )

            return jsonify({"success": True}), 200

        except GoogleAPIError:
            logger.exception("❌ Firestore 操作失敗")
            return jsonify({"error": "Firestore 操作失敗"}), 500

        except Exception:
            logger.exception("❌ update_my_settings 發生例外錯誤")
            return jsonify({"error": "內部伺服器錯誤"}), 500

    app.register_blueprint(bp)
