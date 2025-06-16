from flask import Blueprint, request, jsonify
from google.api_core.exceptions import GoogleAPIError
from services.channel_initializer import run_channel_initialization
import logging
import os

def init_admin_init_channel_route(app, db):
    bp = Blueprint("admin_init_channel", __name__)

    @bp.route("/api/admin/initialize_channel", methods=["POST"])
    def initialize_channel_by_admin():
        try:
            # 驗證 Bearer Token 是否為管理員金鑰
            admin_key_expected = os.getenv("ADMIN_API_KEY")
            if not admin_key_expected:
                logging.error("❌ 未設定 ADMIN_API_KEY，拒絕操作")
                return jsonify({"error": "Server misconfigured"}), 500

            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                logging.warning("❌ Authorization 格式錯誤")
                return jsonify({"error": "Invalid authorization format"}), 401

            token = auth_header.split(" ", 1)[1]
            if token != admin_key_expected:
                logging.warning("❌ 管理員密鑰錯誤")
                return jsonify({"error": "Unauthorized"}), 401

            # 讀取要初始化的目標頻道 ID
            data = request.get_json()
            target_channel_id = data.get("target_channel_id")
            if not target_channel_id:
                return jsonify({"error": "Missing target_channel_id"}), 400

            logging.info(f"🛠️ 管理員授權初始化頻道：{target_channel_id}")
            run_channel_initialization(target_channel_id)
            logging.info(f"✅ 管理員初始化完成：{target_channel_id}")

            return jsonify({
                "success": True,
                "channel_id": target_channel_id,
                "message": "初始化完成（由管理員執行）"
            }), 200

        except GoogleAPIError as e:
            logging.exception("🔥 Firestore 操作失敗")
            return jsonify({"success": False, "error": str(e)}), 500

        except Exception as e:
            logging.exception("🔥 初始化過程發生未知錯誤")
            return jsonify({"success": False, "error": str(e)}), 500

    app.register_blueprint(bp)
