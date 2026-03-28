import logging

from flask import Blueprint, Response, jsonify

base_bp = Blueprint("base", __name__)
logger = logging.getLogger(__name__)


def init_base_routes(app, db=None):
    @base_bp.route("/")
    def index():
        return "✅ YouTube API Service with Firestore Cache is running."

    @base_bp.route("/healthz")
    def healthz():
        """深度健康檢查：確認 Firestore 連線正常"""
        if db is None:
            return jsonify({"status": "unhealthy", "reason": "Firestore 未初始化"}), 503

        try:
            # 嘗試讀取一筆 lightweight document 確認連線
            db.collection("channel_index_batch").limit(1).get()
            return jsonify({"status": "healthy"})
        except Exception as e:
            logger.warning(f"Health check 失敗：{e}")
            return jsonify({"status": "unhealthy", "reason": "Firestore 連線異常"}), 503

    @base_bp.route("/version")
    def version():
        try:
            with open("version.txt", encoding="utf-8") as f:
                commit = f.read().strip()
                return Response(commit, mimetype="text/plain")
        except Exception:
            return Response("unknown", mimetype="text/plain")

    app.register_blueprint(base_bp)
