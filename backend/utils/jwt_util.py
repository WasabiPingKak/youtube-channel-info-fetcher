import os
import jwt
import logging
from datetime import datetime, timedelta, timezone

# ✅ 僅在本地開發時讀取 .env.local（Cloud Run 不需要這一段）
if os.getenv("ENV") != "production":
    from dotenv import load_dotenv
    from pathlib import Path

    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    print("🔍 env_path =", env_path)
    load_dotenv(dotenv_path=env_path)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXP_DAYS = 30

if not JWT_SECRET:
    raise ValueError("❌ JWT_SECRET 未正確載入，請確認 `.env.local` 存在或已設定 Cloud Run 環境變數")

def generate_jwt(channel_id: str) -> str:
    payload = {
        "channelId": channel_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    logging.info(f"[JWT] 登入 token for channel {channel_id}: {token}")
    return token

def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logging.warning("JWT token has expired")
    except jwt.InvalidTokenError:
        logging.warning("Invalid JWT token")
    return None
