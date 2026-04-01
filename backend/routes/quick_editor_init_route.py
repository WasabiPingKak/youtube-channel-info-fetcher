# routes/quick_editor_init_route.py

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud import firestore

from schemas.common import ChannelIdQuery
from utils.auth_decorator import require_auth
from utils.error_response import error_response


def init_quick_editor_init_route(app, db: firestore.Client):
    bp = APIBlueprint("quick_editor_init_route", __name__, tag="Category Editor")

    @bp.route("/api/quick-editor/init-data", methods=["GET"])
    @bp.doc(
        summary="取得快速分類編輯器初始資料",
        description="一次取得 skip_keywords 與 config 設定",
        security="CookieAuth",
    )
    @require_auth(db)
    @bp.input(ChannelIdQuery, location="query", arg_name="query")
    def get_quick_editor_init_data(query, auth_channel_id=None):
        channel_id = query.channel_id

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

    app.register_blueprint(bp)
