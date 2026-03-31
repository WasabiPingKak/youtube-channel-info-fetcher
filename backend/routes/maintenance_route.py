# routes/maintenance_route.py
import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud.firestore import Client

from schemas.admin_schemas import MaintenanceRequest
from utils.admin_auth import require_admin_key
from utils.date_based_cache_cleaner import clean_all_expired_documents

maintenance_bp = APIBlueprint("maintenance", __name__, tag="Admin")


def init_maintenance_route(app, db: Client):
    @maintenance_bp.route("/maintenance/clean-live-cache", methods=["POST"])
    @maintenance_bp.doc(
        summary="清除直播快取",
        description="清除過期的直播導向快取資料",
        security="BearerAuth",
    )
    @require_admin_key
    @maintenance_bp.input(MaintenanceRequest, arg_name="body")
    def clean_live_cache(body):
        logging.info(f"🧹 開始清除 live 快取資料，模式：{body.mode.value}")
        full_result = clean_all_expired_documents(db, body.mode.value, cache_type="live")
        result = {
            k: v
            for k, v in full_result.items()
            if k in ["live_redirect_notify_queue", "live_redirect_cache"]
        }
        return jsonify(result)

    @maintenance_bp.route("/maintenance/clean-trending-games-cache", methods=["POST"])
    @maintenance_bp.doc(
        summary="清除趨勢遊戲快取",
        description="清除過期的趨勢遊戲統計快取",
        security="BearerAuth",
    )
    @require_admin_key
    @maintenance_bp.input(MaintenanceRequest, arg_name="body")
    def clean_trending_games_cache(body):
        logging.info(f"🧹 開始清除 trending games 快取，模式：{body.mode.value}")
        result = clean_all_expired_documents(db, body.mode.value, cache_type="trending_games")
        return jsonify(result)

    app.register_blueprint(maintenance_bp, url_prefix="/api")
