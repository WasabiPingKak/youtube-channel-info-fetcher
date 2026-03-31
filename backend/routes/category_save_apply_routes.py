# routes/category_save_apply_routes.py

import logging

from apiflask import APIBlueprint
from flask import jsonify

from schemas.settings_schemas import SaveAndApplyRequest
from services.firestore_settings_service import (
    load_category_settings,
    save_category_settings,
)
from utils.auth_decorator import require_auth
from utils.error_response import error_response

category_save_apply_bp = APIBlueprint("category_save_apply", __name__, tag="Category Editor")


def init_category_save_apply_routes(app, db):
    @category_save_apply_bp.route("/api/categories/save-and-apply", methods=["POST"])
    @category_save_apply_bp.doc(
        summary="儲存並套用分類設定",
        description="儲存分類設定並套用至頻道影片",
        security="CookieAuth",
    )
    @require_auth(db)
    @category_save_apply_bp.input(SaveAndApplyRequest, arg_name="body")
    def save_and_apply(body, auth_channel_id=None):
        try:
            if body.channel_id != auth_channel_id:
                logging.warning(
                    f"⛔ 嘗試儲存他人頻道分類：JWT={auth_channel_id}, 請求={body.channel_id}"
                )
                return error_response("無權限操作此頻道", 403)

            # 1. 讀取現有設定
            old = load_category_settings(db, body.channel_id)
            # 2. 若已有且與新 settings 完全相同，直接跳過儲存與套用
            if old is not None and old == body.settings:
                return jsonify(
                    {
                        "success": True,
                        "message": "設定未變更，已跳過儲存與套用",
                        "updated_count": 0,
                    }
                )

            # 儲存分類設定
            saved = save_category_settings(db, body.channel_id, body.settings)
            if not saved:
                return error_response("無法儲存分類設定", 500)

            return jsonify(
                {"success": True, "message": "設定已儲存並成功套用分類", "updated_count": -1}
            )

        except Exception:
            logging.exception("🔥 /api/categories/save-and-apply 發生例外錯誤")
            return error_response("伺服器內部錯誤", 500)

    app.register_blueprint(category_save_apply_bp)
