import os
import jwt
import logging
from datetime import datetime, timedelta, timezone

# ✅ 僅在本地開發時讀取 .env.local（Cloud Run 不需要這一段）
if os.getenv("ENV") != "production":
    from dotenv import load_dotenv
    from pathlib import Path

    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    load_dotenv(dotenv_path=env_path)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = 30

# ✅ Admin allowlist（逗號分隔 channelId）
_ADMIN_CHANNEL_IDS_RAW = os.getenv("ADMIN_CHANNEL_IDS", "")
ADMIN_CHANNEL_IDS = {
    cid.strip() for cid in _ADMIN_CHANNEL_IDS_RAW.split(",") if cid.strip()
}

if not JWT_SECRET:
    raise ValueError(
        "❌ JWT_SECRET 未正確載入，請確認 `.env.local` 存在或已設定 Cloud Run 環境變數"
    )


def is_admin_channel_id(channel_id: str) -> bool:
    """
    判斷此 channelId 是否為 admin（Route A：allowlist）
    """
    if not channel_id:
        return False
    return channel_id in ADMIN_CHANNEL_IDS


def generate_jwt(channel_id: str) -> str:
    payload = {
        "channelId": channel_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    logging.info(f"[JWT] 登入成功，channel_id = {channel_id}")
    return token


def verify_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logging.warning("❌ JWT token 已過期")
    except jwt.InvalidTokenError as e:
        logging.warning(f"❌ 無效 JWT token: {e}")
    return None
