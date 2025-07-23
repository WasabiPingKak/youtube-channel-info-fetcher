from typing import List, Dict
from datetime import datetime, timezone

CATEGORY_MAPPING = {
    "雜談": "talk",
    "遊戲": "game",
    "音樂": "music",
    "節目": "show",
}

def count_category_counts(videos: List[Dict]) -> Dict[str, int]:
    """
    接收經 get_classified_videos() 處理過的影片清單，
    回傳符合 Firestore 儲存結構的 category_counts 統計結果。
    """
    counts = {
        "talk": 0,
        "game": 0,
        "music": 0,
        "show": 0,
        "all": 0,
    }

    for video in videos:
        matched = video.get("matchedCategories", [])
        if not isinstance(matched, list):
            continue

        # 只算一次 all（無論有無分類）
        counts["all"] += 1

        # 紀錄本影片已算過的分類，避免重複加總
        already_counted = set()

        for cat in matched:
            key = CATEGORY_MAPPING.get(cat)
            if key and key not in already_counted:
                counts[key] += 1
                already_counted.add(key)

    # 加入更新時間
    counts["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return counts
