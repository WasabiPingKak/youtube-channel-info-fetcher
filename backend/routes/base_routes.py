import logging

from apiflask import APIBlueprint
from flask import Response, jsonify

from utils.circuit_breaker import get_all_breaker_statuses
from utils.cloud_tasks_client import check_health as check_cloud_tasks_health

base_bp = APIBlueprint("base", __name__, tag="Base")
logger = logging.getLogger(__name__)


def init_base_routes(app, db=None):
    @base_bp.route("/")
    @base_bp.doc(summary="服務存活檢查", description="確認服務是否正常運行", hide=True)
    def index():
        return "✅ YouTube API Service with Firestore Cache is running."

    @base_bp.route("/healthz")
    @base_bp.doc(
        summary="深度健康檢查",
        description="確認 Firestore 與 Cloud Tasks 連線正常",
    )
    def healthz():
        checks = {}

        # --- Firestore ---
        if db is None:
            checks["firestore"] = {"healthy": False, "reason": "Firestore 未初始化"}
        else:
            try:
                db.collection("channel_index_batch").limit(1).get()
                checks["firestore"] = {"healthy": True}
            except Exception as e:
                logger.warning(f"Health check — Firestore 失敗：{e}")
                checks["firestore"] = {"healthy": False, "reason": "Firestore 連線異常"}

        # --- Cloud Tasks ---
        checks["cloud_tasks"] = check_cloud_tasks_health()

        # --- Circuit Breakers（資訊性質，不影響 healthy 判定）---
        checks["circuit_breakers"] = get_all_breaker_statuses()

        # 彙整結果（circuit_breakers 不參與 healthy 判定）
        health_checks = {k: v for k, v in checks.items() if k != "circuit_breakers"}
        all_healthy = all(c.get("healthy") for c in health_checks.values())
        status_code = 200 if all_healthy else 503
        return jsonify(
            {
                "status": "healthy" if all_healthy else "unhealthy",
                "checks": checks,
            }
        ), status_code

    @base_bp.route("/version")
    @base_bp.doc(summary="取得版本資訊", description="回傳目前部署的 commit hash")
    def version():
        try:
            with open("version.txt", encoding="utf-8") as f:
                commit = f.read().strip()
                return Response(commit, mimetype="text/plain")
        except Exception:
            return Response("unknown", mimetype="text/plain")

    app.register_blueprint(base_bp)
