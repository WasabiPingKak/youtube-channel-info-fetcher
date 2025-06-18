import logging
from datetime import datetime, timezone
from google.cloud.firestore import Client
from services.firestore.channel_loader import load_all_channels_from_index_list

DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

def convert_matrix_to_count(matrix):
    result = {}
    total = 0
    for day in DAY_KEYS:
        hour_map = matrix.get(day, {})
        count_map = {}
        for hour_str, video_list in hour_map.items():
            count = len(video_list)
            count_map[hour_str] = count
            total += count
        result[day] = count_map
    return result, total

def build_channel_metadata_lookup(db: Client) -> dict:
    """從 channel_index_batch 建立 channelId → 詳細資料 的 lookup dict"""
    lookup = {}
    try:
        batch_docs = db.collection("channel_index_batch").stream()
        for batch_doc in batch_docs:
            data = batch_doc.to_dict()
            for entry in data.get("channels", []):
                cid = entry.get("channel_id")
                if cid:
                    lookup[cid] = {
                        "name": entry.get("name"),
                        "thumbnail": entry.get("thumbnail"),
                        "countryCode": entry.get("countryCode", [])
                    }
        logging.info(f"🧾 從 channel_index_batch 建立 lookup，共 {len(lookup)} 筆")
    except Exception as e:
        logging.error(f"🔥 無法讀取 channel_index_batch：{e}")
    return lookup

def build_weekly_heatmap_cache(db: Client):
    # 預先讀取基本資料 mapping
    metadata_lookup = build_channel_metadata_lookup(db)
    channels = load_all_channels_from_index_list(db)

    result = []
    missing_count = 0
    skipped_without_meta = 0

    for channel in channels:
        channel_id = channel.get("channel_id")
        if not channel_id:
            continue

        meta = metadata_lookup.get(channel_id)
        if not meta:
            logging.warning(f"⚠️ {channel_id} 無對應的 metadata，跳過")
            skipped_without_meta += 1
            continue

        doc_ref = db.document(f"channel_data/{channel_id}/heat_map/channel_video_heatmap")
        doc = doc_ref.get()
        if not doc.exists:
            logging.warning(f"⚠️ {channel_id} heatmap 文件不存在，跳過")
            missing_count += 1
            continue

        data = doc.to_dict()
        all_range = data.get("all_range")
        if not all_range:
            logging.warning(f"⚠️ {channel_id} 未包含 all_range，跳過")
            missing_count += 1
            continue

        matrix = all_range.get("matrix", {})
        active_time, total_count = convert_matrix_to_count(matrix)

        result.append({
            "channelId": channel_id,
            "name": meta.get("name"),
            "thumbnail": meta.get("thumbnail"),
            "countryCode": meta.get("countryCode"),
            "activeTime": active_time,
            "totalCount": total_count,
        })

    logging.info(f"📦 快取建立完成：共 {len(result)} 筆頻道，略過 heatmap 缺失 {missing_count} 筆，meta 缺失 {skipped_without_meta} 筆")
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "channels": result
    }

def write_weekly_heatmap_cache(db: Client):
    try:
        data = build_weekly_heatmap_cache(db)
        ref = db.collection("stats_cache").document("active_time_weekly")
        ref.set(data)
        logging.info(f"✅ 已寫入 stats_cache/active_time_weekly，共 {len(data['channels'])} 筆")
        return True
    except Exception as e:
        logging.error(f"🔥 寫入 weekly heatmap cache 失敗：{e}")
        return False
