from typing import Dict, Any, List, Tuple
from google.cloud.firestore import Client
from utils.settings_game_merger import merge_game_categories_with_aliases

def load_channel_settings_and_videos(
    db: Client, active_channels: List[Dict[str, Any]]
) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]]]:
    """
    載入頻道設定與影片，回傳兩個 dict：
    - channel_settings_map[channel_id] = merged_settings
    - channel_videos_map[channel_id] = List of video items
    """
    channel_settings_map = {}
    channel_videos_map = {}

    for channel in active_channels:
        channel_id = channel.get("channel_id")
        if not channel_id:
            continue

        # 設定
        config_doc = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("settings")
            .document("config")
            .get()
        )
        raw_settings = config_doc.to_dict() if config_doc.exists else {}
        merged_settings = merge_game_categories_with_aliases(raw_settings)
        channel_settings_map[channel_id] = merged_settings

        # 影片
        batch_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("videos_batch")
        )
        video_items = []
        for doc in batch_ref.stream():
            video_items.extend(doc.to_dict().get("videos", []))
        channel_videos_map[channel_id] = video_items

    return channel_settings_map, channel_videos_map
