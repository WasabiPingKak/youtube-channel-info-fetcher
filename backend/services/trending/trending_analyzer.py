# services/trending/trending_analyzer.py

import logging
from datetime import UTC, datetime, timedelta
from typing import Any


def build_theme_statistics(videos: list[dict[str, Any]], theme_key: str, dates: list[str]):
    """
    聚合主題統計資料（不分排序方式），共用。
    回傳：
      - 每個主題在各日期的影片數量
      - 每個主題對應的影片清單
      - 每個主題在各日期的頻道貢獻影片數量（不去重）
    """
    theme_stats: dict[str, dict[str, int]] = {}
    theme_videos: dict[str, list[dict[str, Any]]] = {}
    theme_channel_stats: dict[str, dict[str, dict[str, int]]] = {}

    for v in videos:
        theme = v.get(theme_key)
        ts = v.get("publishDate")
        channel_id = v.get("channelId")

        if not theme or not ts or not channel_id:
            continue

        date_str = str(ts)[:10]
        if date_str not in dates:
            continue

        # 累加主題每日影片數
        theme_stats.setdefault(theme, {}).setdefault(date_str, 0)
        theme_stats[theme][date_str] += 1

        # 累加主題影片列表
        theme_videos.setdefault(theme, []).append(v)

        # 累加主題每日每頻道影片數（不去重）
        theme_channel_stats.setdefault(theme, {}).setdefault(date_str, {}).setdefault(channel_id, 0)
        theme_channel_stats[theme][date_str][channel_id] += 1

    return theme_stats, theme_videos, theme_channel_stats


def get_theme_top_by_videos(
    theme_videos: dict[str, list[dict[str, Any]]], top_n: int = 10
) -> list[str]:
    """
    依據主題的「貢獻頻道數」「影片數」「最新影片時間」排序，取得前 top_n 主題。
    排序邏輯：
      1. 不同頻道數（越多越前）
      2. 影片總數（越多越前）
      3. 最新影片的時間（越新越前）
    """
    theme_stats = []

    for theme, videos in theme_videos.items():
        channel_ids = {v.get("channelId") for v in videos if v.get("channelId")}
        publish_dates = [v["publishDate"] for v in videos if v.get("publishDate")]
        latest_ts = max(publish_dates) if publish_dates else None

        # 若無有效發佈時間則跳過（避免影響排序）
        if not latest_ts:
            continue

        # 若是 datetime 物件則轉成 timestamp，若是字串則先轉成 datetime
        if isinstance(latest_ts, str):
            latest_ts = datetime.fromisoformat(latest_ts)

        theme_stats.append(
            (
                theme,
                len(channel_ids),  # 頻道數
                len(videos),  # 影片數
                latest_ts.timestamp(),  # 最晚影片時間
            )
        )

    # 排序：頻道數多 > 影片數多 > 最新影片時間新
    sorted_themes = sorted(theme_stats, key=lambda item: (item[1], item[2], item[3]), reverse=True)

    return [theme for theme, _, _, _ in sorted_themes[:top_n]]


def build_theme_details(theme_names: list[str], theme_videos: dict[str, list[dict[str, Any]]]):
    """
    將主題影片清單彙整為 details: 主題 → 頻道 → 影片清單
    注意：不主動提供 thumbnail 與 url，僅提供 id、title、publishedAt
    """
    logger = logging.getLogger(__name__)
    details: dict[str, dict[str, Any]] = {}

    for theme in theme_names:
        per_channel: dict[str, Any] = {}
        for v in theme_videos.get(theme, []):
            cid = v.get("channelId")
            if not cid:
                continue
            per_channel.setdefault(cid, {"videos": [], "channelName": v.get("channelName", "")})

            video_info = {
                "id": v.get("videoId"),  # 從 Firestore 來源對應正確欄位
                "title": v.get("title"),
                "publishedAt": v.get("publishDate"),
            }

            per_channel[cid]["videos"].append(video_info)

        # 各頻道影片列表按發佈時間新到舊排序
        for cid in per_channel:
            per_channel[cid]["videos"].sort(key=lambda x: x["publishedAt"], reverse=True)

        details[theme] = per_channel
        logger.info(f"📦 {theme} 頻道數={len(per_channel)}")
    return details


def build_chart_data_by_game_and_date(
    theme_names: list[str], theme_stats: dict[str, dict[str, int]], dates: list[str]
) -> dict[str, dict[str, int]]:
    """
    折線圖資料：主題 → 日期 → 當日新增影片數
    """
    data = {}
    for theme in theme_names:
        per_date = {}
        for date_str in sorted(dates):
            per_date[date_str] = theme_stats.get(theme, {}).get(date_str, 0)
        data[theme] = per_date
    return data


def build_contributors_by_date_and_game(
    theme_names: list[str],
    dates: list[str],
    theme_channel_stats: dict[str, dict[str, dict[str, int]]],
    channel_info: dict[str, dict[str, str]] | None = None,
) -> dict[str, dict[str, dict[str, dict[str, Any]]]]:
    """
    contributorsByDateAndGame: {date: {game: {channelId: {channelName, count}}}}
    """
    contributors: dict[str, dict[str, dict[str, dict[str, Any]]]] = {}
    for date_str in sorted(dates):
        contributors[date_str] = {}
        for theme in theme_names:
            channels = theme_channel_stats.get(theme, {}).get(date_str, {})
            channel_dict = {}
            for cid, count in channels.items():
                channel_name = ""
                if channel_info and cid in channel_info:
                    channel_name = channel_info[cid].get("name", "")
                channel_dict[cid] = {"channelName": channel_name, "count": count}
            if channel_dict:
                contributors[date_str][theme] = channel_dict
    return contributors


def filter_channel_info(
    details: dict[str, dict[str, Any]], channel_info: dict[str, dict[str, str]]
) -> dict[str, dict[str, str]]:
    """僅保留出現在 details 中的頻道資訊"""
    channel_ids = set()
    for theme_channels in details.values():
        channel_ids.update(theme_channels.keys())
    return {cid: channel_info[cid] for cid in channel_ids if cid in channel_info}


def analyze_trending_summary(
    videos: list[dict[str, Any]],
    theme_key: str = "game",
    channel_info: dict[str, dict[str, str]] | None = None,
    days: int = 30,
) -> dict[str, Any]:
    """
    將影片清單依主題分類，產生前端統計用結構
    """
    logger = logging.getLogger(__name__)
    today = datetime.now(UTC).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(1, days + 1)]
    dates = sorted(dates)  # 由舊到新

    # 主題→日期與主題→影片清單
    theme_stats, theme_videos, theme_channel_stats = build_theme_statistics(
        videos, theme_key, dates
    )
    logger.info(f"📊 完成彙總主題資料，共發現 {len(theme_stats)} 種主題")

    # 以影片數排序的 Top10 主題
    top_themes_by_video = get_theme_top_by_videos(theme_videos, top_n=10)
    details_by_video = build_theme_details(top_themes_by_video, theme_videos)
    video_count_by_game_and_date = build_chart_data_by_game_and_date(
        top_themes_by_video, theme_stats, dates
    )
    contributors_by_date_and_game = build_contributors_by_date_and_game(
        top_themes_by_video, dates, theme_channel_stats, channel_info
    )

    filtered_channel_info = filter_channel_info(details_by_video, channel_info or {})

    result: dict[str, Any] = {
        "dates": dates,
        "gameList": top_themes_by_video,
        "videoCountByGameAndDate": video_count_by_game_and_date,
        "contributorsByDateAndGame": contributors_by_date_and_game,
        "details": details_by_video,
        "channelInfo": filtered_channel_info,
    }
    logger.info(f"✅ analyze_trending_summary 統整完成（區間 {days} 天）")
    return result
