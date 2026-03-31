"""services/youtube/fetcher.py 的單元測試"""

from unittest.mock import MagicMock, patch

import pytest

from services.youtube.fetcher import get_video_data


class TestGetVideoData:
    @patch.dict("os.environ", {"API_KEY": ""}, clear=False)
    def test_raises_when_no_api_key(self):
        with pytest.raises(OSError, match="API_KEY"):
            get_video_data(input_channel="UC_test")

    @patch.dict("os.environ", {"API_KEY": "test-key"}, clear=False)
    def test_raises_when_no_channel(self):
        with pytest.raises(OSError, match="INPUT_CHANNEL"):
            get_video_data()

    @patch("services.youtube.fetcher.get_youtube_service", return_value=None)
    @patch.dict("os.environ", {"API_KEY": "test-key"}, clear=False)
    def test_returns_empty_when_no_youtube_service(self, _mock_svc):
        result = get_video_data(input_channel="UC_test")
        assert result == []

    @patch("services.youtube.fetcher.get_channel_id", return_value=None)
    @patch("services.youtube.fetcher.get_youtube_service", return_value=MagicMock())
    @patch.dict("os.environ", {"API_KEY": "test-key"}, clear=False)
    def test_returns_empty_when_no_channel_id(self, _svc, _cid):
        result = get_video_data(input_channel="@SomeChannel")
        assert result == []

    @patch("services.youtube.fetcher.get_video_ids_from_playlist", return_value=[])
    @patch("services.youtube.fetcher.get_uploads_playlist_id", return_value="UU_test")
    @patch("services.youtube.fetcher.get_channel_id", return_value="UC_test")
    @patch("services.youtube.fetcher.get_youtube_service", return_value=MagicMock())
    @patch.dict("os.environ", {"API_KEY": "test-key"}, clear=False)
    def test_returns_empty_when_no_videos(self, _svc, _cid, _pid, _vids):
        result = get_video_data(input_channel="UC_test")
        assert result == []

    @patch("services.youtube.fetcher.get_video_type", return_value="直播")
    @patch(
        "services.youtube.fetcher.fetch_video_details",
        return_value=[
            {
                "id": "vid1",
                "snippet": {"publishedAt": "2025-06-01T12:00:00Z"},
                "contentDetails": {"duration": "PT1H"},
            }
        ],
    )
    @patch("services.youtube.fetcher.get_video_ids_from_playlist", return_value=["vid1"])
    @patch("services.youtube.fetcher.get_uploads_playlist_id", return_value="UU_test")
    @patch("services.youtube.fetcher.get_channel_id", return_value="UC_test")
    @patch("services.youtube.fetcher.get_youtube_service", return_value=MagicMock())
    @patch.dict("os.environ", {"API_KEY": "test-key"}, clear=False)
    def test_returns_videos_without_date_filter(self, _svc, _cid, _pid, _vids, _details, _type):
        result = get_video_data(input_channel="UC_test")
        assert len(result) == 1
        assert result[0]["id"] == "vid1"

    @patch("services.youtube.fetcher.get_video_type", return_value=None)
    @patch(
        "services.youtube.fetcher.fetch_video_details",
        return_value=[
            {
                "id": "vid1",
                "snippet": {"publishedAt": "2025-06-01T12:00:00Z"},
            }
        ],
    )
    @patch("services.youtube.fetcher.get_video_ids_from_playlist", return_value=["vid1"])
    @patch("services.youtube.fetcher.get_uploads_playlist_id", return_value="UU_test")
    @patch("services.youtube.fetcher.get_channel_id", return_value="UC_test")
    @patch("services.youtube.fetcher.get_youtube_service", return_value=MagicMock())
    @patch.dict("os.environ", {"API_KEY": "test-key"}, clear=False)
    def test_skips_videos_without_type(self, _svc, _cid, _pid, _vids, _details, _type):
        result = get_video_data(input_channel="UC_test")
        assert result == []
