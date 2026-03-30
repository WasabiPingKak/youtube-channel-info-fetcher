"""
live_redirect/youtube_api 測試：batch_fetch_video_details
"""

from unittest.mock import MagicMock, patch

from services.live_redirect.youtube_api import batch_fetch_video_details


class TestBatchFetchVideoDetails:
    """batch_fetch_video_details：YouTube Videos API 批次查詢"""

    @patch("services.live_redirect.youtube_api._get_api_key", return_value="test-key")
    @patch("services.live_redirect.youtube_api.requests.get")
    def test_success_returns_items(self, mock_get, _mock_key):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": [{"id": "vid1"}, {"id": "vid2"}]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = batch_fetch_video_details(["vid1", "vid2"])
        assert len(result) == 2
        assert result[0]["id"] == "vid1"

    @patch("services.live_redirect.youtube_api._get_api_key", return_value="test-key")
    @patch("services.live_redirect.youtube_api.requests.get")
    def test_get_has_timeout(self, mock_get, _mock_key):
        """確認 YouTube API 請求帶有 timeout，避免無限等待"""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": []}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        batch_fetch_video_details(["vid1"])

        assert mock_get.call_args[1]["timeout"] == 10

    @patch("services.live_redirect.youtube_api._get_api_key", return_value="")
    def test_no_api_key_returns_empty(self, _mock_key):
        """API_KEY 未設定時應回傳空列表"""
        result = batch_fetch_video_details(["vid1"])
        assert result == []

    @patch("services.live_redirect.youtube_api._get_api_key", return_value="test-key")
    @patch("services.live_redirect.youtube_api.requests.get")
    def test_request_error_returns_partial(self, mock_get, _mock_key):
        """請求失敗時不中斷，回傳已取得的結果"""
        from requests.exceptions import RequestException

        mock_get.side_effect = RequestException("timeout")

        result = batch_fetch_video_details(["vid1"])
        assert result == []

    @patch("services.live_redirect.youtube_api._get_api_key", return_value="test-key")
    @patch("services.live_redirect.youtube_api.requests.get")
    def test_batches_over_50(self, mock_get, _mock_key):
        """超過 50 筆時應分批查詢"""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"items": [{"id": "v"}]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        video_ids = [f"vid{i}" for i in range(75)]
        batch_fetch_video_details(video_ids)

        assert mock_get.call_count == 2
