import logging

DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

def convert_matrix_to_count(matrix):
    """
    將 Firestore heatmap matrix 結構從影片 ID 陣列轉為 count 統計結構

    參數:
        matrix: dict[day] -> dict[hour] -> list[str]（影片 ID 陣列）

    回傳:
        (active_time_dict, total_count)
        - active_time_dict: dict[day] -> dict[hour] -> int（影片數）
        - total_count: int（所有格子影片數加總）
    """
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
