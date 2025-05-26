# routes/logout_route.py

from flask import Blueprint, make_response

def init_logout_route(app):
    logout_bp = Blueprint("logout", __name__, url_prefix="/api")

    @logout_bp.route("/logout", methods=["POST"])
    def logout():
        response = make_response("", 204)  # No Content
        response.set_cookie(
            "auth_token",
            "",
            max_age=0,            # ⏳ 立即過期
            path="/",
            httponly=True,
            secure=True,
            samesite="Lax"
        )
        return response

    app.register_blueprint(logout_bp)
