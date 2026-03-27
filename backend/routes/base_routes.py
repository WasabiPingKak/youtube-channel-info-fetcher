from flask import Blueprint, Response

base_bp = Blueprint("base", __name__)


def init_base_routes(app):
    @base_bp.route("/")
    def index():
        return "✅ YouTube API Service with Firestore Cache is running."

    @base_bp.route("/version")
    def version():
        try:
            with open("version.txt", encoding="utf-8") as f:
                commit = f.read().strip()
                return Response(commit, mimetype="text/plain")
        except Exception:
            return Response("unknown", mimetype="text/plain")

    app.register_blueprint(base_bp)
