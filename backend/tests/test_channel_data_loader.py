"""
channel_data_loader 測試：載入頻道設定與影片
"""

from unittest.mock import MagicMock

from utils.channel_data_loader import load_channel_settings_and_videos


class TestLoadChannelSettingsAndVideos:
    def test_loads_settings_and_videos(self):
        db = MagicMock()

        # mock 設定 document
        config_doc = MagicMock()
        config_doc.exists = True
        config_doc.to_dict.return_value = {"categories": ["game1"]}
        db.collection("channel_data").document("UC001").collection("settings").document(
            "config"
        ).get.return_value = config_doc

        # mock 影片 batch
        vid_doc = MagicMock()
        vid_doc.to_dict.return_value = {"videos": [{"videoId": "v1", "title": "test"}]}
        db.collection("channel_data").document("UC001").collection(
            "videos_batch"
        ).stream.return_value = [vid_doc]

        channels = [{"channel_id": "UC001"}]
        settings_map, videos_map = load_channel_settings_and_videos(db, channels)

        assert "UC001" in settings_map
        assert "UC001" in videos_map
        assert len(videos_map["UC001"]) == 1

    def test_skips_channels_without_id(self):
        db = MagicMock()
        channels = [{"name": "no id"}]
        settings_map, videos_map = load_channel_settings_and_videos(db, channels)
        assert len(settings_map) == 0

    def test_handles_missing_config(self):
        db = MagicMock()

        config_doc = MagicMock()
        config_doc.exists = False
        db.collection("channel_data").document("UC001").collection("settings").document(
            "config"
        ).get.return_value = config_doc

        db.collection("channel_data").document("UC001").collection(
            "videos_batch"
        ).stream.return_value = []

        channels = [{"channel_id": "UC001"}]
        settings_map, videos_map = load_channel_settings_and_videos(db, channels)

        assert settings_map["UC001"] is not None  # merge 後仍有值
        assert videos_map["UC001"] == []
