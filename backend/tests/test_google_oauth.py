"""
Google OAuth service 測試：token 交換、channel ID 取得
"""

from unittest.mock import MagicMock, patch

import pytest
import requests

from services.google_oauth import exchange_code_for_tokens, get_channel_id


class TestExchangeCodeForTokens:
    """exchange_code_for_tokens：Google token endpoint 呼叫"""

    @patch("services.google_oauth.requests.post")
    def test_success_returns_token_data(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "access_token": "ya29.xxx",
            "refresh_token": "1//xxx",
            "token_type": "Bearer",
        }
        mock_post.return_value = mock_resp

        result = exchange_code_for_tokens("auth_code_123")
        assert result["access_token"] == "ya29.xxx"
        assert result["refresh_token"] == "1//xxx"

    @patch("services.google_oauth.requests.post")
    def test_error_response_json_raises(self, mock_post):
        """Google 回傳 JSON 格式的錯誤"""
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.json.return_value = {"error": "invalid_grant"}
        mock_post.return_value = mock_resp

        with pytest.raises(Exception, match="400"):
            exchange_code_for_tokens("bad_code")

    @patch("services.google_oauth.requests.post")
    def test_error_response_text_raises(self, mock_post):
        """Google 回傳非 JSON 格式的錯誤"""
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.json.side_effect = ValueError("No JSON")
        mock_resp.text = "Internal Server Error"
        mock_post.return_value = mock_resp

        with pytest.raises(Exception, match="500"):
            exchange_code_for_tokens("code")

    @patch("services.google_oauth.requests.post")
    def test_posts_correct_payload(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"access_token": "at"}
        mock_post.return_value = mock_resp

        exchange_code_for_tokens("my_code")

        # 確認有呼叫 post 且包含 code
        mock_post.assert_called_once()
        actual_data = mock_post.call_args[1].get(
            "data", mock_post.call_args[0][1] if len(mock_post.call_args[0]) > 1 else {}
        )
        assert actual_data["code"] == "my_code"
        assert actual_data["grant_type"] == "authorization_code"

    @patch("services.google_oauth.requests.post")
    def test_post_has_timeout(self, mock_post):
        """確認 token exchange 請求帶有 timeout，避免無限等待"""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"access_token": "at"}
        mock_post.return_value = mock_resp

        exchange_code_for_tokens("code")

        assert mock_post.call_args[1]["timeout"] == 10


class TestGetChannelId:
    """get_channel_id：YouTube API channel 查詢"""

    @patch("services.google_oauth.requests.get")
    def test_success_returns_channel_id(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": [{"id": "UCxxxxxxxxxxxxxxxxxxxxxx"}]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = get_channel_id("access_token_123")
        assert result == "UCxxxxxxxxxxxxxxxxxxxxxx"

    @patch("services.google_oauth.requests.get")
    def test_empty_items_returns_none(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": []}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = get_channel_id("access_token")
        assert result is None

    @patch("services.google_oauth.requests.get")
    def test_no_items_key_returns_none(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = get_channel_id("access_token")
        assert result is None

    @patch("services.google_oauth.requests.get")
    def test_http_error_raises(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = requests.HTTPError("401 Unauthorized")
        mock_get.return_value = mock_resp

        with pytest.raises(requests.HTTPError):
            get_channel_id("bad_token")

    @patch("services.google_oauth.requests.get")
    def test_sends_correct_headers(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": [{"id": "UC123"}]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        get_channel_id("my_token")

        headers = mock_get.call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer my_token"

    @patch("services.google_oauth.requests.get")
    def test_get_has_timeout(self, mock_get):
        """確認 channel ID 查詢請求帶有 timeout，避免無限等待"""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": [{"id": "UC123"}]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        get_channel_id("token")

        assert mock_get.call_args[1]["timeout"] == 10
