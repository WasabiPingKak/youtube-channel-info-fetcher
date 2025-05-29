import logging
from datetime import datetime
from dateutil.parser import parse
from google.cloud.firestore import Client
from typing import List, Dict
from utils.youtube_utils import normalize_video_item

BATCH_SIZE = 2000
logger = logging.getLogger(__name__)

# Firestore 路徑常數
def get_batch_doc_ref(db: Client, channel_id: str, batch_index: int):
    return db.collection("channel_data").document(channel_id).collection("videos_batch").document(f"batch_{batch_index}")

from dateutil.parser import parse

def write_batches_to_firestore(db: Client, channel_id: str, new_videos: List[Dict]) -> Dict:
    try:
        # 🔎 預處理：只保留特定欄位
        normalized_videos = []
        for raw in new_videos:
            item = normalize_video_item(raw)
            if not item:
                continue
            video_id = item.get("videoId")
            title = item.get("title")
            publish_date = item.get("publishDate")
            duration = item.get("duration")
            video_type = item.get("type")

            if not all([video_id, title, publish_date, video_type]):
                logger.warning("⚠️ 略過不完整影片：%s", item)
                continue

            normalized_videos.append({
                "videoId": video_id,
                "title": title,
                "publishDate": publish_date,
                "duration": duration,
                "type": video_type
            })

        if not normalized_videos:
            logger.info("📭 無有效影片可寫入")
            return {
                "batches_written": 0,
                "videos_written": 0
            }

        # 取得目前最大的 batch index
        batch_col = db.collection("channel_data").document(channel_id).collection("videos_batch")
        docs = list(batch_col.stream())
        batch_indices = [int(doc.id.replace("batch_", "")) for doc in docs if doc.id.startswith("batch_")]
        max_index = max(batch_indices) if batch_indices else -1

        last_index = max_index
        merged_count = 0
        if last_index >= 0:
            last_doc_ref = get_batch_doc_ref(db, channel_id, last_index)
            last_doc = last_doc_ref.get()
            if last_doc.exists:
                data = last_doc.to_dict()
                videos = data.get("videos", [])
                space_left = BATCH_SIZE - len(videos)
                if space_left > 0:
                    to_merge = normalized_videos[:space_left]
                    videos.extend(to_merge)
                    last_doc_ref.set({"videos": videos})
                    merged_count = len(to_merge)
                    logger.info(f"🧩 已合併 {merged_count} 筆到 batch_{last_index}")

        remaining = normalized_videos[merged_count:]
        new_batches = [remaining[i:i + BATCH_SIZE] for i in range(0, len(remaining), BATCH_SIZE)]

        for i, batch in enumerate(new_batches):
            new_index = max_index + 1 + i
            get_batch_doc_ref(db, channel_id, new_index).set({"videos": batch})
            logger.info(f"📦 新增 batch_{new_index}，包含 {len(batch)} 筆影片")

        logger.info(f"✅ 寫入完成，共 {len(normalized_videos)} 筆影片，分為 {len(new_batches) + (1 if merged_count else 0)} 批")

        return {
            "batches_written": len(new_batches) + (1 if merged_count else 0),
            "videos_written": len(normalized_videos)
        }

    except Exception as e:
        logger.error("🔥 寫入 Firestore batch 時發生錯誤: %s", e, exc_info=True)
        return {
            "batches_written": 0,
            "videos_written": 0,
            "error": str(e)
        }