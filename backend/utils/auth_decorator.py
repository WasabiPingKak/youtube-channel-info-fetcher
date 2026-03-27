import logging
from functools import wraps

from flask import jsonify, request

from utils.jwt_util import verify_jwt


def require_auth(db):
    """
    JWT 認證 decorator factory。
    驗證 JWT 簽名 + Firestore revoked_at 撤銷檢查，
    通過後將 auth_channel_id 注入 kwargs。

    用法：@require_auth(db)
    """

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.cookies.get("__session")
            if not token:
                logging.warning("🔒 未提供 __session JWT")
                return jsonify({"error": "未登入或權限不足"}), 401

            decoded = verify_jwt(token)
            if not decoded:
                logging.warning("🔒 JWT 驗證失敗")
                return jsonify({"error": "無效的 token"}), 403

            channel_id = decoded.get("channelId")
            if not channel_id:
                logging.warning("🔒 JWT 中缺少 channelId")
                return jsonify({"error": "無效的使用者身份"}), 403

            # 撤銷檢查：revoked_at 晚於 token 簽發時間 → token 已作廢
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
                logging.warning(f"🔒 token 已被撤銷，channel_id = {channel_id}")
                return jsonify({"error": "Token revoked"}), 403

            kwargs["auth_channel_id"] = channel_id
            return f(*args, **kwargs)

        return decorated

    return decorator
