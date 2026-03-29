import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.api_core.exceptions import GoogleAPIError

from schemas.admin_schemas import AdminInitRequest
from services.channel_initializer import run_channel_initialization
from utils.admin_auth import require_admin_key


def init_admin_init_channel_route(app, db):
    bp = APIBlueprint("admin_init_channel", __name__, tag="Admin")

    @bp.route("/api/admin/initialize_channel", methods=["POST"])
    @bp.doc(
        summary="管理員初始化頻道",
        description="由管理員授權執行頻道初始化流程",
        security="BearerAuth",
    )
    @require_admin_key
    @bp.input(AdminInitRequest, arg_name="body")
    def initialize_channel_by_admin(body):
        try:
            logging.info(f"🛠️ 管理員授權初始化頻道：{body.target_channel_id}")
            run_channel_initialization(db, body.target_channel_id)
            logging.info(f"✅ 管理員初始化完成：{body.target_channel_id}")

            return jsonify(
                {
                    "success": True,
                    "channel_id": body.target_channel_id,
                    "message": "初始化完成（由管理員執行）",
                }
            ), 200

        except GoogleAPIError:
            logging.exception("🔥 Firestore 操作失敗")
            return jsonify({"success": False, "error": "Firestore 操作失敗"}), 500

        except Exception:
            logging.exception("🔥 初始化過程發生未知錯誤")
            return jsonify({"success": False, "error": "伺服器內部錯誤"}), 500

    app.register_blueprint(bp)
