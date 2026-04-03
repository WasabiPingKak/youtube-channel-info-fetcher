import logging
from typing import Any

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud import firestore

from schemas.settings_schemas import LoadSettingsRequest
from services.firestore_settings_service import load_category_settings, save_category_settings
from utils.error_response import error_response

firestore_settings_bp = APIBlueprint("firestore_settings", __name__, tag="Settings")


def init_firestore_settings_routes(app, db: firestore.Client):
    @firestore_settings_bp.route("/api/firestore/load-category-settings", methods=["POST"])
    @firestore_settings_bp.doc(summary="載入分類設定", description="依頻道 ID 載入分類設定")
    @firestore_settings_bp.input(LoadSettingsRequest, arg_name="body")
    def load_category_settings_route(body):
        logging.info(f"📨 收到讀取分類設定請求，channel_id={body.channel_id}")

        settings = load_category_settings(db, body.channel_id)
        logging.debug(f"🛠️ 載入分類設定結果：{settings}")

        if settings is not None:
            logging.info(f"✅ 成功載入分類設定，channel_id={body.channel_id}")
            return jsonify({"success": True, "settings": settings}), 200

        # 設定不存在，若 init_default=True 則自動建立預設結構
        if body.init_default:
            default_settings: dict[str, dict[str, Any]] = {
                "雜談": {},
                "遊戲": {},
                "音樂": {},
                "節目": {},
            }
            save_category_settings(db, body.channel_id, default_settings)
            logging.info(f"✅ 自動建立預設分類設定，channel_id={body.channel_id}")
            return jsonify({"success": True, "settings": default_settings}), 200

        logging.warning(f"⚠️ 設定不存在，channel_id={body.channel_id}")
        return error_response("設定不存在", 404)

    app.register_blueprint(firestore_settings_bp)
