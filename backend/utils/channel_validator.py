import re

# YouTube channel ID 格式：UC 開頭 + 22 個 base64 字元（共 24 字元）
_CHANNEL_ID_PATTERN = re.compile(r"^UC[\w-]{22}$")


def is_valid_channel_id(channel_id: str) -> bool:
    """驗證 YouTube channel ID 格式是否合法"""
    return bool(channel_id and isinstance(channel_id, str) and _CHANNEL_ID_PATTERN.match(channel_id))
