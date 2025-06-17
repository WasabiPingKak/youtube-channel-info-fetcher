import logging
from typing import Dict, Any
from google.cloud.firestore import Client

# 如果你在同一層 services/trending 下
from services.trending.channel_info_loader import load_channel_info_index
from services.trending.trending_loader import load_trending_videos_by_date_range
from services.trending.trending_analyzer import analyze_trending_summary

def get_trending_games_summary(db: Client, days: int = 30) -> Dict[str, Any]:
    """
    從 Firestore 的 trending_games_daily/{YYYY-MM-DD} 讀取指定區間資料，
    統計出熱門遊戲在各日期的影片數量與貢獻頻道，並彙整詳細頻道與影片清單。

    參數:
        db: Firestore client 實例
        days: 查詢區間天數，支援 7、14、30（預設為 30）

    回傳資料格式:
    {
        "dates": List[str],  # 日期列表，格式為 YYYY-MM-DD，依時間排序
        "gameList": List[str],  # 熱門遊戲名稱列表，依影片數量排序（最多 10 個）
        "videoCountByGameAndDate": Dict[str, Dict[str, int]],
            # 每個遊戲每日的影片數量統計，如 { "Minecraft": { "2025-06-01": 3, ... } }

        "contributorsByDateAndGame": Dict[str, Dict[str, List[str]]],
            # 每日每個遊戲的貢獻頻道清單，如 { "2025-06-01": { "Minecraft": ["UC123", "UC456", ...] } }

        "details": Dict[str, Dict[str, List[Dict]]],
            # 各遊戲下的頻道 → 影片清單，如 { "Minecraft": { "UC123": [VideoItem, ...], ... } }

        "channelInfo": Dict[str, Dict[str, str]],
            # 頻道基本資訊，如 { "UC123": { "name": ..., "thumbnail": ..., "url": ... }, ... }
    }
    """
    try:
        logger = logging.getLogger(__name__)

        if days not in {7, 14, 30}:
            logger.warning(f"⚠️ 無效的 days 參數：{days}，已自動套用預設值 30")
            days = 30

        logger.info(f"📅 準備讀取過去 {days} 天資料")
        channel_info = load_channel_info_index(db)
        logger.info(f"📡 已載入頻道資訊，共 {len(channel_info)} 筆")

        # 1. 載入影片
        videos = load_trending_videos_by_date_range(db, days=days)
        logger.info(f"📁 共載入 {len(videos)} 支影片")

        # 2. 分析分類
        result = analyze_trending_summary(
            videos=videos,
            theme_key="game",
            channel_info=channel_info,
            days=days,
        )
        return result

    except Exception as e:
        logging.getLogger(__name__).error(
            "🔥 無法產生 trending_games_summary", exc_info=True
        )
        return {"error": str(e)}
