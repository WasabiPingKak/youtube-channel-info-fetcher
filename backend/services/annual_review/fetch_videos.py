# services/annual_review/fetch_videos.py

from google.cloud.firestore import Client
from datetime import datetime, timedelta, timezone
from typing import List, Dict
import logging


def fetch_videos(
    db: Client, channel_id: str, period_start: datetime, period_end: datetime
) -> List[Dict]:
    """
    從 Firestore 抓取指定頻道在指定區間內（以 UTC+8 為準）發布的影片。

    Args:
        db (Client): Firestore client
        channel_id (str): 頻道 ID
        period_start (datetime): 起始時間（timezone-aware，原始為 UTC）
        period_end (datetime): 結束時間（timezone-aware，原始為 UTC）

    Returns:
        List[Dict]: 影片資料清單，每筆 dict 包含 videoId, title, duration, publishDate, type
    """

    videos: List[Dict] = []
    tw_offset = timedelta(hours=8)

    try:
        logging.info(f"📦 載入影片 batch：{channel_id}")

        # ➤ 將統計區間調整為 UTC+8 判斷基準
        period_start_tw = period_start + tw_offset
        period_end_tw = period_end + tw_offset

        batch_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("videos_batch")
        )
        batch_docs = batch_ref.stream()

        for doc in batch_docs:
            doc_data = doc.to_dict()
            if not doc_data:
                continue

            for video in doc_data.get("videos", []):
                publish_str = video.get("publishDate")
                if not publish_str:
                    continue

                try:
                    # ➕ Firestore 字串轉 datetime（原始為 UTC）
                    publish_dt = datetime.fromisoformat(publish_str)

                    # 🔄 調整為 UTC+8 進行篩選判斷
                    publish_dt_tw = publish_dt + tw_offset

                    if period_start_tw <= publish_dt_tw <= period_end_tw:
                        # ✅ 保留影片（保留原始 UTC+0 時區字串）
                        videos.append(
                            {
                                "videoId": video.get("videoId"),
                                "title": video.get("title", ""),
                                "duration": video.get("duration", 0),
                                "publishDate": publish_str,  # 保持原始 UTC+0
                                "type": video.get("type", ""),
                            }
                        )

                except Exception:
                    logging.warning(f"⛔ 日期轉換失敗：{publish_str}", exc_info=True)

        logging.info(f"✅ 符合條件影片數量：{len(videos)}")
        return videos

    except Exception:
        logging.error(f"🔥 讀取影片失敗：{channel_id}", exc_info=True)
        return []
