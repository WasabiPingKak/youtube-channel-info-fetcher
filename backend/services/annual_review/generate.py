# services/annual_review/generate.py

from datetime import datetime, timezone
from typing import Optional
import logging

from google.cloud.firestore import Client
from services.annual_review.fetch_videos import fetch_videos


def generate_annual_review_data(
    db: Client,
    channel_id: str,
    year: int,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
) -> dict:
    """
    為指定頻道與年度產生年度回顧資料，並寫入 Firestore。
    若該 document 已存在，會直接覆寫。

    Args:
        db (Client): Firestore client
        channel_id (str): YouTube 頻道 ID
        year (int): 年度
        period_start (datetime, optional): 自訂起始時間（timezone-aware）
        period_end (datetime, optional): 自訂結束時間（timezone-aware）

    Returns:
        dict: 統計結果（含成功與寫入時間資訊）
    """

    try:
        # ✅ 1. 計算統計區間
        if period_start is None:
            period_start = datetime(year, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        if period_end is None:
            period_end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

        generated_at = datetime.now(timezone.utc).isoformat()

        logging.info(
            f"📊 開始產生年度統計：channel={channel_id}, year={year}, "
            f"期間={period_start.isoformat()} ~ {period_end.isoformat()}"
        )

        # ✅ 2. 載入影片資料（之後改由資料來源服務提供）
        videos = fetch_videos(db, channel_id, period_start, period_end)

        # ✅ 3. 統計資料（暫時使用 placeholder，之後會用 calc 模組取代）
        stats_data = {
            "basic_stats": {
                "shorts_count": 0,
                "video_count": 0,
                "live_count": 0,
                "total_live_hours": 0.0,
            },
            "category_ratio": {
                "game": 0.0,
                "chatting": 0.0,
                "music": 0.0,
                "program": 0.0,
                "unclassified": 0.0,
            },
            "monthly_breakdown": {
                f"{m:02}": {
                    "game": 0.0,
                    "chatting": 0.0,
                    "music": 0.0,
                    "program": 0.0,
                    "unclassified": 0.0,
                }
                for m in range(1, 13)
            },
            "special_stats": {
                "longest_live": None,
                "shortest_live": None,
                "longest_streak_days": 0,
                "distinct_live_days": 0,
                "peak_month": "",
                "top_game": None,
                "distinct_games_count": 0,
                "distinct_games_list": [],
            },
        }

        # ✅ 4. 寫入 Firestore
        doc_id = f"{channel_id}_{year}"
        review_ref = db.collection("annual_review").document(doc_id)
        review_ref.set(
            {
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "generated_at": generated_at,
                **stats_data,
            }
        )

        logging.info(f"✅ 年度回顧寫入成功：{doc_id}")

        return {
            "success": True,
            "channel_id": channel_id,
            "year": year,
            "updated": True,
            "generated_at": generated_at,
        }

    except Exception as e:
        logging.error("🔥 年度回顧統計失敗", exc_info=True)
        return {
            "success": False,
            "channel_id": channel_id,
            "year": year,
            "updated": False,
            "error": str(e),
        }
