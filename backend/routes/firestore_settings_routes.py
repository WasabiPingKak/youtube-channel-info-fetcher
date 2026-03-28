import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from schemas.settings_schemas import LoadSettingsRequest
from services.firestore_settings_service import load_category_settings

firestore_settings_bp = Blueprint("firestore_settings", __name__)


def init_firestore_settings_routes(app, db):
    @firestore_settings_bp.route("/api/firestore/load-category-settings", methods=["POST"])
    def load_category_settings_route():
        try:
            data = request.get_json()
            body = LoadSettingsRequest(**data)

            logging.info(f"📨 收到讀取分類設定請求，channel_id={body.channel_id}")

            settings = load_category_settings(db, body.channel_id)
            logging.debug(f"🛠️ 載入分類設定結果：{settings}")

            if settings is not None:
                logging.info(f"✅ 成功載入分類設定，channel_id={body.channel_id}")
                return jsonify({"success": True, "settings": settings}), 200
            else:
                logging.warning(f"⚠️ 設定不存在，channel_id={body.channel_id}")
                return jsonify({"success": False, "error": "NOT_FOUND", "code": "not-found"}), 200

        except ValidationError:
            raise
        except Exception:
            logging.exception("🔥 無法載入分類設定")
            return jsonify(
                {"success": False, "error": "伺服器內部錯誤", "code": "INTERNAL_SERVER_ERROR"}
            ), 200

    app.register_blueprint(firestore_settings_bp)
