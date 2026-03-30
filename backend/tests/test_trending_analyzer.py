"""
trending_analyzer 測試：驗證主題統計、排序、詳情建構等純函式
"""

from datetime import UTC, datetime, timedelta

from services.trending.trending_analyzer import (
    analyze_trending_summary,
    build_chart_data_by_game_and_date,
    build_contributors_by_date_and_game,
    build_theme_details,
    build_theme_statistics,
    filter_channel_info,
    get_theme_top_by_videos,
)


def _make_video(theme, channel_id, publish_date, title="test"):
    return {
        "game": theme,
        "channelId": channel_id,
        "publishDate": publish_date,
        "title": title,
        "videoId": f"vid_{channel_id}_{publish_date}",
    }


class TestBuildThemeStatistics:
    def test_basic_aggregation(self):
        dates = ["2026-03-01", "2026-03-02"]
        videos = [
            _make_video("Minecraft", "UC001", "2026-03-01T10:00:00Z"),
            _make_video("Minecraft", "UC002", "2026-03-01T12:00:00Z"),
            _make_video("Apex", "UC001", "2026-03-02T10:00:00Z"),
        ]
        stats, theme_vids, channel_stats = build_theme_statistics(videos, "game", dates)
        assert stats["Minecraft"]["2026-03-01"] == 2
        assert stats["Apex"]["2026-03-02"] == 1
        assert len(theme_vids["Minecraft"]) == 2

    def test_skips_missing_fields(self):
        dates = ["2026-03-01"]
        videos = [
            {"channelId": "UC001", "publishDate": "2026-03-01T10:00:00Z"},  # 無 game
            {"game": "Apex", "publishDate": "2026-03-01T10:00:00Z"},  # 無 channelId
            {"game": "Apex", "channelId": "UC001"},  # 無 publishDate
        ]
        stats, theme_vids, _ = build_theme_statistics(videos, "game", dates)
        assert len(stats) == 0

    def test_skips_out_of_range_dates(self):
        dates = ["2026-03-01"]
        videos = [_make_video("Minecraft", "UC001", "2026-03-02T10:00:00Z")]
        stats, _, _ = build_theme_statistics(videos, "game", dates)
        assert len(stats) == 0

    def test_channel_stats_structure(self):
        dates = ["2026-03-01"]
        videos = [
            _make_video("Apex", "UC001", "2026-03-01T10:00:00Z"),
            _make_video("Apex", "UC001", "2026-03-01T12:00:00Z"),
            _make_video("Apex", "UC002", "2026-03-01T14:00:00Z"),
        ]
        _, _, channel_stats = build_theme_statistics(videos, "game", dates)
        assert channel_stats["Apex"]["2026-03-01"]["UC001"] == 2
        assert channel_stats["Apex"]["2026-03-01"]["UC002"] == 1


class TestGetThemeTopByVideos:
    def test_sorts_by_channel_count_then_video_count(self):
        theme_videos = {
            "GameA": [
                _make_video("GameA", "UC001", "2026-03-01T10:00:00Z"),
            ],
            "GameB": [
                _make_video("GameB", "UC001", "2026-03-01T10:00:00Z"),
                _make_video("GameB", "UC002", "2026-03-01T11:00:00Z"),
            ],
        }
        result = get_theme_top_by_videos(theme_videos, top_n=10)
        assert result[0] == "GameB"

    def test_top_n_limits_results(self):
        theme_videos = {
            f"Game{i}": [_make_video(f"Game{i}", "UC001", "2026-03-01T10:00:00Z")]
            for i in range(20)
        }
        result = get_theme_top_by_videos(theme_videos, top_n=5)
        assert len(result) == 5

    def test_skips_entries_without_publish_date(self):
        theme_videos = {
            "GameA": [{"channelId": "UC001"}],  # 無 publishDate
        }
        result = get_theme_top_by_videos(theme_videos, top_n=10)
        assert len(result) == 0

    def test_handles_string_datetime(self):
        theme_videos = {
            "GameA": [_make_video("GameA", "UC001", "2026-03-01T10:00:00")],
        }
        result = get_theme_top_by_videos(theme_videos, top_n=10)
        assert result == ["GameA"]

    def test_handles_datetime_object(self):
        theme_videos = {
            "GameA": [
                {
                    "game": "GameA",
                    "channelId": "UC001",
                    "publishDate": datetime(2026, 3, 1, tzinfo=UTC),
                }
            ],
        }
        result = get_theme_top_by_videos(theme_videos, top_n=10)
        assert result == ["GameA"]


class TestBuildThemeDetails:
    def test_builds_channel_grouped_details(self):
        theme_videos = {
            "Minecraft": [
                _make_video("Minecraft", "UC001", "2026-03-02T10:00:00Z", "stream 2"),
                _make_video("Minecraft", "UC001", "2026-03-01T10:00:00Z", "stream 1"),
            ],
        }
        details = build_theme_details(["Minecraft"], theme_videos)
        assert "Minecraft" in details
        assert "UC001" in details["Minecraft"]
        vids = details["Minecraft"]["UC001"]["videos"]
        assert len(vids) == 2
        # 應按時間新到舊排序
        assert vids[0]["publishedAt"] > vids[1]["publishedAt"]

    def test_skips_videos_without_channel_id(self):
        theme_videos = {
            "Apex": [{"videoId": "v1", "title": "t", "publishDate": "2026-03-01"}],
        }
        details = build_theme_details(["Apex"], theme_videos)
        assert len(details["Apex"]) == 0


class TestBuildChartData:
    def test_fills_zero_for_missing_dates(self):
        theme_stats = {"Minecraft": {"2026-03-01": 5}}
        dates = ["2026-03-01", "2026-03-02"]
        result = build_chart_data_by_game_and_date(["Minecraft"], theme_stats, dates)
        assert result["Minecraft"]["2026-03-01"] == 5
        assert result["Minecraft"]["2026-03-02"] == 0


class TestBuildContributors:
    def test_builds_contributor_structure(self):
        channel_stats = {"Apex": {"2026-03-01": {"UC001": 3}}}
        channel_info = {"UC001": {"name": "TestCh"}}
        result = build_contributors_by_date_and_game(
            ["Apex"], ["2026-03-01"], channel_stats, channel_info
        )
        assert result["2026-03-01"]["Apex"]["UC001"]["channelName"] == "TestCh"
        assert result["2026-03-01"]["Apex"]["UC001"]["count"] == 3

    def test_empty_channel_info(self):
        channel_stats = {"Apex": {"2026-03-01": {"UC001": 1}}}
        result = build_contributors_by_date_and_game(["Apex"], ["2026-03-01"], channel_stats, None)
        assert result["2026-03-01"]["Apex"]["UC001"]["channelName"] == ""

    def test_skips_dates_with_no_channels(self):
        result = build_contributors_by_date_and_game(["Apex"], ["2026-03-01"], {}, None)
        assert "Apex" not in result.get("2026-03-01", {})


class TestFilterChannelInfo:
    def test_filters_to_used_channels(self):
        details = {"Minecraft": {"UC001": {}, "UC002": {}}}
        channel_info = {
            "UC001": {"name": "A"},
            "UC002": {"name": "B"},
            "UC003": {"name": "C"},
        }
        result = filter_channel_info(details, channel_info)
        assert "UC001" in result
        assert "UC002" in result
        assert "UC003" not in result


class TestAnalyzeTrendingSummary:
    def test_produces_complete_structure(self):
        today = datetime.now(UTC).date()
        yesterday = (today - timedelta(days=1)).isoformat()
        videos = [
            _make_video("Minecraft", "UC001", f"{yesterday}T10:00:00Z"),
            _make_video("Minecraft", "UC002", f"{yesterday}T12:00:00Z"),
        ]
        result = analyze_trending_summary(
            videos, theme_key="game", channel_info={"UC001": {"name": "Ch1"}}, days=7
        )
        assert "dates" in result
        assert "gameList" in result
        assert "videoCountByGameAndDate" in result
        assert "contributorsByDateAndGame" in result
        assert "details" in result
        assert "channelInfo" in result

    def test_empty_videos(self):
        result = analyze_trending_summary([], theme_key="game", days=7)
        assert result["gameList"] == []
