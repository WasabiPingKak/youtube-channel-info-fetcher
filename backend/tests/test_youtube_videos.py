"""
services/youtube/videos.py 測試：YouTube 播放清單與影片詳情抓取
"""

from unittest.mock import MagicMock

from googleapiclient.errors import HttpError

from services.youtube.videos import fetch_video_details, get_video_ids_from_playlist


class TestGetVideoIdsFromPlaylist:
    def test_single_page(self):
        youtube = MagicMock()
        response = {
            "items": [{"contentDetails": {"videoId": f"v{i}"}} for i in range(3)],
        }
        youtube.playlistItems().list().execute.return_value = response
        result = get_video_ids_from_playlist(youtube, "PL123")
        assert result == ["v0", "v1", "v2"]

    def test_multiple_pages(self):
        youtube = MagicMock()
        page1 = {
            "items": [{"contentDetails": {"videoId": "v1"}}],
            "nextPageToken": "token2",
        }
        page2 = {
            "items": [{"contentDetails": {"videoId": "v2"}}],
        }
        youtube.playlistItems().list().execute.side_effect = [page1, page2]
        result = get_video_ids_from_playlist(youtube, "PL123")
        assert result == ["v1", "v2"]

    def test_max_pages_limit(self):
        youtube = MagicMock()
        page1 = {
            "items": [{"contentDetails": {"videoId": "v1"}}],
            "nextPageToken": "token2",
        }
        youtube.playlistItems().list().execute.return_value = page1
        result = get_video_ids_from_playlist(youtube, "PL123", max_pages=1)
        assert result == ["v1"]

    def test_http_error_returns_partial(self):
        youtube = MagicMock()
        resp = MagicMock()
        resp.status = 403
        youtube.playlistItems().list().execute.side_effect = HttpError(
            resp=resp, content=b"quota exceeded"
        )
        result = get_video_ids_from_playlist(youtube, "PL123")
        assert result == []


class TestFetchVideoDetails:
    def test_single_batch(self):
        youtube = MagicMock()
        items = [{"id": f"v{i}", "snippet": {"title": f"t{i}"}} for i in range(3)]
        youtube.videos().list().execute.return_value = {"items": items}
        result = fetch_video_details(youtube, ["v0", "v1", "v2"])
        assert len(result) == 3

    def test_multiple_batches(self):
        youtube = MagicMock()
        batch1_items = [{"id": f"v{i}"} for i in range(50)]
        batch2_items = [{"id": f"v{i}"} for i in range(50, 55)]
        youtube.videos().list().execute.side_effect = [
            {"items": batch1_items},
            {"items": batch2_items},
        ]
        ids = [f"v{i}" for i in range(55)]
        result = fetch_video_details(youtube, ids)
        assert len(result) == 55

    def test_http_error_skips_batch(self):
        youtube = MagicMock()
        resp = MagicMock()
        resp.status = 500
        youtube.videos().list().execute.side_effect = HttpError(resp=resp, content=b"server error")
        result = fetch_video_details(youtube, ["v1", "v2"])
        assert result == []

    def test_empty_ids(self):
        youtube = MagicMock()
        result = fetch_video_details(youtube, [])
        assert result == []
