"""批次取得頻道資訊的 request schema"""

from pydantic import BaseModel, Field, field_validator

from utils.channel_validator import is_valid_channel_id


class ChannelInfoBatchRequest(BaseModel):
    """POST /api/channels/info/batch"""

    channel_ids: list[str] = Field(min_length=1, max_length=50)

    @field_validator("channel_ids")
    @classmethod
    def validate_channel_ids(cls, v: list[str]) -> list[str]:
        for cid in v:
            if not is_valid_channel_id(cid):
                raise ValueError(f"channel_id 格式不合法: {cid}")
        return v
