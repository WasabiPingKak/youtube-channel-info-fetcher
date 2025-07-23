import logging
from datetime import datetime, timezone
from services.firestore.channel_loader import load_all_channels_from_index_list, load_videos_for_channel
from services.firestore.heatmap_writer import write_channel_heatmap_result
from services.firestore.active_time_writer import write_active_time_all_to_channel_index_batch
from utils.datetime_utils import get_taiwan_datetime_from_publish, is_within_last_7_days

WEEKDAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def create_empty_video_matrix():
    """建立一個空的 7x24 matrix（key 為 'Sun'~'Sat'）"""
    return {k: [[] for _ in range(24)] for k in WEEKDAY_KEYS}

def analyze_and_update_all_channels(db):
    updated = 0
    skipped = 0
    skipped_channels = []

    channels = load_all_channels_from_index_list(db)
    logging.debug(f"📡 共載入 {len(channels)} 個頻道進行分析")

    for channel in channels:
        channel_id = channel.get("channel_id")
        if not channel_id:
            logging.warning("⚠️ channel_id 欄位缺失，跳過此項")
            skipped += 1
            continue

        last_sync_raw = channel.get("lastVideoSyncAt")
        if not last_sync_raw:
            skipped += 1
            skipped_channels.append(channel_id)
            continue

        try:
            last_sync_dt = datetime.fromisoformat(last_sync_raw)
            if last_sync_dt.tzinfo is None:
                last_sync_dt = last_sync_dt.replace(tzinfo=timezone.utc)
        except Exception as e:
            logging.warning(f"❗ 無法解析 lastVideoSyncAt：{last_sync_raw}，錯誤：{e}")
            skipped += 1
            skipped_channels.append(channel_id)
            continue

        if not is_within_last_7_days(last_sync_dt):
            logging.info(f"⏩ 頻道 {channel_id} 的 lastVideoSyncAt 不在本週，跳過")
            skipped += 1
            skipped_channels.append(channel_id)
            continue

        try:
            success = update_single_channel_heatmap(db, channel_id)
            if success:
                updated += 1
            else:
                skipped += 1
                skipped_channels.append(channel_id)
        except Exception as e:
            logging.error(f"🔥 頻道 {channel_id} 統計錯誤：{e}")
            skipped += 1
            skipped_channels.append(channel_id)

    logging.info(f"🏁 統計完成：成功={updated}，跳過={skipped}")
    return {
        "updated": updated,
        "skipped": skipped,
        "skipped_channels": skipped_channels
    }


def update_single_channel_heatmap(db, channel_id: str) -> bool:
    """針對單一頻道進行影片活躍時間分析與寫入（不檢查 lastVideoSyncAt）

    回傳：
        True 表示成功寫入統計結果
        False 表示被略過（例如影片為空）或發生錯誤
    """
    from services.firestore.channel_loader import load_videos_for_channel
    from services.firestore.heatmap_writer import write_channel_heatmap_result
    from utils.datetime_utils import get_taiwan_datetime_from_publish

    if not channel_id:
        logging.warning("⚠️ update_single_channel_heatmap 收到空的 channel_id")
        return False

    logging.debug(f"🔍 處理頻道：{channel_id}")

    videos = load_videos_for_channel(db, channel_id)
    if not videos:
        logging.warning(f"⚠️ 頻道 {channel_id} 沒有可用影片，跳過")
        return False

    logging.debug(f"📊 開始統計 {channel_id} 的影片數量：{len(videos)}")

    full_matrix = create_empty_video_matrix()
    slot_counter = [0, 0, 0, 0]

    for v in videos:
        try:
            video_id = v.get("videoId")
            if not video_id:
                continue

            dt = get_taiwan_datetime_from_publish(v)
            weekday_key = WEEKDAY_KEYS[dt.weekday()]
            hour = dt.hour
            slot = hour // 6

            full_matrix[weekday_key][hour].append(video_id)
            slot_counter[slot] += 1

        except Exception as e:
            logging.warning(f"❗ 無法處理影片：{v.get('videoId')}，錯誤：{e}")
            continue

    logging.debug(
        f"📈 統計完成：{channel_id} - 全片={len(videos)}，slot分布={slot_counter}"
    )

    now = datetime.now(timezone.utc)

    write_channel_heatmap_result(
        db=db,
        channel_id=channel_id,
        full_matrix=full_matrix,
        full_count=len(videos),
        slot_counter=slot_counter
    )

    write_active_time_all_to_channel_index_batch(
        db=db,
        channel_id=channel_id,
        slot_counter=slot_counter,
        total_count=len(videos),
        updated_at=now
    )

    logging.debug(f"✅ 成功寫入 {channel_id} 的 heat_map 與 active_time 統計結果")
    return True
