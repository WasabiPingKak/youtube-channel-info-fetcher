import json
import logging
from datetime import UTC, datetime

from google.api_core.exceptions import GoogleAPIError
from google.cloud import firestore


def is_channel_heatmap_initialized(db: firestore.Client, channel_id: str) -> bool:
    """
    檢查頻道 heat_map 是否已初始化（即是否含有 all_range 欄位）

    參數:
        db: Firestore client 實體
        channel_id: 頻道 ID

    回傳:
        True 表示已初始化（已存在 all_range 欄位）
        False 表示未初始化或讀取失敗
    """
    try:
        doc_ref = db.document(f"channel_data/{channel_id}/heat_map/channel_video_heatmap")
        doc = doc_ref.get()
        if doc.exists:  # type: ignore[reportAttributeAccessIssue]
            is_initialized = "all_range" in (doc.to_dict() or {})  # type: ignore[reportAttributeAccessIssue]
            if not is_initialized:
                logging.info(f"🆕 頻道 {channel_id} 尚未初始化 heatmap（無 all_range）")
            return is_initialized
        else:
            logging.info(f"🆕 頻道 {channel_id} heatmap 文件不存在（尚未初始化）")
            return False
    except GoogleAPIError as e:
        logging.error(f"❗ 檢查 heatmap 初始化狀態失敗：{channel_id} - {e}")
        return False


def convert_to_nested_map(matrix):
    """
    將 matrix 由 map<string, list<list<string>>> 轉為 map<string, map<string, list<string>>>
    Firestore 不接受 array of array，但接受 map of map
    """
    return {
        day: {str(hour): hour_list for hour, hour_list in enumerate(hour_lists)}
        for day, hour_lists in matrix.items()
    }


def write_channel_heatmap_result(
    db,
    channel_id,
    full_matrix=None,
    full_count=None,
    slot_counter=None,  # 仍保留此參數供其他模組使用（但本函式中不處理）
):
    try:
        # 將 path 修正為合法的 4 段（collection/document/collection/document）
        doc_ref = db.document(f"channel_data/{channel_id}/heat_map/channel_video_heatmap")
        update_data = {}
        now = datetime.now(UTC)

        if full_matrix is not None and full_count is not None:
            update_data = {
                "all_range": {  # ✅ 改為欄位 key，而非 Firestore path
                    "matrix": convert_to_nested_map(full_matrix),
                    "totalCount": full_count,
                    "updatedAt": now,
                }
            }
            logging.debug(f"📦 準備寫入 all_range：影片數={full_count}")

        if not update_data:
            logging.warning(f"⚠️ 沒有資料需要寫入：{channel_id}")
            return

        # 印出寫入前的內容（轉字串以避免 datetime 無法序列化）
        serialized = {
            k: (
                {
                    sub_k: (str(sub_v) if isinstance(sub_v, datetime) else sub_v)
                    for sub_k, sub_v in v.items()
                }
                if isinstance(v, dict)
                else v
            )
            for k, v in update_data.items()
        }
        logging.debug(
            f"📤 寫入前資料內容（{channel_id}）：\n{json.dumps(serialized, ensure_ascii=False, indent=2)}"
        )

        # 覆蓋寫入整個 document
        doc_ref.set(update_data)
        logging.info(f"✅ 寫入成功：{channel_id}（欄位數：{len(update_data)}）")

    except GoogleAPIError as e:
        logging.error(f"🔥 寫入 {channel_id} 統計資料失敗：{e}")
