import logging

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore
from google.cloud.firestore import Client

from utils.breaker_instances import firestore_breaker
from utils.youtube_utils import normalize_video_item

BATCH_SIZE = 2000
logger = logging.getLogger(__name__)


# Firestore 路徑常數
def get_batch_doc_ref(db: Client, channel_id: str, batch_index: int) -> firestore.DocumentReference:
    return (  # type: ignore[no-any-return]
        db.collection("channel_data")
        .document(channel_id)
        .collection("videos_batch")
        .document(f"batch_{batch_index}")
    )


def write_batches_to_firestore(db: Client, channel_id: str, new_videos: list[dict]) -> dict:
    if not firestore_breaker.allow_request():
        logger.warning("🔴 Firestore 熔斷中，略過寫入：%s", channel_id)
        return {"batches_written": 0, "videos_written": 0, "error": "circuit breaker open"}

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

            normalized_videos.append(
                {
                    "videoId": video_id,
                    "title": title,
                    "publishDate": publish_date,
                    "duration": duration,
                    "type": video_type,
                }
            )

        # ✅ 先去除自身 videoId 重複（保留最新的）
        video_map = {}
        for video in normalized_videos:
            video_map[video["videoId"]] = video  # 會覆蓋舊的
        normalized_videos = list(video_map.values())

        if not normalized_videos:
            logger.info("📭 無有效影片可寫入")
            return {"batches_written": 0, "videos_written": 0}

        # 取得目前最大的 batch index（只讀 1 筆，不帶內容）
        batch_col = db.collection("channel_data").document(channel_id).collection("videos_batch")
        last_docs = (
            batch_col.select([])
            .order_by("__name__", direction=firestore.Query.DESCENDING)
            .limit(1)
            .get()
        )
        max_index = int(last_docs[0].id.replace("batch_", "")) if last_docs else -1

        last_index = max_index
        merged_count = 0
        remaining = normalized_videos

        if last_index >= 0:
            last_doc_ref = get_batch_doc_ref(db, channel_id, last_index)

            @firestore.transactional
            def _merge_in_transaction(transaction):
                last_doc = last_doc_ref.get(transaction=transaction)
                if not last_doc.exists:
                    return 0, normalized_videos

                data = last_doc.to_dict() or {}
                videos = data.get("videos", [])
                space_left = BATCH_SIZE - len(videos)

                existing_map = {v["videoId"]: v for v in videos}
                updated_map = existing_map.copy()

                count = 0
                for video in normalized_videos:
                    vid = video["videoId"]
                    if vid in existing_map:
                        updated_map[vid] = video
                        count += 1
                    elif space_left > 0:
                        updated_map[vid] = video
                        count += 1
                        space_left -= 1

                if count > 0:
                    transaction.set(last_doc_ref, {"videos": list(updated_map.values())})

                written_ids = set(updated_map.keys())
                leftover = [v for v in normalized_videos if v["videoId"] not in written_ids]
                return count, leftover

            transaction = db.transaction()
            merged_count, remaining = _merge_in_transaction(transaction)
            if merged_count > 0:
                logger.info(f"🧩 合併/覆蓋 {merged_count} 筆到 batch_{last_index}")

        # 剩下的資料分批寫入
        new_batches = [remaining[i : i + BATCH_SIZE] for i in range(0, len(remaining), BATCH_SIZE)]
        for i, batch in enumerate(new_batches):
            new_index = max_index + 1 + i
            get_batch_doc_ref(db, channel_id, new_index).set({"videos": batch})
            logger.info(f"📦 新增 batch_{new_index}，包含 {len(batch)} 筆影片")

        logger.info(
            f"✅ 寫入完成，共 {len(normalized_videos)} 筆影片，分為 {len(new_batches) + (1 if merged_count else 0)} 批"
        )

        firestore_breaker.record_success()
        return {
            "batches_written": len(new_batches) + (1 if merged_count else 0),
            "videos_written": len(normalized_videos),
        }

    except GoogleAPIError as e:
        firestore_breaker.record_failure()
        logger.error("🔥 寫入 Firestore batch 時發生錯誤: %s", e, exc_info=True)
        return {"batches_written": 0, "videos_written": 0, "error": str(e)}
