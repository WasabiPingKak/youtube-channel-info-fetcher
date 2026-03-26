from flask import Blueprint, request, jsonify
from google.api_core.exceptions import GoogleAPIError
from services.channel_initializer import run_channel_initialization
from utils.channel_validator import is_valid_channel_id
from utils.admin_auth import require_admin_key
import logging

def init_admin_init_channel_route(app, db):
    bp = Blueprint("admin_init_channel", __name__)

    @bp.route("/api/admin/initialize_channel", methods=["POST"])
    @require_admin_key
    def initialize_channel_by_admin():
        try:
            # 讀取要初始化的目標頻道 ID
            data = request.get_json()
            target_channel_id = data.get("target_channel_id")
            if not target_channel_id:
                return jsonify({"error": "Missing target_channel_id"}), 400
            if not is_valid_channel_id(target_channel_id):
                return jsonify({"error": "target_channel_id 格式不合法"}), 400

            logging.info(f"🛠️ 管理員授權初始化頻道：{target_channel_id}")
            run_channel_initialization(db, target_channel_id)
            logging.info(f"✅ 管理員初始化完成：{target_channel_id}")

            return jsonify({
                "success": True,
                "channel_id": target_channel_id,
                "message": "初始化完成（由管理員執行）"
            }), 200

        except GoogleAPIError:
            logging.exception("🔥 Firestore 操作失敗")
            return jsonify({"success": False, "error": "Firestore 操作失敗"}), 500

        except Exception:
            logging.exception("🔥 初始化過程發生未知錯誤")
            return jsonify({"success": False, "error": "伺服器內部錯誤"}), 500

    app.register_blueprint(bp)
