import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

from google.cloud.firestore import Client
from services.trending.utils import (
    document_exists,
    write_document,
    get_active_channels,
)
from utils.settings_preparer import merge_game_category_aliases
from utils.categorizer import match_category_and_game

logger = logging.getLogger(__name__)


def build_trending_for_date_range(
    start_date: str, days: int, db: Client, force: bool = False
) -> Dict[str, Any]:
    """從 start_date 開始，往前處理 N 天的 trending 分析"""
    try:
        target_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        date_range = [
            (target_start - timedelta(days=offset)).isoformat()
            for offset in range(days)
        ]
        logger.info(f"📆 開始批次處理 {len(date_range)} 天：{date_range[0]} ～ {date_range[-1]}")

        # 快取頻道清單、設定與影片
        active_channels = get_active_channels(db)
        logger.info(f"📡 活躍頻道數量：{len(active_channels)}")

        channel_settings_map = {}
        channel_videos_map = {}

        for channel in active_channels:
            channel_id = channel.get("channel_id")
            if not channel_id:
                continue

            # 讀取並快取設定
            config_doc = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("settings")
                .document("config")
                .get()
            )
            raw_settings = config_doc.to_dict() if config_doc.exists else {}
            merged_settings = merge_game_category_aliases(raw_settings)
            channel_settings_map[channel_id] = merged_settings

            # 載入並快取所有影片（合併所有 batch）
            batch_ref = (
                db.collection("channel_data")
                .document(channel_id)
                .collection("videos_batch")
            )
            video_items = []
            for doc in batch_ref.stream():
                video_items.extend(doc.to_dict().get("videos", []))
            channel_videos_map[channel_id] = video_items

        # 每日處理
        results = []
        for date_str in date_range:
            trending_doc_path = f"trending_games_daily/{date_str}"
            if not force and document_exists(db, trending_doc_path):
                logger.info(f"⚠️ {date_str} 已存在，略過建立")
                results.append({
                    "date": date_str,
                    "skipped": True,
                    "reason": "Document already exists"
                })
                continue

            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            game_map = {}
            stats = {
                "date": date_str,
                "channels": len(active_channels),
                "videos_processed": 0,
                "videos_classified": 0,
                "games_found": {},
            }

            for channel in active_channels:
                channel_id = channel.get("channel_id")
                settings = channel_settings_map[channel_id]
                all_videos = channel_videos_map[channel_id]

                # 當日影片過濾
                videos = [
                    v for v in all_videos
                    if parse_firestore_date(v.get("publishDate")) and
                    parse_firestore_date(v.get("publishDate")).date() == target_date
                ]

                for video in videos:
                    stats["videos_processed"] += 1

                    result = match_category_and_game(
                        video["title"],
                        video["type"],
                        settings
                    )
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
                        "channelId": channel_id
                    }
                    game_map.setdefault(game, []).append(video_data)

            write_document(db, trending_doc_path, game_map)
            logger.info(f"✅ 寫入完成 {date_str}，共 {len(game_map)} 個遊戲")
            results.append({
                "date": date_str,
                "skipped": False,
                "games": list(game_map.keys()),
                "stats": stats,
            })

        return {
            "startDate": start_date,
            "days": days,
            "force": force,
            "results": results,
        }

    except Exception as e:
        logger.error("🔥 批次建立 trending_games_daily 發生錯誤", exc_info=True)
        return {"error": str(e), "startDate": start_date}


def parse_firestore_date(raw) -> datetime | None:
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    elif hasattr(raw, "to_datetime"):
        return raw.to_datetime()
    return None
