import hmac
import logging
import os
from functools import wraps
from flask import request, jsonify


def require_admin_key(f):
    """驗證 Authorization: Bearer {ADMIN_API_KEY}，適用於 internal/admin 端點"""
    @wraps(f)
    def decorated(*args, **kwargs):
        expected = os.getenv("ADMIN_API_KEY")
        if not expected:
            logging.error("❌ 未設定 ADMIN_API_KEY，拒絕操作")
            return jsonify({"error": "Server misconfigured"}), 500

        auth_header = request.headers.get("Authorization", "")
        prefix = "Bearer "
        if not auth_header.startswith(prefix):
            logging.warning("🚫 缺少或格式錯誤的 Authorization header")
            return jsonify({"error": "Unauthorized"}), 401

        token = auth_header[len(prefix):]
        if not hmac.compare_digest(token, expected):
            logging.warning("🚫 Admin API Key 驗證失敗")
            return jsonify({"error": "Unauthorized"}), 401

        return f(*args, **kwargs)
    return decorated
