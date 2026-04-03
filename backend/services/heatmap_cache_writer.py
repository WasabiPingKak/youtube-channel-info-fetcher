import logging
from datetime import UTC, datetime

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore
from google.cloud.firestore import Client

from services.firestore.channel_loader import load_all_channels_from_index_list
from services.heatmap.metadata_loader import build_channel_metadata_lookup
from services.heatmap.utils import convert_matrix_to_count


def build_weekly_heatmap_cache(db: Client) -> dict:
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

        data = doc.to_dict() or {}
        all_range = data.get("all_range")
        if not all_range:
            logging.warning(f"⚠️ {channel_id} 未包含 all_range，跳過")
            missing_count += 1
            continue

        matrix = all_range.get("matrix", {})
        active_time, total_count = convert_matrix_to_count(matrix)

        result.append(
            {
                "channelId": channel_id,
                "name": meta.get("name"),
                "thumbnail": meta.get("thumbnail"),
                "countryCode": meta.get("countryCode"),
                "activeTime": active_time,
                "totalCount": total_count,
            }
        )

    logging.info(
        f"📦 快取建立完成：共 {len(result)} 筆頻道，略過 heatmap 缺失 {missing_count} 筆，meta 缺失 {skipped_without_meta} 筆"
    )
    return {"version": 1, "generatedAt": datetime.now(UTC).isoformat(), "channels": result}


def write_weekly_heatmap_cache(db: Client) -> bool:
    try:
        # Step 1: 主體資料來自 build_weekly_heatmap_cache()
        weekly_data = build_weekly_heatmap_cache(db)
        weekly_channels = weekly_data.get("channels", [])

        pending_ref = db.collection("stats_cache").document("active_time_pending")
        weekly_ref = db.collection("stats_cache").document("active_time_weekly")

        # Step 2-5: Transaction 內讀取 pending → 合併 → 寫入 weekly → 清空 pending
        @firestore.transactional
        def _merge_and_clear(transaction):
            pending_doc = pending_ref.get(transaction=transaction)
            pending_data = (pending_doc.to_dict() or {}) if pending_doc.exists else {}  # type: ignore[union-attr]
            pending_channels = pending_data.get("channels", [])

            logging.info(f"🔄 讀取 pending 快取：{len(pending_channels)} 筆")

            # 合併並去重（channelId 為 key，pending 覆蓋同 ID）
            combined = {c["channelId"]: c for c in weekly_channels}
            for p in pending_channels:
                combined[p["channelId"]] = p

            merged_channels = list(combined.values())
            logging.info(f"📝 合併後頻道總數：{len(merged_channels)}")

            weekly_data["channels"] = merged_channels
            transaction.set(weekly_ref, weekly_data)
            transaction.set(pending_ref, {"channels": []})

            return len(merged_channels)

        transaction = db.transaction()
        count = _merge_and_clear(transaction)
        logging.info(f"✅ 已覆蓋寫入 active_time_weekly，共 {count} 筆，並清空 pending")

        return True
    except GoogleAPIError as e:
        logging.error(f"🔥 寫入 weekly heatmap cache 失敗：{e}")
        return False


def append_to_pending_cache(db: firestore.Client, channel_id: str) -> None:
    """
    將單一新初始化頻道的活躍 heatmap 統計結果寫入 pending 快取文件（避免重複）

    來源：
    - activeTime: 從 Firestore 的 all_range.matrix 統計 count
    - metadata: 從 channel_index_batch 裡查 name / thumbnail / countryCode
    """
    try:
        # 🔍 Step 1: 讀取 heatmap matrix
        doc_ref = db.document(f"channel_data/{channel_id}/heat_map/channel_video_heatmap")
        doc = doc_ref.get()
        if not doc.exists:
            logging.warning(f"⚠️ [pending] {channel_id} heatmap 文件不存在，無法加入快取")
            return

        all_range = (doc.to_dict() or {}).get("all_range")
        if not all_range:
            logging.warning(f"⚠️ [pending] {channel_id} 無 all_range，無法加入快取")
            return

        matrix = all_range.get("matrix", {})
        active_time, total_count = convert_matrix_to_count(matrix)

        # 🔍 Step 2: 查找 metadata
        metadata_lookup = build_channel_metadata_lookup(db)
        meta = metadata_lookup.get(channel_id)
        if not meta:
            logging.warning(f"⚠️ [pending] 找不到 {channel_id} 的 metadata，略過")
            return

        # 🔃 Step 3: Transaction 內讀取 pending → 去重 → 寫回
        pending_ref = db.collection("stats_cache").document("active_time_pending")
        new_entry = {
            "channelId": channel_id,
            "name": meta.get("name"),
            "thumbnail": meta.get("thumbnail"),
            "countryCode": meta.get("countryCode"),
            "activeTime": active_time,
            "totalCount": total_count,
        }

        @firestore.transactional
        def _append_in_transaction(transaction):
            pending_doc = pending_ref.get(transaction=transaction)
            pending_data = pending_doc.to_dict() if pending_doc.exists else {}  # type: ignore[union-attr]
            current_channels = pending_data.get("channels", [])  # type: ignore[union-attr]

            filtered = [c for c in current_channels if c.get("channelId") != channel_id]
            filtered.append(new_entry)

            transaction.set(pending_ref, {"channels": filtered})
            return len(filtered)

        transaction = db.transaction()
        count = _append_in_transaction(transaction)
        logging.info(
            f"🟣 [pending] 已將 {channel_id} 加入 active_time_pending 快取（共 {count} 筆）"
        )

    except GoogleAPIError as e:
        logging.error(f"🔥 寫入 active_time_pending 快取失敗：{e}")
