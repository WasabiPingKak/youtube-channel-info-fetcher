import logging
from datetime import datetime, timedelta

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud.firestore import Client
from pytz import timezone

from schemas.admin_schemas import BuildTrendingRequest, RefreshCacheRequest
from services.channel_updater.daily_refresh_service import (
    DEFAULT_REFRESH_LIMIT,
    run_daily_channel_refresh,
)
from services.trending.daily_builder import build_trending_for_date_range
from utils.admin_auth import require_admin_key

logger = logging.getLogger(__name__)


def init_internal_trending_route(app, db: Client):
    bp = APIBlueprint("internal_trending", __name__, url_prefix="/api/internal", tag="Admin")

    @bp.route("/build-daily-trending", methods=["POST"])
    @bp.doc(
        summary="建立每日趨勢資料",
        description="依指定日期區間產生每日遊戲趨勢統計",
        security="BearerAuth",
    )
    @require_admin_key
    @bp.input(BuildTrendingRequest, arg_name="body")
    def build_daily_trending_api(body):
        # 預設為台灣時間的昨天
        start_date = body.startDate
        if not start_date:
            taipei_tz = timezone("Asia/Taipei")
            now_taipei = datetime.now(taipei_tz)
            start_date = (now_taipei - timedelta(days=1)).strftime("%Y-%m-%d")

        logger.info(
            f"🚀 開始處理 build_daily_trending | start={start_date} | days={body.days} | force={body.force}"
        )
        result = build_trending_for_date_range(start_date, body.days, db, force=body.force)
        return jsonify(result)

    @bp.route("/refresh-daily-cache", methods=["POST"])
    @bp.doc(
        summary="刷新每日快取",
        description="執行每日頻道快取刷新任務",
        security="BearerAuth",
    )
    @require_admin_key
    @bp.input(RefreshCacheRequest, arg_name="body")
    def refresh_daily_cache_api(body):
        limit = body.limit if body.limit is not None else DEFAULT_REFRESH_LIMIT

        logger.info(
            f"🌀 啟動每日快取刷新任務 | "
            f"limit={limit} | include_recent={body.include_recent} | "
            f"dry_run={body.dry_run} | full_scan={body.full_scan} | "
            f"force_category_counts={body.force_category_counts}"
        )

        result = run_daily_channel_refresh(
            db,
            limit=limit,
            include_recent=body.include_recent,
            dry_run=body.dry_run,
            full_scan=body.full_scan,
            force_category_counts=body.force_category_counts,
        )
        return jsonify(result)

    app.register_blueprint(bp)
