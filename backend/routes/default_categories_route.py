# routes/default_categories_route.py

import logging

from apiflask import APIBlueprint
from flask import jsonify

from utils.error_response import error_response


def init_default_categories_route(app, db):
    bp = APIBlueprint("default_categories_route", __name__, tag="Category")

    @bp.route("/api/categories/default-config", methods=["GET"])
    @bp.doc(
        summary="取得全域預設分類設定",
        description="回傳 global_settings/default_categories_config_v2 的內容",
    )
    def get_default_categories_config():
        try:
            doc_ref = db.collection("global_settings").document("default_categories_config_v2")
            doc = doc_ref.get()

            if doc.exists:
                return jsonify({"success": True, "config": doc.to_dict()})
            else:
                return error_response("找不到預設分類設定", 404)

        except Exception:
            logging.exception("❌ 無法讀取預設分類設定")
            return error_response("伺服器內部錯誤", 500)

    app.register_blueprint(bp)
