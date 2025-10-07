import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional

from google.cloud.firestore import Client
from services.youtube.fetcher import get_video_data
from services.firestore.batch_writer import write_batches_to_firestore
from services.firestore.sync_time_index import (
    get_last_video_sync_time,
    update_last_sync_time,
)
from services.classified_video_fetcher import get_classified_videos
from services.video_analyzer.category_counter import count_category_counts
from services.firestore.category_writer import (
    write_category_counts_to_channel_index_batch,
)
from services.firestore.check_and_update_channel_info import (
    check_and_update_channel_info,
)

DEFAULT_REFRESH_LIMIT = 50
RECENT_CHECK_INTERVAL_SECONDS = 2 * 86400  # 2 天

logger = logging.getLogger(__name__)


def select_channels_for_scan(
    all_channels: List[Dict],
    limit: int = DEFAULT_REFRESH_LIMIT,
    include_recent: bool = False,
) -> List[Dict]:
    now = datetime.now(timezone.utc)
    scored = []

    for entry in all_channels:
        channel_id = entry.get("channel_id")
        if not channel_id:
            continue

        last_checked_at = entry.get("lastCheckedAt")
        try:
            if not last_checked_at:
                age = float("inf")  # 從未檢查過，視為最高優先
            else:
                last_checked_dt = (
                    datetime.fromisoformat(last_checked_at)
                    if isinstance(last_checked_at, str)
                    else last_checked_at
                )
                age = (now - last_checked_dt).total_seconds()

                if not include_recent and age < RECENT_CHECK_INTERVAL_SECONDS:
                    continue  # 太新，不處理

            scored.append((age, entry))

        except Exception as e:
            logger.warning(f"⚠️ 無法解析時間格式：{last_checked_at} | {e}")

    scored.sort(reverse=True, key=lambda x: x[0])
    selected = [entry for _, entry in scored[:limit]]

    logger.info(f"📋 預選頻道數量：{len(selected)} / {len(all_channels)}")
    return selected


def update_index_entry(
    index_data: Dict, channel_id: str, checked_at: datetime, sync_at: Optional[str]
) -> None:
    updated = False
    for entry in index_data["channels"]:
        if entry.get("channel_id") == channel_id:
            entry["lastCheckedAt"] = checked_at.isoformat()
            if sync_at:
                entry["lastVideoSyncAt"] = sync_at
            updated = True
            break

    if not updated:
        index_data["channels"].append(
            {
                "channel_id": channel_id,
                "lastCheckedAt": checked_at.isoformat(),
                "lastVideoSyncAt": sync_at or checked_at.isoformat(),
            }
        )


def get_batch_id_map(db: Client) -> Dict[str, str]:
    """
    扫描所有 channel_index_batch，建立 channel_id → batch_id 的對照表。
    """
    result = {}
    docs = db.collection("channel_index_batch").stream()
    for doc in docs:
        data = doc.to_dict()
        for ch in data.get("channels", []):
            cid = ch.get("channel_id")
            if cid:
                result[cid] = doc.id
    return result


def run_daily_channel_refresh(
    db: Client,
    limit: int = DEFAULT_REFRESH_LIMIT,
    include_recent: bool = False,
    dry_run: bool = False,
    full_scan: bool = False,
    force_category_counts: bool = False,
) -> Dict:
    index_ref = db.collection("channel_sync_index").document("index_list")
    index_doc = index_ref.get()
    if not index_doc.exists:
        logger.warning("📭 無 index_list 文件，略過")
        return {"status": "no_index_list"}

    index_data = index_doc.to_dict()
    all_channels = index_data.get("channels", [])

    selected = select_channels_for_scan(
        all_channels, limit=limit, include_recent=include_recent
    )
    selected_ids = [ch["channel_id"] for ch in selected]

    if dry_run:
        return {
            "status": "dry_run",
            "candidates": selected_ids,
            "selected_count": len(selected_ids),
            "total_channels": len(all_channels),
            "limit": limit,
            "include_recent": include_recent,
            "limit_applied": len(selected) < len(all_channels),
        }

    # 🆕 預先建立 batch_id map（一次性查詢）
    batch_id_map = get_batch_id_map(db)

    now = datetime.now(timezone.utc)
    processed = []
    skipped = []

    for ch in selected:
        channel_id = ch["channel_id"]
        try:
            logger.info(f"📡 更新頻道 {channel_id}")

            # 🆕 同步名稱與頭像
            batch_id = batch_id_map.get(channel_id)
            if batch_id:
                check_and_update_channel_info(db, channel_id, batch_id)
            else:
                logger.warning(
                    f"⚠️ 找不到頻道 {channel_id} 所屬的 batch_id，略過名稱與頭像同步"
                )

            # 🔄 抓取影片
            if full_scan:
                date_ranges = None
                limit_pages = None
            else:
                last_sync_time = get_last_video_sync_time(db, channel_id)
                safe_sync_time = (
                    last_sync_time + timedelta(seconds=1) if last_sync_time else None
                )
                date_ranges = [(safe_sync_time, now)] if safe_sync_time else None
                limit_pages = 2

            new_videos = get_video_data(
                date_ranges=date_ranges,
                input_channel=channel_id,
                limit_pages=limit_pages,
            )
            logger.info(f"📥 頻道 {channel_id} 抓取影片數量：{len(new_videos)}")

            if not new_videos:
                logger.info(f"📭 頻道 {channel_id} 無新影片")
                videos_written = 0
                latest_sync = None
            else:
                result = write_batches_to_firestore(db, channel_id, new_videos)
                videos_written = result.get("videos_written", 0)
                latest_sync = update_last_sync_time(db, channel_id, new_videos)
                logger.info(f"✅ 寫入頻道 {channel_id} 的影片數量：{videos_written}")

            # 🟡 強制 category_counts（如啟用）
            if force_category_counts:
                classified = get_classified_videos(db, channel_id)
                counts = count_category_counts(classified)
                if counts.get("all", 0) > 0:
                    write_category_counts_to_channel_index_batch(db, channel_id, counts)
                    logger.info(f"📊 強制更新 category_counts → {channel_id}")
                else:
                    logger.info(f"⚪ category_counts 空值，略過寫入 → {channel_id}")

            update_index_entry(
                index_data,
                channel_id,
                checked_at=now,
                sync_at=latest_sync if new_videos else None,
            )
            processed.append(
                {"channel_id": channel_id, "videos_written": videos_written}
            )

        except Exception as e:
            logger.warning(f"⚠️ 更新頻道 {channel_id} 失敗：{e}", exc_info=True)
            skipped.append(channel_id)

    try:
        index_ref.set(index_data)
        logger.info("📁 回寫 index_list 完成")
    except Exception as e:
        logger.error("🔥 回寫 index_list 發生錯誤", exc_info=True)

    return {
        "status": "success",
        "processed": len(processed),
        "skipped": len(skipped),
        "updated_channels": [ch for ch in processed if ch.get("videos_written", 0) > 0],
    }
