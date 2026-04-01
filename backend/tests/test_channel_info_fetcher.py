"""
channel_info_fetcher 測試：從 YouTube API 抓取頻道基本資訊
"""

import os
from unittest.mock import MagicMock, patch

import pytest
from googleapiclient.errors import HttpError


class TestFetchChannelBasicInfo:
    @patch.dict(os.environ, {"API_KEY": "test-key"})
    @patch("services.youtube.channel_info_fetcher.build")
    def test_returns_channel_info(self, mock_build):
        from services.youtube.channel_info_fetcher import fetch_channel_basic_info

        mock_yt = MagicMock()
        mock_build.return_value = mock_yt
        mock_yt.channels.return_value.list.return_value.execute.return_value = {
            "items": [
                {
                    "snippet": {
                        "title": "Test Channel",
                        "thumbnails": {
                            "high": {"url": "https://high.jpg"},
                            "default": {"url": "https://default.jpg"},
                        },
                    }
                }
            ]
        }

        result = fetch_channel_basic_info("UC001")

        assert result["channel_id"] == "UC001"
        assert result["name"] == "Test Channel"
        assert result["thumbnail"] == "https://high.jpg"

    @patch.dict(os.environ, {"API_KEY": "test-key"})
    @patch("services.youtube.channel_info_fetcher.build")
    def test_maxres_thumbnail_preferred(self, mock_build):
        from services.youtube.channel_info_fetcher import fetch_channel_basic_info

        mock_yt = MagicMock()
        mock_build.return_value = mock_yt
        mock_yt.channels.return_value.list.return_value.execute.return_value = {
            "items": [
                {
                    "snippet": {
                        "title": "Ch",
                        "thumbnails": {
                            "maxres": {"url": "https://maxres.jpg"},
                            "high": {"url": "https://high.jpg"},
                        },
                    }
                }
            ]
        }

        result = fetch_channel_basic_info("UC001")
        assert result["thumbnail"] == "https://maxres.jpg"

    @patch.dict(os.environ, {"API_KEY": "test-key"})
    @patch("services.youtube.channel_info_fetcher.build")
    def test_no_items_raises_value_error(self, mock_build):
        from services.youtube.channel_info_fetcher import fetch_channel_basic_info

        mock_yt = MagicMock()
        mock_build.return_value = mock_yt
        mock_yt.channels.return_value.list.return_value.execute.return_value = {"items": []}

        with pytest.raises(ValueError, match="找不到頻道"):
            fetch_channel_basic_info("UC_INVALID")

    @patch.dict(os.environ, {"API_KEY": "test-key"})
    @patch("services.youtube.channel_info_fetcher.build")
    def test_http_error_propagates(self, mock_build):
        from services.youtube.channel_info_fetcher import fetch_channel_basic_info

        mock_yt = MagicMock()
        mock_build.return_value = mock_yt
        mock_yt.channels.return_value.list.return_value.execute.side_effect = HttpError(
            resp=MagicMock(status=403), content=b"forbidden"
        )

        with pytest.raises(HttpError):
            fetch_channel_basic_info("UC001")

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_api_key_raises(self):
        from services.youtube.channel_info_fetcher import fetch_channel_basic_info

        # 確保環境變數中沒有 API_KEY
        os.environ.pop("API_KEY", None)

        with pytest.raises(OSError, match="API_KEY"):
            fetch_channel_basic_info("UC001")

    @patch.dict(os.environ, {"API_KEY": "test-key"})
    @patch("services.youtube.channel_info_fetcher.build")
    def test_empty_thumbnails_returns_empty_string(self, mock_build):
        from services.youtube.channel_info_fetcher import fetch_channel_basic_info

        mock_yt = MagicMock()
        mock_build.return_value = mock_yt
        mock_yt.channels.return_value.list.return_value.execute.return_value = {
            "items": [
                {
                    "snippet": {
                        "title": "No Thumb",
                        "thumbnails": {},
                    }
                }
            ]
        }

        result = fetch_channel_basic_info("UC001")
        assert result["thumbnail"] == ""
