import logging
import os
from datetime import UTC, datetime, timedelta

import jwt

# ✅ 僅在本地開發時讀取 .env.local（Cloud Run 不需要這一段）
if os.getenv("ENV") != "production":
    from pathlib import Path

    from dotenv import load_dotenv

    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(dotenv_path=env_path)

from utils.admin_ids import get_admin_channel_ids

JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = 2
JWT_RENEW_THRESHOLD_SECONDS = 30 * 60  # 剩不到 30 分鐘就續期


def get_jwt_secret() -> str:
    """從環境變數取得 JWT_SECRET，未設定時拋出 ValueError"""
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError(
            "❌ JWT_SECRET 未正確載入，請確認 `.env.local` 存在或已設定 Cloud Run 環境變數"
        )
    return secret


def is_admin_channel_id(channel_id: str) -> bool:
    """
    判斷此 channelId 是否為 admin（Route A：allowlist）
    """
    if not channel_id:
        return False
    return channel_id in get_admin_channel_ids()


def generate_jwt(channel_id: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "channelId": channel_id,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXP_HOURS),
    }
    token = jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    logging.info(f"[JWT] 簽發 token，channel_id = {channel_id}")
    return token


def should_renew(decoded: dict) -> bool:
    """檢查 JWT 是否即將過期，需要續期"""
    exp = decoded.get("exp", 0)
    now = datetime.now(UTC).timestamp()
    return (exp - now) < JWT_RENEW_THRESHOLD_SECONDS


def verify_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logging.warning("❌ JWT token 已過期")
    except jwt.InvalidTokenError as e:
        logging.warning(f"❌ 無效 JWT token: {e}")
    return None
