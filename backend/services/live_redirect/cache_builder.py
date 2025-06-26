import logging
import os
import requests
from datetime import datetime, timedelta
from google.cloud.firestore import Client

YOUTUBE_API_KEY = os.getenv("API_KEY")
YOUTUBE_API = "https://www.googleapis.com/youtube/v3/videos"
CHANNEL_INDEX_COLLECTION = "channel_index"

def filter_video_ids(videos: list, skip_if_processed: bool) -> list[str]:
    video_map = {}
    for v in videos:
        vid = v.get("videoId")
        if not vid:
            continue
        if skip_if_processed and v.get("processedAt"):
            continue
        video_map[vid] = v
    logging.info(f"🎯 篩選後剩下 {len(video_map)} 支影片待處理")
    return list(video_map.keys())


def batch_fetch_video_details(video_ids: list[str]) -> list[dict]:
    results = []
    for i in range(0, len(video_ids), 50):
        batch_ids = video_ids[i:i + 50]
        params = {
            "part": "snippet,liveStreamingDetails",
            "id": ",".join(batch_ids),
            "key": YOUTUBE_API_KEY
        }

        logging.info(f"🌐 查詢 YouTube API，videoIds={batch_ids}")

        try:
            yt_resp = requests.get(YOUTUBE_API, params=params)
            yt_resp.raise_for_status()
            items = yt_resp.json().get("items", [])
            results.extend(items)
            logging.info(f"📦 取得影片資訊：{len(items)} / {len(batch_ids)} 筆")
        except Exception as e:
            logging.warning(f"⚠️ YouTube API 批次查詢失敗：{e}")
            continue

    return results


def parse_video_status(live_details: dict, now: datetime) -> tuple[bool, bool, str | None, bool]:
    actual_start = live_details.get("actualStartTime")
    scheduled_start = live_details.get("scheduledStartTime")
    actual_end = live_details.get("actualEndTime")

    is_live = False
    is_upcoming = False
    is_stale_upcoming = False
    start_time = None

    if actual_end:
        start_time = actual_start or scheduled_start
    else:
        if actual_start and datetime.fromisoformat(actual_start) <= now:
            is_live = True
            start_time = actual_start
        elif scheduled_start:
            sched_time = datetime.fromisoformat(scheduled_start)
            if sched_time <= now + timedelta(minutes=15):
                is_live = True
                is_upcoming = True
                start_time = scheduled_start
                # 新增條件：已超過 scheduledStartTime + 15 分鐘但尚未開播
                if not actual_start and now - sched_time > timedelta(minutes=15):
                    is_stale_upcoming = True

    return is_live, is_upcoming, start_time, is_stale_upcoming


def build_lazy_update_entry(video_id: str, channel_id: str, snippet: dict, live_details: dict,
                            is_upcoming: bool, start_time: str | None, viewers: int, actual_end: str | None) -> dict:
    return {
        "channel_id": channel_id,
        "name": None,
        "thumbnail": None,
        "badge": None,
        "countryCode": [],
        "live": {
            "videoId": video_id,
            "title": snippet.get("title"),
            "startTime": start_time,
            "viewers": viewers,
            "isUpcoming": is_upcoming,
            "endTime": actual_end
        }
    }


def build_channel_cache_entry(db: Client, channel_id: str, video_id: str, snippet: dict,
                              is_upcoming: bool, start_time: str | None, viewers: int, actual_end: str | None) -> dict | None:
    channel_doc = db.collection(CHANNEL_INDEX_COLLECTION).document(channel_id).get()
    if not channel_doc.exists:
        logging.warning(f"❗ 找不到頻道資料：{channel_id}")
        return None
    channel_data = channel_doc.to_dict()
    return {
        "channel_id": channel_id,
        "name": channel_data.get("name"),
        "thumbnail": channel_data.get("thumbnail"),
        "badge": channel_data.get("badge"),
        "countryCode": channel_data.get("countryCode", []),
        "live": {
            "videoId": video_id,
            "title": snippet.get("title"),
            "startTime": start_time,
            "viewers": viewers,
            "isUpcoming": is_upcoming,
            "endTime": actual_end
        }
    }


def build_live_redirect_cache_entries(
    videos: list,
    db: Client,
    now: datetime,
    skip_if_processed: bool = True,
    update_endtime_only: bool = False
) -> tuple[list, list]:
    """
    建立直播快取資料或更新尚未結束直播狀態。

    Args:
        videos (list): 來源影片清單
        db (Client): Firestore 資料庫連線
        now (datetime): 當前 UTC 時間
        skip_if_processed (bool): 是否略過 processedAt 有值的影片（適用於第一次處理）
        update_endtime_only (bool): 是否僅更新 endTime / isUpcoming（適用於懶更新）

    Returns:
        tuple: (output_channels, processed_video_ids)
    """

    video_ids = filter_video_ids(videos, skip_if_processed)
    items = batch_fetch_video_details(video_ids)

    output_channels = []
    processed_video_ids = []

    # 🔸 過濾掉 privacyStatus = unlisted 或 private 的影片
    filtered_items = []
    for item in items:
        privacy_status = item.get("status", {}).get("privacyStatus")
        if privacy_status in ("unlisted", "private"):
            logging.warning(f"🚫 排除隱私影片 {item['id']}：privacyStatus={privacy_status}")
            processed_video_ids.append(item["id"])
            continue
        filtered_items.append(item)

    # 🟢 正常處理可取得資訊的影片
    for item in filtered_items:
        video_id = item["id"]
        snippet = item.get("snippet", {})
        live_details = item.get("liveStreamingDetails", {})
        channel_id = snippet.get("channelId")

        if not live_details:
            logging.info(f"🟡 非直播影片，略過：{video_id}")
            processed_video_ids.append(video_id)
            continue

        is_live, is_upcoming, start_time, is_stale_upcoming = parse_video_status(live_details, now)
        actual_end = live_details.get("actualEndTime")
        viewers = int(live_details.get("concurrentViewers", "0")) if "concurrentViewers" in live_details else 0

        logging.debug(
            f"🧪 判斷影片狀態 - video: {video_id}\n"
            f"  actualStartTime: {live_details.get('actualStartTime')}\n"
            f"  scheduledStartTime: {live_details.get('scheduledStartTime')}\n"
            f"  actualEndTime: {actual_end}\n"
            f"  viewers: {viewers}\n"
            f"  → 判定結果: is_live={is_live}, is_upcoming={is_upcoming}, "
            f"    is_stale_upcoming={is_stale_upcoming}, start_time={start_time}"
        )

        if is_stale_upcoming:
            logging.warning(f"⏰ 排除過期待機室影片：{video_id} / scheduledStartTime={live_details.get('scheduledStartTime')}")
            processed_video_ids.append(video_id)
            continue

        if not is_live and not actual_end:
            continue

        if update_endtime_only:
            cache_item = build_lazy_update_entry(
                video_id, channel_id, snippet, live_details, is_upcoming, start_time, viewers, actual_end
            )
        else:
            cache_item = build_channel_cache_entry(
                db, channel_id, video_id, snippet, is_upcoming, start_time, viewers, actual_end
            )
            if cache_item is None:
                continue

        output_channels.append(cache_item)
        processed_video_ids.append(video_id)
        logging.info(f"✅ 納入快取：{channel_id} / {video_id}")

    # ❗補上查無資料的影片 fallback entry
    fetched_ids = {item["id"] for item in items}
    missing_ids = set(video_ids) - fetched_ids

    for video_id in missing_ids:
        logging.warning(f"❌ 無法存取影片（可能已變私人或被刪除）：{video_id}")
        fallback_entry = {
            "channel_id": None,
            "name": None,
            "thumbnail": None,
            "badge": None,
            "countryCode": [],
            "live": {
                "videoId": video_id,
                "title": None,
                "startTime": None,
                "viewers": 0,
                "isUpcoming": False,
                "endTime": None,
                "isAvailable": False
            }
        }
        output_channels.append(fallback_entry)
        processed_video_ids.append(video_id)

    return output_channels, processed_video_ids
