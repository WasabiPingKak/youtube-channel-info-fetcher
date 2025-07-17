# routes/maintenance_route.py
from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
from utils.date_based_cache_cleaner import clean_all_expired_documents
import os
import logging

maintenance_bp = Blueprint("maintenance", __name__)

def init_maintenance_route(app, db: Client):
    app.register_blueprint(maintenance_bp, url_prefix="/api")

def is_authorized(request) -> bool:
    token_prefix = "Bearer "
    expected_token = os.getenv("ADMIN_API_KEY")
    auth_header = request.headers.get("Authorization", "")
    return auth_header.startswith(token_prefix) and auth_header[len(token_prefix):] == expected_token

@maintenance_bp.route("/maintenance/clean-live-cache", methods=["POST"])
def clean_live_cache():
    if not is_authorized(request):
        logging.warning("🚫 嘗試未授權存取 clean-live-cache API")
        return jsonify({"error": "Unauthorized"}), 401

    try:
        payload = request.get_json(force=True)
        mode = payload.get("mode")
        if mode not in ["dry-run", "execute"]:
            return jsonify({"error": "mode 無效，請使用 'dry-run' 或 'execute'。"}), 400

        logging.info(f"🧹 開始清除 live 快取資料，模式：{mode}")
        full_result = clean_all_expired_documents(mode, cache_type="live")
        # 只取與 live cache 有關的部分
        result = {
            k: v for k, v in full_result.items()
            if k in ["live_redirect_notify_queue", "live_redirect_cache"]
        }
        return jsonify(result)

    except Exception as e:
        logging.exception("❌ 清除 live 快取失敗")
        return jsonify({"error": "Internal server error"}), 500

@maintenance_bp.route("/maintenance/clean-trending-games-cache", methods=["POST"])
def clean_trending_games_cache():
    if not is_authorized(request):
        logging.warning("🚫 嘗試未授權存取 clean-trending-games-cache API")
        return jsonify({"error": "Unauthorized"}), 401

    try:
        payload = request.get_json(force=True)
        mode = payload.get("mode")
        if mode not in ["dry-run", "execute"]:
            return jsonify({"error": "mode 無效，請使用 'dry-run' 或 'execute'。"}), 400

        logging.info(f"🧹 開始清除 trending games 快取，模式：{mode}")
        result = clean_all_expired_documents(mode, cache_type="trending_games")
        return jsonify(result)

    except Exception as e:
        logging.exception("❌ 清除 trending games 快取失敗")
        return jsonify({"error": "Internal server error"}), 500

