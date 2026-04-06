"""管理員與內部 API 的 request schema"""

from enum import StrEnum

from pydantic import BaseModel, Field, field_validator

from utils.channel_validator import is_valid_channel_id


class _TargetChannelMixin(BaseModel):
    """共用的 target_channel_id 驗證"""

    target_channel_id: str = Field(min_length=1)

    @field_validator("target_channel_id")
    @classmethod
    def validate_channel_id(cls, v: str) -> str:
        if not is_valid_channel_id(v):
            raise ValueError("target_channel_id 格式不合法")
        return v


class AdminInitRequest(_TargetChannelMixin):
    """POST /api/admin/initialize_channel"""


class AdminRevokeRequest(_TargetChannelMixin):
    """POST /api/admin/revoke"""


class BuildTrendingRequest(BaseModel):
    """POST /api/internal/build-daily-trending"""

    startDate: str | None = None
    days: int = Field(default=1, gt=0)
    force: bool = False


class RefreshCacheRequest(BaseModel):
    """POST /api/internal/refresh-daily-cache"""

    limit: int | None = None
    include_recent: bool = False
    dry_run: bool = False
    full_scan: bool = False
    force_category_counts: bool = False
    channel_ids: list[str] | None = Field(default=None, description="指定要刷新的頻道 ID 列表")

    @field_validator("channel_ids")
    @classmethod
    def validate_channel_ids(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        for cid in v:
            if not is_valid_channel_id(cid):
                raise ValueError(f"頻道 ID 格式不合法：{cid}")
        return v


class MaintenanceMode(StrEnum):
    DRY_RUN = "dry-run"
    EXECUTE = "execute"


class MaintenanceRequest(BaseModel):
    """POST /api/maintenance/clean-*"""

    mode: MaintenanceMode
