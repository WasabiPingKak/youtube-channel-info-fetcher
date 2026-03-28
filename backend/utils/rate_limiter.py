# utils/rate_limiter.py
# 全域 Rate Limiter 設定

import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URL", "memory://"),
)
