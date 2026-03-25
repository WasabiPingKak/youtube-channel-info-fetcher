from functools import wraps
from flask import request, jsonify
from utils.jwt_util import verify_jwt
import logging


def require_auth(f):
    """JWT 認證 decorator，驗證通過後將 auth_channel_id 注入 kwargs"""
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

        kwargs["auth_channel_id"] = channel_id
        return f(*args, **kwargs)
    return decorated
