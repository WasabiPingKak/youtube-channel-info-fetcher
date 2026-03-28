"""分類編輯器相關的 request schema"""

from pydantic import BaseModel, Field

from schemas.common import ChannelIdField


class CategoryTarget(BaseModel):
    """快速分類的目標項目"""

    mainCategory: str = Field(min_length=1)
    subcategoryName: str = Field(min_length=1)


class QuickApplyRequest(ChannelIdField):
    """POST /api/quick-editor/channel-config-apply"""

    keyword: str = Field(min_length=1)
    targets: list[CategoryTarget] = Field(min_length=1)


class QuickRemoveRequest(ChannelIdField):
    """POST /api/quick-editor/channel-config-remove"""

    keyword: str = Field(min_length=1)


class SkipKeywordRequest(ChannelIdField):
    """POST /api/quick-editor/skip-keyword/add 與 /remove 共用"""

    keyword: str = Field(min_length=1)
