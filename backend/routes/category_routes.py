from flask import Blueprint, request, jsonify
import logging
from services.categories import get_all_categories, sync_category

category_bp = Blueprint("category", __name__)

def init_category_routes(app, db):

    @category_bp.route("/api/categories", methods=["GET"])
    def api_get_categories():
        try:
            return jsonify(get_all_categories(db))
        except Exception:
            logging.error("🔥 /api/categories 發生例外錯誤", exc_info=True)
            return jsonify({"error": "Internal Server Error"}), 500

    @category_bp.route("/api/categories/sync", methods=["POST"])
    def sync_categories_route():
        try:
            incoming_data = request.get_json()
            if not isinstance(incoming_data, list):
                return jsonify({"error": "請傳入分類陣列"}), 400
            for item in incoming_data:
                sync_category(db, item)
            return jsonify({"message": "同步完成"}), 200
        except Exception:
            logging.error("🔥 /api/categories/sync 發生例外錯誤", exc_info=True)
            return jsonify({"error": "Internal Server Error"}), 500

    app.register_blueprint(category_bp)
