# services/live_redirect/cache_updater.py

import logging
from datetime import datetime, timedelta

from google.cloud import firestore
from google.cloud.firestore import Client

from services.classified_video_fetcher import classify_live_title
from services.live_redirect.fallback_builder import build_fallback_entry
from services.live_redirect.video_classifier import classify_video
from services.live_redirect.youtube_api import batch_fetch_video_details

logger = logging.getLogger(__name__)


def _mark_processed_in_transaction(db: Client, date_str: str, processed_ids: set, now: datetime):
    """以 Transaction 標記 notify queue 中已處理的影片，避免覆蓋同時寫入的新 WebSub 通知"""
    ref = db.collection("live_redirect_notify_queue").document(date_str)

    @firestore.transactional
    def _txn(transaction):
        doc = ref.get(transaction=transaction)
        data = doc.to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
        new_list = []
        for v in data.get("videos", []):
            if v.get("videoId") in processed_ids:
                v["processedAt"] = now.isoformat()
            new_list.append(v)
        transaction.set(ref, {"updatedAt": now.isoformat(), "videos": new_list})

    transaction = db.transaction()
    _txn(transaction)


def process_video_ids(db: Client, notify_videos: list[dict], now: datetime) -> dict:
    today_str = now.date().isoformat()
    yesterday_str = (now - timedelta(days=1)).date().isoformat()

    # 🔹 Step 1：載入昨天與今天的快取
    today_cache = db.collection("live_redirect_cache").document(today_str).get().to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
    yesterday_cache = (
        db.collection("live_redirect_cache").document(yesterday_str).get().to_dict() or {}  # type: ignore[reportAttributeAccessIssue]
    )
    raw_old_channels = today_cache.get("channels", []) + yesterday_cache.get("channels", [])

    # 🧹 過濾已收播超過 retention_days 的舊資料
    retention_days = 3
    old_channels = []
    for c in raw_old_channels:
        end_time = c.get("live", {}).get("endTime")
        if not end_time:
            old_channels.append(c)
        else:
            try:
                end_dt = datetime.fromisoformat(end_time)
                if end_dt >= now - timedelta(days=retention_days):
                    old_channels.append(c)
                else:
                    logging.info(
                        f"🧹 清除過期直播：{c['live'].get('videoId')}（endTime={end_time}）"
                    )
            except ValueError as e:
                logging.warning(
                    f"⚠️ 解析 endTime 失敗：{c['live'].get('videoId')} / {end_time} / error={e}"
                )

    cached_map = {c["live"]["videoId"]: c for c in old_channels}
    end_recorded = {vid for vid, c in cached_map.items() if c["live"].get("endTime")}

    # 🔍 Step 2：決定要查詢的 videoIds
    notify_ids = {v["videoId"]: v for v in notify_videos if v.get("videoId")}
    logging.info(f"📥 從 notify queue 收到影片 ID：{list(notify_ids.keys())}")
    query_ids = _filter_video_ids_to_query(notify_ids, cached_map, end_recorded, now)

    logging.info(f"📤 需要查詢 API 的影片數：{len(query_ids)}")
    logging.info(f"📋 API 查詢影片ID列表：{query_ids}")

    # 🔹 Step 3：查詢 YouTube API
    yt_items = batch_fetch_video_details(query_ids)
    yt_map = {item["id"]: item for item in yt_items}

    output_channels = []
    processed_ids = set()

    # 🧪 Step 4：分類器 + fallback
    for video_id in query_ids:
        item = yt_map.get(video_id)

        if item:
            result = classify_video(db, item, now)
            if result:
                channel_id = result.get("channelId") or result.get("channel_id")
                title = result.get("live", {}).get("title", "")

                if not channel_id:
                    logging.warning(f"⚠️ 無法分類影片 {video_id}：缺少 channelId")
                elif not title:
                    logging.warning(f"⚠️ 無法分類影片 {video_id}：缺少標題")
                else:
                    category = classify_live_title(db, channel_id, title)
                    result["live"]["category"] = category
                    logging.info(
                        f'🧩 已分類：videoId={video_id}, channelId={channel_id}, title="{title}", '
                        f"category={category.get('matchedCategories')}, pairs={category.get('matchedPairs')}"
                    )

                output_channels.append(result)
                processed_ids.add(video_id)

        else:
            logging.warning(f"❌ 查不到影片資料，fallback：{video_id}")
            fallback = build_fallback_entry(video_id, now)
            output_channels.append(fallback)
            processed_ids.add(video_id)

    # 📦 Step 5：合併快取，已處理者優先，避免重複
    merged_map = {c["live"]["videoId"]: c for c in output_channels}
    for c in old_channels:
        vid = c["live"]["videoId"]
        if vid not in merged_map:
            merged_map[vid] = c
    output_channels = list(merged_map.values())

    # 📝 回寫 notify queue 的 processedAt（Transaction 避免覆蓋新進的 WebSub 通知）
    for date_str in [yesterday_str, today_str]:
        _mark_processed_in_transaction(db, date_str, processed_ids, now)

    # 🕒 懶更新機制：補查快取中未收播的影片
    lazy_result = _lazy_refresh_endtime(db, old_channels, cached_map, end_recorded, now)
    lazy_channels = lazy_result["channels"]
    processed_ids.update([c["live"]["videoId"] for c in lazy_channels])

    # 合併原本與懶更新的快取結果（以懶更新為主）
    output_channels = list(
        {c["live"]["videoId"]: c for c in (output_channels + lazy_channels)}.values()
    )

    # 🎯 後補分類：針對尚未分類的影片補上 live.category
    for channel in output_channels:
        live = channel.get("live", {})
        if "category" not in live:
            channel_id = channel.get("channelId") or channel.get("channel_id")
            title = live.get("title", "")
            if channel_id and title:
                category = classify_live_title(db, channel_id, title)
                live["category"] = category
                logging.info(
                    f"📌 後補分類：videoId={live.get('videoId')}, channelId={channel_id}, "
                    f"category={category.get('matchedCategories')}, pairs={category.get('matchedPairs')}"
                )

    db.collection("live_redirect_cache").document(today_str).set(
        {"updatedAt": now.isoformat(), "channels": output_channels}
    )

    return {"updatedAt": now.isoformat(), "channels": output_channels}


def _filter_video_ids_to_query(
    notify_ids: dict[str, dict],
    cached_map: dict[str, dict],
    end_recorded: set[str],
    now: datetime,
) -> list[str]:
    """
    決定需要送到 YouTube API 查詢的 videoId 清單。

    過濾條件：
    - 排除已收播影片（endTime 存在）
    - 排除快取中「預約時間晚於 now + 15 分鐘」的直播

    Args:
        notify_ids: 來自 notify queue 的 videoId 對應 dict
        cached_map: 快取中的影片資料 (videoId → channel dict)
        end_recorded: 已收播的 videoId 集合
        now: 當前時間

    Returns:
        list[str]: 需要查詢的 videoIds
    """
    # 🔍 額外列出 cached_map 中 endTime 為 null 的影片
    no_endtime_ids = [vid for vid, c in cached_map.items() if not c.get("live", {}).get("endTime")]
    logging.info(f"🔄 快取中尚未收播的影片 ID：{no_endtime_ids}")

    result = []

    for vid, _v in notify_ids.items():
        if vid in end_recorded:
            logging.info(f"✅ 已收播影片略過：{vid}")
            continue

        cache = cached_map.get(vid)
        if cache:
            live = cache.get("live", {})
            scheduled = live.get("startTime")
            is_upcoming = live.get("isUpcoming")

            if is_upcoming and scheduled:
                try:
                    start_time = datetime.fromisoformat(scheduled)
                    if start_time > now + timedelta(minutes=15):
                        # 預約影片時間超過 15 分鐘
                        continue
                except ValueError as e:
                    logging.warning(f"⚠️ 解析 startTime 失敗：{vid} / {scheduled} / error={e}")
        else:
            logging.info(f"🆕 全新影片，無快取紀錄：{vid}")

        result.append(vid)

    logging.info(f"✅ 最終送出查詢的影片 ID：{result}")
    return result


def _lazy_refresh_endtime(
    db: Client,
    old_channels: list[dict],
    cached_map: dict[str, dict],
    end_recorded: set[str],
    now: datetime,
) -> dict:
    """
    嘗試補查快取中尚未收播的影片，補上 endTime。

    Args:
        db: Firestore 資料庫
        old_channels: 現有快取中的所有影片資料
        cached_map: 快取影片 map（videoId → channel）
        end_recorded: 已收播的影片 ID 集合
        now: 當前時間

    Returns:
        dict: {"channels": [...]} 補完後的影片列表
    """
    # 找出快取中 endTime 為 null 的影片
    pending_ids = [c["live"]["videoId"] for c in old_channels if not c["live"].get("endTime")]

    logging.info(f"🕒 懶更新：發現快取中尚未收播影片 {len(pending_ids)} 支，準備查詢")

    # 使用與主流程相同的查詢邏輯與分類器
    notify_items = {vid: {"videoId": vid} for vid in pending_ids}
    query_ids = _filter_video_ids_to_query(notify_items, cached_map, end_recorded, now)

    yt_items = batch_fetch_video_details(query_ids)
    yt_map = {item["id"]: item for item in yt_items}

    refreshed_channels = []

    for video_id in query_ids:
        item = yt_map.get(video_id)
        if item:
            result = classify_video(db, item, now)
            if result:
                refreshed_channels.append(result)
        else:
            logging.warning(f"❌ 懶更新：查無影片資料 fallback：{video_id}")
            fallback = build_fallback_entry(video_id, now)
            refreshed_channels.append(fallback)

    video_ids = [c["live"]["videoId"] for c in refreshed_channels]
    logging.info(f"✅ 懶更新完成，共寫入 {len(refreshed_channels)} 筆，videoIds={video_ids}")

    return {"channels": refreshed_channels}
