# routes/logout_route.py

from apiflask import APIBlueprint
from flask import make_response


def init_logout_route(app):
    logout_bp = APIBlueprint("logout", __name__, url_prefix="/api", tag="Auth")

    @logout_bp.route("/logout", methods=["POST"])
    @logout_bp.doc(summary="登出", description="清除登入 cookie 並登出")
    def logout():
        response = make_response("", 204)  # No Content
        response.set_cookie(
            "__session",
            "",
            max_age=0,  # ⏳ 立即過期
            path="/",
            httponly=True,
            secure=True,
            samesite="Lax",
        )
        return response

    app.register_blueprint(logout_bp)
