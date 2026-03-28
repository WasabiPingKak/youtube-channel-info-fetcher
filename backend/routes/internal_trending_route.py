import logging
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from google.cloud.firestore import Client
from pydantic import ValidationError
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
    bp = Blueprint("internal_trending", __name__, url_prefix="/api/internal")

    @bp.route("/build-daily-trending", methods=["POST"])
    @require_admin_key
    def build_daily_trending_api():
        try:
            data = request.get_json(force=True) or {}
            body = BuildTrendingRequest(**data)

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

        except ValidationError:
            raise
        except Exception:
            logger.error("❌ /build-daily-trending 發生未預期錯誤", exc_info=True)
            return jsonify({"error": "伺服器內部錯誤"}), 500

    @bp.route("/refresh-daily-cache", methods=["POST"])
    @require_admin_key
    def refresh_daily_cache_api():
        try:
            data = request.get_json(force=True) or {}
            body = RefreshCacheRequest(**data)

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

        except ValidationError:
            raise
        except Exception:
            logger.error("❌ /refresh-daily-cache 發生未預期錯誤", exc_info=True)
            return jsonify({"error": "伺服器內部錯誤"}), 500

    app.register_blueprint(bp)
