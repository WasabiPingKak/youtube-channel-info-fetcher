"""使用者設定與分類設定相關的 request schema"""

from pydantic import Field, field_validator

from schemas.common import ChannelIdBody, ChannelIdField


class UpdateSettingsRequest(ChannelIdField):
    """POST /api/my-settings/update"""

    enabled: bool | None = None
    countryCode: list[str] | None = None
    show_live_status: bool = True

    @field_validator("countryCode")
    @classmethod
    def truncate_country_code(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            return v[:10]
        return v


class SaveAndApplyRequest(ChannelIdBody):
    """POST /api/categories/save-and-apply"""

    settings: dict = Field(...)

    @field_validator("settings")
    @classmethod
    def settings_must_be_non_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("settings 不可為空")
        return v


class LoadSettingsRequest(ChannelIdBody):
    """POST /api/firestore/load-category-settings"""

    init_default: bool = False
