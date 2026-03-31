"""
共用 fixtures：Flask test app、mock Firestore db

測試用環境變數統一定義在 pyproject.toml [tool.pytest.ini_options] env，
由 pytest-env 自動注入，不再硬編碼於此。
"""

import pytest
from apiflask import APIFlask

from utils.rate_limiter import limiter


def create_test_app(**extra_config):
    """建立路由測試用的 APIFlask app（含 TESTING + rate limiter）

    可傳入額外 config，例如 FRONTEND_BASE_URL。
    各測試檔在自己的 fixture 中呼叫此函式後再註冊所需路由。
    """
    app = APIFlask(__name__)
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    for key, value in extra_config.items():
        app.config[key] = value
    limiter.init_app(app)
    return app


@pytest.fixture(autouse=True)
def _clear_revoke_cache():
    """每個測試前清空撤銷快取，避免跨測試污染"""
    from utils.auth_decorator import _revoke_cache

    _revoke_cache.clear()


@pytest.fixture
def mock_db():
    """回傳一個可控制行為的 mock Firestore client"""
    from unittest.mock import MagicMock

    return MagicMock()


@pytest.fixture
def app(mock_db):
    """建立最小化的 APIFlask test app，只掛需要測的路由"""
    from routes.me_route import init_me_route
    from routes.oauth_callback_route import init_oauth_callback_route
    from routes.oauth_state_route import init_oauth_state_route

    app = create_test_app(FRONTEND_BASE_URL="http://localhost:5173")
    init_oauth_callback_route(app, mock_db)
    init_oauth_state_route(app, mock_db)
    init_me_route(app, mock_db)

    return app


@pytest.fixture
def client(app):
    """Flask test client"""
    return app.test_client()
