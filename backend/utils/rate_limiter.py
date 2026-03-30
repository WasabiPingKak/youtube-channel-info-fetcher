# utils/rate_limiter.py
# 全域 Rate Limiter 設定
# storage_uri 透過 app.config["RATELIMIT_STORAGE_URI"] 在 create_app() 中設定

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
)
