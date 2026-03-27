import logging
import re

from google.api_core.exceptions import GoogleAPIError


def load_all_channels_from_index_list(db):
    try:
        ref = db.collection("channel_sync_index").document("index_list")
        doc = ref.get()
        if not doc.exists:
            logging.warning("⚠️ index_list 文件不存在")
            return []

        data = doc.to_dict()
        channels = data.get("channels", [])
        logging.info(f"📥 從 index_list 載入 {len(channels)} 個頻道")
        return channels

    except GoogleAPIError as e:
        logging.error(f"🔥 無法讀取 channel_sync_index/index_list：{e}")
        return []


def load_videos_for_channel(db, channel_id):
    try:
        collection_ref = db.collection(f"channel_data/{channel_id}/videos_batch")
        batch_docs = collection_ref.stream()

        batch_list = []
        for doc in batch_docs:
            match = re.match(r"batch_(\d+)", doc.id)
            if match:
                batch_num = int(match.group(1))
                batch_list.append((batch_num, doc))

        if not batch_list:
            logging.warning(f"⚠️ 找不到 {channel_id} 的任何 batch 資料")
            return []

        # 排序 batch（由小到大）
        batch_list.sort(key=lambda x: x[0])
        logging.info(f"📦 {channel_id} 共找到 {len(batch_list)} 個 batch，開始載入所有影片")

        all_videos = []
        for batch_num, batch_doc in batch_list:
            data = batch_doc.to_dict()
            videos = data.get("videos", [])
            all_videos.extend(videos)
            logging.info(f"📄 batch_{batch_num} 含 {len(videos)} 部影片")

        logging.info(f"🎞️ {channel_id} 最終統計影片數量：{len(all_videos)}")
        return all_videos

    except GoogleAPIError as e:
        logging.error(f"🔥 無法讀取 {channel_id} 的影片資料：{e}")
        return []
