"""
trending_classifier 測試：影片分類至遊戲名稱的純函式
"""

from utils.trending_classifier import classify_videos_to_games


def _make_video(video_id, title, vtype="影片"):
    return {
        "videoId": video_id,
        "title": title,
        "publishDate": "2026-03-01T10:00:00Z",
        "duration": 600,
        "type": vtype,
    }


def _simple_matcher(title, vtype, settings):
    """簡單的 matcher：標題含 'Minecraft' 就歸類"""
    if "Minecraft" in title:
        return {"game": "Minecraft"}
    if "Apex" in title:
        return {"game": "Apex"}
    return {"game": None}


class TestClassifyVideosToGames:
    def test_basic_classification(self):
        videos = [
            _make_video("v1", "Minecraft stream"),
            _make_video("v2", "Apex ranked"),
            _make_video("v3", "雜談"),
        ]
        game_map, stats = classify_videos_to_games(videos, "UC001", {}, _simple_matcher)

        assert len(game_map["Minecraft"]) == 1
        assert len(game_map["Apex"]) == 1
        assert "雜談" not in game_map
        assert stats["videos_processed"] == 3
        assert stats["videos_classified"] == 2
        assert stats["games_found"]["Minecraft"] == 1

    def test_empty_videos(self):
        game_map, stats = classify_videos_to_games([], "UC001", {}, _simple_matcher)
        assert len(game_map) == 0
        assert stats["videos_processed"] == 0

    def test_video_data_structure(self):
        videos = [_make_video("v1", "Minecraft stream")]
        game_map, _ = classify_videos_to_games(videos, "UC001", {}, _simple_matcher)
        vid = game_map["Minecraft"][0]
        assert vid["videoId"] == "v1"
        assert vid["channelId"] == "UC001"
        assert vid["title"] == "Minecraft stream"
        assert vid["publishDate"] == "2026-03-01T10:00:00Z"

    def test_no_matches(self):
        videos = [_make_video("v1", "完全不相關的影片")]
        game_map, stats = classify_videos_to_games(videos, "UC001", {}, _simple_matcher)
        assert len(game_map) == 0
        assert stats["videos_classified"] == 0
