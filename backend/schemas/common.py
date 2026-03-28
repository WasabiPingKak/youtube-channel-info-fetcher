"""共用 Pydantic 驗證元件"""

from pydantic import BaseModel, Field, field_validator

from utils.channel_validator import is_valid_channel_id


class ChannelIdBody(BaseModel):
    """JSON body 中包含 channel_id 欄位的基礎 schema"""

    channel_id: str = Field(min_length=1)

    @field_validator("channel_id")
    @classmethod
    def validate_channel_id(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("channel_id 格式不合法")
        return v


class ChannelIdField(BaseModel):
    """JSON body 中包含 channelId 欄位的基礎 schema（前端慣用 camelCase）"""

    channelId: str = Field(min_length=1)

    @field_validator("channelId")
    @classmethod
    def validate_channel_id(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("channelId 格式不合法")
        return v
