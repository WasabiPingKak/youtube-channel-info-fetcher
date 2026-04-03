import logging
from functools import wraps

from cachetools import TTLCache
from flask import jsonify, request
from google.cloud import firestore

from utils.jwt_util import verify_jwt

# 撤銷狀態快取：最多 256 個 channel，TTL 60 秒
_revoke_cache: TTLCache = TTLCache(maxsize=256, ttl=60)


def clear_revoke_cache(channel_id: str) -> None:
    """清除指定 channel 的撤銷快取，供撤銷 API 呼叫"""
    _revoke_cache.pop(channel_id, None)


def require_auth(db: firestore.Client):
    """
    JWT 認證 decorator factory。
    驗證 JWT 簽名 + Firestore revoked_at 撤銷檢查（帶 TTL 快取），
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

            # 撤銷檢查（帶 TTL 快取，減少 Firestore per-request 讀取）
            revoked_at = _revoke_cache.get(channel_id)
            if revoked_at is None:
                meta_ref = (
                    db.collection("channel_data")
                    .document(channel_id)
                    .collection("channel_info")
                    .document("meta")
                )
                meta = meta_ref.get().to_dict() or {}
                # 存入快取：無 revoked_at 時用 False 表示「已查過、未撤銷」
                revoked_at = meta.get("revoked_at") or False
                _revoke_cache[channel_id] = revoked_at

            iat = decoded.get("iat", 0)
            if revoked_at and revoked_at.timestamp() > iat:  # type: ignore[union-attr]
                logging.warning(f"🔒 token 已被撤銷，channel_id = {channel_id}")
                return jsonify({"error": "Token revoked"}), 403

            kwargs["auth_channel_id"] = channel_id
            return f(*args, **kwargs)

        return decorated

    return decorator
