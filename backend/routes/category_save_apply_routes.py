# routes/category_save_apply_routes.py

from flask import Blueprint, request, jsonify
import logging
from services.firestore_settings_service import (
    load_category_settings,
    save_category_settings,
)

category_save_apply_bp = Blueprint("category_save_apply", __name__)

def init_category_save_apply_routes(app, db):
    @category_save_apply_bp.route("/api/categories/save-and-apply", methods=["POST"])
    def save_and_apply():
        try:
            data = request.get_json()
            channel_id = data.get("channel_id")
            settings   = data.get("settings")

            if not channel_id or not isinstance(settings, dict):
                return jsonify({
                    "success": False,
                    "error":   "缺少必要欄位 channel_id 或 settings"
                }), 400

            # 1. 讀取現有設定
            old = load_category_settings(channel_id)
            # 2. 若已有且與新 settings 完全相同，直接跳過儲存與套用
            if old is not None and old == settings:
                return jsonify({
                    "success":       True,
                    "message":       "設定未變更，已跳過儲存與套用",
                    "updated_count": 0,
                })

            # 儲存分類設定
            saved = save_category_settings(channel_id, settings)
            if not saved:
                return jsonify({
                    "success": False,
                    "error":   "無法儲存分類設定"
                }), 500

            return jsonify({
                "success":       True,
                "message":       "設定已儲存並成功套用分類",
                "updated_count": -1
            })

        except Exception:
            logging.exception("🔥 /api/categories/save-and-apply 發生例外錯誤")
            return jsonify({
                "success": False,
                "error":   "伺服器內部錯誤"
            }), 500

    app.register_blueprint(category_save_apply_bp)
