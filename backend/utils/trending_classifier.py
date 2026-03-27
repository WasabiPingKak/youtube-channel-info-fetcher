from collections.abc import Callable
from typing import Any


def classify_videos_to_games(
    videos: list[dict[str, Any]],
    channel_id: str,
    settings: dict[str, Any],
    matcher_func: Callable[[str, str, dict[str, Any]], dict[str, Any]],
) -> tuple[dict[str, list[dict[str, Any]]], dict[str, Any]]:
    """
    將影片根據 matcher_func 結果分類至遊戲名稱下，並統計分類過程
    - matcher_func(title, type, settings) → {'game': str | None}
    """
    game_map = {}
    stats = {
        "videos_processed": 0,
        "videos_classified": 0,
        "games_found": {},
    }

    for video in videos:
        stats["videos_processed"] += 1

        result = matcher_func(video["title"], video.get("type", ""), settings)
        game = result.get("game")
        if not game:
            continue

        stats["videos_classified"] += 1
        stats["games_found"].setdefault(game, 0)
        stats["games_found"][game] += 1

        video_data = {
            "videoId": video["videoId"],
            "title": video["title"],
            "publishDate": video["publishDate"],
            "duration": video.get("duration", 0),
            "type": video.get("type", ""),
            "channelId": channel_id,
        }
        game_map.setdefault(game, []).append(video_data)

    return game_map, stats
