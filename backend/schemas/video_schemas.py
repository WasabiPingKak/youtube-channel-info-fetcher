"""影片相關 API 的 request schema 定義"""

from datetime import datetime

from pydantic import Field

from schemas.common import ChannelIdBody, ChannelIdField


class ClassifiedVideoRequest(ChannelIdBody):
    """POST /api/videos/classified 的請求 body"""

    only_settings: bool = False
    start: datetime | None = None
    end: datetime | None = None


class VideoUpdateRequest(ChannelIdField):
    """POST /api/videos/update"""

    updateToken: str = Field(min_length=1)
