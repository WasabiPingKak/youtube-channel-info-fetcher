# routes/maintenance_route.py
from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
from utils.live_cache_cleaner import run_live_cache_cleaner
import os
import logging

maintenance_bp = Blueprint("maintenance", __name__)

def init_maintenance_route(app, db: Client):
    app.register_blueprint(maintenance_bp, url_prefix="/api")

@maintenance_bp.route("/maintenance/clean-live-cache", methods=["POST"])
def clean_live_cache():
    # 驗證 Bearer Token
    auth_header = request.headers.get("Authorization", "")
    token_prefix = "Bearer "
    expected_token = os.getenv("ADMIN_API_KEY")

    if not auth_header.startswith(token_prefix) or auth_header[len(token_prefix):] != expected_token:
        logging.warning("🚫 嘗試未授權存取 clean-live-cache API")
        return jsonify({"error": "Unauthorized"}), 401

    try:
        payload = request.get_json(force=True)
        mode = payload.get("mode")
        if mode not in ["dry-run", "execute"]:
            return jsonify({"error": "mode 無效，請使用 'dry-run' 或 'execute'。"}), 400

        logging.info(f"🧹 開始執行 clean-live-cache，模式：{mode}")
        result = run_live_cache_cleaner(mode)
        return jsonify(result)

    except Exception as e:
        logging.exception("❌ 清除快取失敗，發生未預期錯誤")
        return jsonify({"error": "Internal server error"}), 500
