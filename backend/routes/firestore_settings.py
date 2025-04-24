from flask import Blueprint, request, jsonify
import logging
from services.firestore_settings import load_category_settings

firestore_settings_bp = Blueprint("firestore_settings", __name__)

def init_firestore_settings_routes(app):
    app.register_blueprint(firestore_settings_bp)

@firestore_settings_bp.route("/api/firestore/load-category-settings", methods=["POST"])
def load_category_settings_route():
    try:
        data = request.get_json()
        channel_id = data.get("channel_id")

        if not channel_id:
            return jsonify({"success": False, "error": "缺少 channel_id"}), 400

        settings = load_category_settings(channel_id)
        if settings is None:
            return jsonify({"success": False, "error": "找不到設定"}), 404

        return jsonify({"success": True, "settings": settings})

    except Exception:
        logging.exception("🔥 無法載入分類設定")
        return jsonify({"success": False, "error": "伺服器內部錯誤"}), 500
