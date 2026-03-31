# routes/quick_editor_init_route.py

import logging

from apiflask import APIBlueprint
from flask import jsonify, request
from google.api_core.exceptions import GoogleAPIError

from utils.auth_decorator import require_auth
from utils.channel_validator import is_valid_channel_id
from utils.error_response import error_response


def init_quick_editor_init_route(app, db):
    bp = APIBlueprint("quick_editor_init_route", __name__, tag="Category Editor")

    @bp.route("/api/quick-editor/init-data", methods=["GET"])
    @bp.doc(
        summary="取得快速分類編輯器初始資料",
        description="一次取得 skip_keywords 與 config 設定",
        security="CookieAuth",
    )
    @require_auth(db)
    def get_quick_editor_init_data(auth_channel_id=None):
        channel_id = request.args.get("channel_id")
        if not channel_id:
            return error_response("channel_id 為必填", 400)
        if not is_valid_channel_id(channel_id):
            return error_response("channel_id 格式不合法", 400)

        if channel_id != auth_channel_id:
            # 檢查是否為 admin
            meta_ref = (
                db.collection("channel_data")
                .document(auth_channel_id)
                .collection("channel_info")
                .document("meta")
            )
            meta = meta_ref.get().to_dict() or {}
            if not meta.get("isAdmin"):
                return error_response("無權限存取此頻道", 403)

        try:
            base_ref = db.collection("channel_data").document(channel_id).collection("settings")

            # 讀取 skip_keywords
            skip_doc = base_ref.document("skip_keywords").get()
            skip_keywords = []
            if skip_doc.exists:
                skip_keywords = skip_doc.to_dict().get("skipped", [])

            # 讀取 config
            config_doc = base_ref.document("config").get()
            config = config_doc.to_dict() if config_doc.exists else {}

            return jsonify(
                {
                    "success": True,
                    "skip_keywords": skip_keywords,
                    "config": config,
                }
            )

        except GoogleAPIError:
            logging.exception("❌ Firestore 操作失敗")
            return error_response("Firestore 操作失敗", 500)

        except Exception:
            logging.exception("❌ 無法讀取快速編輯器初始資料")
            return error_response("伺服器內部錯誤", 500)

    app.register_blueprint(bp)
