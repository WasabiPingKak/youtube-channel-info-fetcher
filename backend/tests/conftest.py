"""
共用 fixtures：Flask test app、mock Firestore db、JWT 環境變數
"""

import os

import pytest

# ── 在任何 backend 模組被 import 之前，先設定必要的環境變數 ──
os.environ["JWT_SECRET"] = "test-secret-key-for-unit-tests"
os.environ["ADMIN_CHANNEL_IDS"] = "UC_ADMIN_001,UC_ADMIN_002"
os.environ["ECPAY_MERCHANT_ID"] = "TestMerchantID"
os.environ["ECPAY_HASH_KEY"] = "TestHashKey1234A"  # 必須 16 bytes（AES-128）
os.environ["ECPAY_HASH_IV"] = "TestHashIV12345A"  # 必須 16 bytes


@pytest.fixture
def mock_db():
    """回傳一個可控制行為的 mock Firestore client"""
    from unittest.mock import MagicMock

    return MagicMock()


@pytest.fixture
def app(mock_db):
    """建立最小化的 Flask test app，只掛需要測的路由"""
    from flask import Flask

    from routes.me_route import init_me_route
    from routes.oauth_callback_route import init_oauth_callback_route
    from routes.oauth_state_route import init_oauth_state_route
    from utils.rate_limiter import limiter

    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    app.config["FRONTEND_BASE_URL"] = "http://localhost:5173"

    limiter.init_app(app)
    init_oauth_callback_route(app, mock_db)
    init_oauth_state_route(app, mock_db)
    init_me_route(app, mock_db)

    return app


@pytest.fixture
def client(app):
    """Flask test client"""
    return app.test_client()
