import logging
from datetime import UTC, datetime, timedelta, timezone

tz_taiwan = timezone(timedelta(hours=8))


def get_taiwan_datetime_from_publish(video):
    """
    從影片的 publishDate 取得正確的台灣時區上片時間
    """
    publish_str = video.get("publishDate")

    if not publish_str:
        raise ValueError("影片缺少 publishDate")

    try:
        publish_dt = datetime.fromisoformat(publish_str)
        logging.debug(f"🕒 解析 publishDate 成功（含時區）：{publish_dt.isoformat()}")
    except ValueError:
        try:
            publish_dt = datetime.strptime(publish_str, "%Y-%m-%dT%H:%M:%SZ")
            publish_dt = publish_dt.replace(tzinfo=UTC)
            logging.debug(f"🕒 解析 publishDate（Z 格式）成功：{publish_dt.isoformat()}")
        except Exception as e:
            logging.warning(f"❗ 無法解析 publishDate：{publish_str}，錯誤：{e}")
            raise

    local_dt = publish_dt.astimezone(tz_taiwan)
    logging.debug(f"📅 最終上片時間（台灣）：{local_dt.isoformat()}")
    return local_dt


def is_within_last_7_days(dt):
    """
    判斷給定的 datetime 是否在「現在時間起算的 7 天內」（台灣時間內）
    用於決定是否重跑統計分析
    """
    now = datetime.now(tz_taiwan)
    seven_days_ago = now - timedelta(days=7)
    in_range = seven_days_ago <= dt <= now
    logging.debug(f"📆 檢查 {dt.isoformat()} 是否在最近 7 天內：{in_range}")
    return in_range
