import logging

from apiflask import APIBlueprint
from flask import jsonify, make_response, request
from google.cloud import firestore

from utils.jwt_util import (
    JWT_EXP_HOURS,
    generate_jwt,
    is_admin_channel_id,
    should_renew,
    verify_jwt,
)
from utils.rate_limiter import limiter


def init_me_route(app, db: firestore.Client):
    me_bp = APIBlueprint("me", __name__, url_prefix="/api", tag="Auth")

    @me_bp.route("/me", methods=["GET"])
    @me_bp.doc(summary="取得目前登入資訊", description="回傳目前登入使用者的頻道 ID、名稱、頭像")
    @limiter.limit("30 per minute")
    def get_me():
        token = request.cookies.get("__session")
        if not token:
            logging.info("🔓 /api/me：匿名訪問")
            return (
                jsonify(
                    {
                        "success": True,
                        "channelId": None,
                        "isAdmin": False,
                    }
                ),
                200,
            )

        decoded = verify_jwt(token)
        if not decoded:
            logging.warning("🔒 /api/me：JWT 驗證失敗，非法 token")
            return jsonify({"error": "Invalid token"}), 403

        channel_id: str = decoded.get("channelId", "")
        is_admin = is_admin_channel_id(channel_id)

        # ✅ 撤銷檢查：revoked_at 晚於 token 簽發時間 → token 已作廢
        meta_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("channel_info")
            .document("meta")
        )
        meta = meta_ref.get().to_dict() or {}
        revoked_at = meta.get("revoked_at")
        iat = decoded.get("iat", 0)
        if revoked_at and revoked_at.timestamp() > iat:
            logging.warning(f"🔒 /api/me：token 已被撤銷，channel_id = {channel_id}")
            return jsonify({"error": "Token revoked"}), 403

        logging.info(f"✅ /api/me：驗證成功，channel_id = {channel_id}, isAdmin = {is_admin}")

        # Firestore 讀取使用者名稱與頭像
        doc_ref = db.collection("channel_index").document(channel_id)
        doc = doc_ref.get()

        if not doc.exists:  # type: ignore[reportAttributeAccessIssue]
            logging.error(f"❌ Firestore 找不到頻道：{channel_id}")
            response_data = {
                "success": True,
                "channelId": channel_id,
                "isAdmin": is_admin,
                "name": None,
                "thumbnail": None,
            }
        else:
            data = doc.to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
            response_data = {
                "success": True,
                "channelId": channel_id,
                "isAdmin": is_admin,
                "name": data.get("name"),
                "thumbnail": data.get("thumbnail"),
            }

        response = make_response(jsonify(response_data), 200)

        # ✅ 滑動續期：JWT 即將過期時自動簽發新 token
        if should_renew(decoded):
            new_token = generate_jwt(channel_id)
            response.set_cookie(
                "__session",
                new_token,
                max_age=60 * 60 * JWT_EXP_HOURS,
                path="/",
                httponly=True,
                secure=True,
                samesite="Lax",
            )
            logging.info(f"🔄 /api/me：JWT 即將過期，已自動續期，channel_id = {channel_id}")

        return response

    app.register_blueprint(me_bp)
