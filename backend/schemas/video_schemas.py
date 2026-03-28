"""影片相關 API 的 request schema 定義"""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from utils.channel_validator import is_valid_channel_id


class ClassifiedVideoRequest(BaseModel):
    """POST /api/videos/classified 的請求 body"""

    channel_id: str = Field(min_length=1)
    only_settings: bool = False
    start: datetime | None = None
    end: datetime | None = None

    @field_validator("channel_id")
    @classmethod
    def validate_channel_id(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("channel_id 格式不合法")
        return v
