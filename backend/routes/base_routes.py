from flask import Blueprint

base_bp = Blueprint("base", __name__)

def init_base_routes(app):

    @base_bp.route("/")
    def index():
        return "✅ YouTube API Service with Firestore Cache is running."

    app.register_blueprint(base_bp)
