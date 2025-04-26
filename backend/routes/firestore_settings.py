from flask import Blueprint, request, jsonify
import logging
from services.firestore_settings import load_category_settings, save_category_settings

firestore_settings_bp = Blueprint("firestore_settings", __name__)

def init_firestore_settings_routes(app):
    app.register_blueprint(firestore_settings_bp)

@firestore_settings_bp.route("/api/firestore/load-category-settings", methods=["POST"])
def load_category_settings_route():
    try:
        data = request.get_json()
        channel_id = data.get("channel_id")

        if not channel_id:
            logging.error("❌ 請求缺少 channel_id")
            return jsonify({"success": False, "error": "缺少 channel_id", "code": "MISSING_CHANNEL_ID"}), 200

        logging.info(f"📨 收到讀取分類設定請求，channel_id={channel_id}")

        settings  = load_category_settings(channel_id)
        logging.debug(f"🛠️ 載入分類設定結果：{settings }")

        if settings is not None:
            logging.info(f"✅ 成功載入分類設定，channel_id={channel_id}")
            return jsonify({"success": True, "settings": settings}), 200
        else:
            logging.warning(f"⚠️ 設定不存在，channel_id={channel_id}")
            return jsonify({"success": False, "error": "NOT_FOUND", "code": "not-found"}), 200

    except Exception:
        logging.exception("🔥 無法載入分類設定")
        return jsonify({"success": False, "error": "伺服器內部錯誤", "code": "INTERNAL_SERVER_ERROR"}), 200

def create_default_config():
    categories = ["遊戲", "雜談", "音樂", "節目", "其他"]

    def empty_category():
        return {cat: [] for cat in categories}

    return {
        "live": empty_category(),
        "videos": empty_category(),
        "shorts": empty_category(),
    }
