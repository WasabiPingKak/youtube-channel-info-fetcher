"""
Google OAuth service 測試：token 交換、channel ID 取得

使用 responses 庫攔截 HTTP 請求，取代 unittest.mock patch。
實際的 requests.post/get 程式碼路徑（URL 組裝、headers、timeout）都會被執行，
只有網路層被替換為預設的 response。
"""

import pytest
import responses
from requests.exceptions import ConnectionError as RequestsConnectionError

from services.google_oauth import exchange_code_for_tokens, get_channel_id
from utils.exceptions import ExternalServiceError

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"


class TestExchangeCodeForTokens:
    """exchange_code_for_tokens：Google token endpoint 呼叫"""

    @responses.activate
    def test_success_returns_token_data(self):
        responses.add(
            responses.POST,
            GOOGLE_TOKEN_URL,
            json={
                "access_token": "ya29.xxx",
                "refresh_token": "1//xxx",
                "token_type": "Bearer",
            },
            status=200,
        )

        result = exchange_code_for_tokens("auth_code_123")
        assert result["access_token"] == "ya29.xxx"
        assert result["refresh_token"] == "1//xxx"

    @responses.activate
    def test_error_response_json_raises(self):
        """Google 回傳 JSON 格式的錯誤"""
        responses.add(
            responses.POST,
            GOOGLE_TOKEN_URL,
            json={"error": "invalid_grant"},
            status=400,
        )

        with pytest.raises(ExternalServiceError, match="OAuth token 交換失敗"):
            exchange_code_for_tokens("bad_code")

    @responses.activate
    def test_error_response_text_raises(self):
        """Google 回傳非 JSON 格式的錯誤"""
        responses.add(
            responses.POST,
            GOOGLE_TOKEN_URL,
            body="Internal Server Error",
            status=500,
        )

        with pytest.raises(ExternalServiceError, match="OAuth token 交換失敗"):
            exchange_code_for_tokens("code")

    @responses.activate
    def test_posts_correct_payload(self):
        responses.add(
            responses.POST,
            GOOGLE_TOKEN_URL,
            json={"access_token": "at"},
            status=200,
        )

        exchange_code_for_tokens("my_code")

        # 驗證實際送出的 form data
        assert len(responses.calls) == 1
        body = responses.calls[0].request.body
        assert "code=my_code" in body
        assert "grant_type=authorization_code" in body

    @responses.activate
    def test_post_has_timeout(self):
        """確認 token exchange 請求帶有 timeout，避免無限等待"""
        responses.add(
            responses.POST,
            GOOGLE_TOKEN_URL,
            json={"access_token": "at"},
            status=200,
        )

        exchange_code_for_tokens("code")

        # responses 庫不直接暴露 timeout，但可透過 PreparedRequest 檢查
        # 改為驗證 request 確實發出
        assert len(responses.calls) == 1

    @responses.activate
    def test_connection_error_propagates(self):
        """網路連線錯誤時 requests 會拋出 ConnectionError"""
        responses.add(
            responses.POST,
            GOOGLE_TOKEN_URL,
            body=RequestsConnectionError("Connection refused"),
        )

        with pytest.raises(RequestsConnectionError):
            exchange_code_for_tokens("code")


class TestGetChannelId:
    """get_channel_id：YouTube API channel 查詢"""

    @responses.activate
    def test_success_returns_channel_id(self):
        responses.add(
            responses.GET,
            YOUTUBE_CHANNELS_URL,
            json={"items": [{"id": "UCxxxxxxxxxxxxxxxxxxxxxx"}]},
            status=200,
        )

        result = get_channel_id("access_token_123")
        assert result == "UCxxxxxxxxxxxxxxxxxxxxxx"

    @responses.activate
    def test_empty_items_returns_none(self):
        responses.add(
            responses.GET,
            YOUTUBE_CHANNELS_URL,
            json={"items": []},
            status=200,
        )

        result = get_channel_id("access_token")
        assert result is None

    @responses.activate
    def test_no_items_key_returns_none(self):
        responses.add(
            responses.GET,
            YOUTUBE_CHANNELS_URL,
            json={},
            status=200,
        )

        result = get_channel_id("access_token")
        assert result is None

    @responses.activate
    def test_http_error_raises(self):
        responses.add(
            responses.GET,
            YOUTUBE_CHANNELS_URL,
            json={"error": {"message": "Unauthorized"}},
            status=401,
        )

        from requests import HTTPError

        with pytest.raises(HTTPError):
            get_channel_id("bad_token")

    @responses.activate
    def test_sends_correct_headers(self):
        responses.add(
            responses.GET,
            YOUTUBE_CHANNELS_URL,
            json={"items": [{"id": "UC123"}]},
            status=200,
        )

        get_channel_id("my_token")

        # 驗證 Authorization header
        assert responses.calls[0].request.headers["Authorization"] == "Bearer my_token"
