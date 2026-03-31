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


# ── Query Parameter Schemas ──────────────────────────────────────


class ChannelIdQuery(BaseModel):
    """Query string 中包含 channel_id 欄位（snake_case）"""

    channel_id: str = Field(min_length=1)

    @field_validator("channel_id")
    @classmethod
    def validate_channel_id(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("channel_id 格式不合法")
        return v


class ChannelIdCamelQuery(BaseModel):
    """Query string 中包含 channelId 欄位（camelCase，前端慣用）"""

    channelId: str = Field(min_length=1)

    @field_validator("channelId")
    @classmethod
    def validate_channel_id(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("channelId 格式不合法")
        return v


class InitChannelQuery(BaseModel):
    """Query string 中包含 channel 欄位（init-channel 路由專用）"""

    channel: str = Field(min_length=1)

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("channel 格式不合法")
        return v


class LiveRedirectQuery(BaseModel):
    """GET /api/live-redirect/cache 的查詢參數"""

    force: bool = False
    skipCache: bool = False


class TrendingQuery(BaseModel):
    """GET /api/trending-games 的查詢參數"""

    days: int = 30

    @field_validator("days")
    @classmethod
    def validate_days(cls, v: int) -> int:
        if v not in {7, 14, 30}:
            return 30
        return v
