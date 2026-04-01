"""頻道索引查詢服務"""

import logging
from datetime import datetime

from dateutil import parser as date_parser
from google.cloud import firestore

logger = logging.getLogger(__name__)


def try_parse_date(val):
    """統一解析 joinedAt 為 date 物件，錯誤時回傳 None"""
    if isinstance(val, datetime):
        return val.date()
    elif isinstance(val, str):
        try:
            return date_parser.isoparse(val).date()
        except Exception:
            return None
    return None


def get_all_enabled_channels_data(db: firestore.Client) -> dict:
    """取得所有啟用頻道清單、新加入頻道、以及總註冊數。

    Returns:
        {
            "channels": [...],
            "newly_joined_channels": [...],
            "total_registered_count": int,
        }
    """
    # 讀取同步資料（channel_id → lastVideoSyncAt）
    sync_ref = db.collection("channel_sync_index").document("index_list")
    sync_doc = sync_ref.get()
    sync_map = {}

    if sync_doc.exists:  # type: ignore[reportAttributeAccessIssue]
        sync_list = sync_doc.to_dict().get("channels", [])  # type: ignore[reportOptionalMemberAccess]
        for item in sync_list:
            cid = item.get("channel_id")
            sync_time = item.get("lastVideoSyncAt")
            if cid and sync_time:
                sync_map[cid] = sync_time

    # 讀取所有 batch
    root_ref = db.collection("channel_index_batch")
    docs = root_ref.stream()

    all_channels = []
    joined_at_dates = []
    total_registered_count = 0

    for doc in docs:
        data = doc.to_dict() or {}
        batch_channels = data.get("channels", [])
        for entry in batch_channels:
            total_registered_count += 1
            if entry.get("enabled") is not True:
                continue

            channel_id = entry.get("channel_id")
            joined_at = entry.get("joinedAt")
            parsed_date = try_parse_date(joined_at)

            if parsed_date:
                joined_at_dates.append(parsed_date)

            all_channels.append(
                {
                    "channel_id": channel_id,
                    "name": entry.get("name"),
                    "url": entry.get("url"),
                    "thumbnail": entry.get("thumbnail"),
                    "priority": entry.get("priority", 0),
                    "joinedAt": joined_at,
                    "countryCode": entry.get("countryCode", []),
                    "enabled": entry.get("enabled", True),
                    "lastVideoUploadedAt": sync_map.get(channel_id),
                    "active_time_all": entry.get("active_time_all"),
                    "category_counts": entry.get("category_counts"),
                }
            )

    # 排序所有資料
    sorted_channels = sorted(all_channels, key=lambda c: (-c["priority"], c["name"]))

    # 找出最近的三個日期
    unique_dates = sorted(set(joined_at_dates), reverse=True)
    recent_dates = set(unique_dates[:3])

    # 篩出最近三天加入的頻道
    newly_joined_channels = [
        ch
        for ch in sorted_channels
        if ch.get("joinedAt") and try_parse_date(ch["joinedAt"]) in recent_dates
    ]

    return {
        "channels": sorted_channels,
        "newly_joined_channels": newly_joined_channels,
        "total_registered_count": total_registered_count,
    }
