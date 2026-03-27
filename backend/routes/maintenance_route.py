# routes/maintenance_route.py
import logging

from flask import Blueprint, jsonify, request
from google.cloud.firestore import Client

from utils.admin_auth import require_admin_key
from utils.date_based_cache_cleaner import clean_all_expired_documents

maintenance_bp = Blueprint("maintenance", __name__)


def init_maintenance_route(app, db: Client):
    @maintenance_bp.route("/maintenance/clean-live-cache", methods=["POST"])
    @require_admin_key
    def clean_live_cache():
        try:
            payload = request.get_json(force=True)
            mode = payload.get("mode")
            if mode not in ["dry-run", "execute"]:
                return jsonify({"error": "mode 無效，請使用 'dry-run' 或 'execute'。"}), 400

            logging.info(f"🧹 開始清除 live 快取資料，模式：{mode}")
            full_result = clean_all_expired_documents(db, mode, cache_type="live")
            result = {
                k: v
                for k, v in full_result.items()
                if k in ["live_redirect_notify_queue", "live_redirect_cache"]
            }
            return jsonify(result)

        except Exception:
            logging.exception("❌ 清除 live 快取失敗")
            return jsonify({"error": "Internal server error"}), 500

    @maintenance_bp.route("/maintenance/clean-trending-games-cache", methods=["POST"])
    @require_admin_key
    def clean_trending_games_cache():
        try:
            payload = request.get_json(force=True)
            mode = payload.get("mode")
            if mode not in ["dry-run", "execute"]:
                return jsonify({"error": "mode 無效，請使用 'dry-run' 或 'execute'。"}), 400

            logging.info(f"🧹 開始清除 trending games 快取，模式：{mode}")
            result = clean_all_expired_documents(db, mode, cache_type="trending_games")
            return jsonify(result)

        except Exception:
            logging.exception("❌ 清除 trending games 快取失敗")
            return jsonify({"error": "Internal server error"}), 500

    app.register_blueprint(maintenance_bp, url_prefix="/api")
