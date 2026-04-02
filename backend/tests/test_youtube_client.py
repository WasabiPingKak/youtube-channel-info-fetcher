"""
youtube/client.py 測試：YouTube service 建立、channel ID 解析、uploads playlist
"""

from unittest.mock import ANY, MagicMock, patch

import googleapiclient.errors


class TestGetYoutubeService:
    @patch("services.youtube.client.googleapiclient.discovery.build")
    def test_returns_service(self, mock_build):
        from services.youtube.client import get_youtube_service

        mock_service = MagicMock()
        mock_build.return_value = mock_service

        result = get_youtube_service("test-key")

        assert result == mock_service
        mock_build.assert_called_once_with("youtube", "v3", developerKey="test-key", http=ANY)

    @patch("services.youtube.client.googleapiclient.discovery.build")
    def test_http_error_returns_none(self, mock_build):
        from services.youtube.client import get_youtube_service

        mock_build.side_effect = googleapiclient.errors.HttpError(
            resp=MagicMock(status=400), content=b"bad"
        )

        result = get_youtube_service("bad-key")
        assert result is None


class TestGetChannelId:
    def test_uc_prefix_returns_directly(self):
        from services.youtube.client import get_channel_id

        yt = MagicMock()
        result = get_channel_id(yt, "UCxxxx123")
        assert result == "UCxxxx123"
        # 不應呼叫 API
        yt.search.assert_not_called()

    @patch("services.youtube.client._execute_api_request")
    def test_handle_input_resolves(self, mock_exec):
        from services.youtube.client import get_channel_id

        mock_exec.return_value = {"items": [{"snippet": {"channelId": "UC_RESOLVED"}}]}
        yt = MagicMock()

        result = get_channel_id(yt, "@SomeHandle")
        assert result == "UC_RESOLVED"

    @patch("services.youtube.client._execute_api_request")
    def test_username_input_resolves(self, mock_exec):
        from services.youtube.client import get_channel_id

        mock_exec.return_value = {"items": [{"snippet": {"channelId": "UC_USER"}}]}
        yt = MagicMock()

        result = get_channel_id(yt, "SomeUsername")
        assert result == "UC_USER"

    @patch("services.youtube.client._execute_api_request")
    def test_no_results_returns_none(self, mock_exec):
        from services.youtube.client import get_channel_id

        mock_exec.return_value = {"items": []}
        yt = MagicMock()

        result = get_channel_id(yt, "@Nobody")
        assert result is None

    @patch("services.youtube.client._execute_api_request")
    def test_http_error_returns_none(self, mock_exec):
        from services.youtube.client import get_channel_id

        mock_exec.side_effect = googleapiclient.errors.HttpError(
            resp=MagicMock(status=403), content=b"forbidden"
        )
        yt = MagicMock()

        result = get_channel_id(yt, "@SomeHandle")
        assert result is None

    @patch("services.youtube.client._execute_api_request")
    def test_unexpected_error_returns_none(self, mock_exec):
        from services.youtube.client import get_channel_id

        mock_exec.side_effect = RuntimeError("unexpected")
        yt = MagicMock()

        result = get_channel_id(yt, "@SomeHandle")
        assert result is None


class TestGetUploadsPlaylistId:
    @patch("services.youtube.client._execute_api_request")
    def test_returns_playlist_id(self, mock_exec):
        from services.youtube.client import get_uploads_playlist_id

        mock_exec.return_value = {
            "items": [{"contentDetails": {"relatedPlaylists": {"uploads": "UUxxxx123"}}}]
        }
        yt = MagicMock()

        result = get_uploads_playlist_id(yt, "UCxxxx123")
        assert result == "UUxxxx123"

    @patch("services.youtube.client._execute_api_request")
    def test_no_items_returns_none(self, mock_exec):
        from services.youtube.client import get_uploads_playlist_id

        mock_exec.return_value = {"items": []}
        yt = MagicMock()

        result = get_uploads_playlist_id(yt, "UC_GONE")
        assert result is None

    @patch("services.youtube.client._execute_api_request")
    def test_http_error_returns_none(self, mock_exec):
        from services.youtube.client import get_uploads_playlist_id

        mock_exec.side_effect = googleapiclient.errors.HttpError(
            resp=MagicMock(status=500), content=b"server error"
        )
        yt = MagicMock()

        result = get_uploads_playlist_id(yt, "UCxxxx")
        assert result is None
