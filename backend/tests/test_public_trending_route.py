"""
Public trending route 測試：GET /api/trending-games
"""

import importlib
from unittest.mock import MagicMock, patch

import pytest
from conftest import create_test_app


@pytest.fixture(scope="module")
def shared_mock_db():
    return MagicMock()


@pytest.fixture(scope="module")
def trending_app(shared_mock_db):
    import routes.public_trending_route as mod

    importlib.reload(mod)

    app = create_test_app()
    mod.init_public_trending_route(app, shared_mock_db)
    return app


@pytest.fixture
def client(trending_app):
    return trending_app.test_client()


class TestTrendingGames:
    """GET /api/trending-games"""

    @patch("routes.public_trending_route.get_trending_games_summary")
    def test_default_30_days(self, mock_summary, client):
        mock_summary.return_value = {"games": [], "days": 30}
        resp = client.get("/api/trending-games")
        assert resp.status_code == 200
        mock_summary.assert_called_once()
        assert mock_summary.call_args[0][1] == 30

    @patch("routes.public_trending_route.get_trending_games_summary")
    def test_valid_days_7(self, mock_summary, client):
        mock_summary.return_value = {"games": [], "days": 7}
        resp = client.get("/api/trending-games?days=7")
        assert resp.status_code == 200
        assert mock_summary.call_args[0][1] == 7

    @patch("routes.public_trending_route.get_trending_games_summary")
    def test_valid_days_14(self, mock_summary, client):
        mock_summary.return_value = {"games": [], "days": 14}
        resp = client.get("/api/trending-games?days=14")
        assert resp.status_code == 200
        assert mock_summary.call_args[0][1] == 14

    @patch("routes.public_trending_route.get_trending_games_summary")
    def test_invalid_days_falls_back_to_30(self, mock_summary, client):
        """不合法的 days 值（如 5）應 fallback 到 30"""
        mock_summary.return_value = {"games": [], "days": 30}
        resp = client.get("/api/trending-games?days=5")
        assert resp.status_code == 200
        assert mock_summary.call_args[0][1] == 30

    def test_non_numeric_days_returns_422(self, client):
        """非數字 days 應回傳 422 驗證錯誤"""
        resp = client.get("/api/trending-games?days=abc")
        assert resp.status_code == 422

    @patch("routes.public_trending_route.get_trending_games_summary")
    def test_service_error_returns_500(self, mock_summary, client):
        mock_summary.return_value = {"error": "資料不存在"}
        resp = client.get("/api/trending-games")
        assert resp.status_code == 500

    @patch("routes.public_trending_route.get_trending_games_summary")
    def test_unexpected_exception_returns_500(self, mock_summary, client):
        mock_summary.side_effect = Exception("DB down")
        resp = client.get("/api/trending-games")
        assert resp.status_code == 500
        assert resp.get_json()["error"] == "伺服器內部錯誤"
