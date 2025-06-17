"""
services/trending/trending_loader.py
負責從 Firestore 載入指定日期範圍內的所有 trending 遊戲影片並回傳清單
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from google.cloud.firestore import Client

logger = logging.getLogger(__name__)

def load_trending_videos_by_date_range(db: Client, days: int = 30) -> List[Dict[str, Any]]:
    """
    從 Firestore 'trending_games_daily/{YYYY-MM-DD}' 批次載入影片，
    並合併成一份包含 'game', 'channelId', 'publishDate', 及其他欄位的影片清單。

    參數:
        db: Firestore client 實例
        days: 查詢區間天數，支援 7、14、30（預設 30）

    回傳:
        List of video dicts
    """
    videos: List[Dict[str, Any]] = []
    today = datetime.now(timezone.utc).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(1, days + 1)]
    logger.info(f"📅 讀取過去 {days} 天資料：{dates[-1]} ~ {dates[0]}")

    for date_str in dates:
        doc_ref = db.collection("trending_games_daily").document(date_str)
        doc = doc_ref.get()
        if not doc.exists:
            logger.info(f"⚠️ 找不到日期 {date_str} 的資料，跳過")
            continue
        data = doc.to_dict()
        logger.info(f"🔄 讀取 {date_str}，共 {len(data)} 種主題")
        for game, video_list in data.items():
            if not isinstance(video_list, list):
                continue
            for v in video_list:
                if not isinstance(v, dict):
                    continue
                item = dict(v)
                item["game"] = game
                videos.append(item)
    logger.info(f"✅ 已載入影片總數：{len(videos)}")
    return videos
