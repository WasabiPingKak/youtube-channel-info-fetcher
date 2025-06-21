import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

from google.cloud.firestore import Client
from .firestore_path_tools import document_exists, write_document
from .channel_status_loader import get_active_channels
from .firestore_date_utils import parse_firestore_date

from utils.categorizer import match_category_and_game
from utils.channel_data_loader import load_channel_settings_and_videos
from utils.trending_classifier import classify_videos_to_games

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

        channel_settings_map, channel_videos_map = load_channel_settings_and_videos(db, active_channels)

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

                # 使用共用函式分類
                game_map_partial, stats_partial = classify_videos_to_games(
                    videos,
                    channel_id,
                    settings,
                    match_category_and_game,
                )

                # 合併分類結果
                for game, vids in game_map_partial.items():
                    game_map.setdefault(game, []).extend(vids)

                # 合併統計
                stats["videos_processed"] += stats_partial["videos_processed"]
                stats["videos_classified"] += stats_partial["videos_classified"]
                for game, count in stats_partial["games_found"].items():
                    stats["games_found"].setdefault(game, 0)
                    stats["games_found"][game] += count

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
