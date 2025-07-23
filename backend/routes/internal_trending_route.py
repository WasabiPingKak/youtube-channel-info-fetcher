from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
import logging
from datetime import datetime, timedelta
from pytz import timezone

from services.trending.daily_builder import build_trending_for_date_range
from services.channel_updater.daily_refresh_service import (
    run_daily_channel_refresh,
    DEFAULT_REFRESH_LIMIT
)

logger = logging.getLogger(__name__)

def init_internal_trending_route(app, db: Client):
    bp = Blueprint("internal_trending", __name__, url_prefix="/api/internal")

    @bp.route("/build-daily-trending", methods=["POST"])
    def build_daily_trending_api():
        try:
            data = request.get_json(force=True)
            if data is None:
                raise ValueError("請求缺少 JSON body，或格式不正確")

            # 🟡 預設為台灣時間的昨天
            start_date = data.get("startDate")
            if not start_date:
                taipei_tz = timezone("Asia/Taipei")
                now_taipei = datetime.now(taipei_tz)
                start_date = (now_taipei - timedelta(days=1)).strftime("%Y-%m-%d")

            days = int(data.get("days", 1))
            force = bool(data.get("force", False))

            if days <= 0:
                raise ValueError("days 參數必須為正整數")

            logger.info(f"🚀 開始處理 build_daily_trending | start={start_date} | days={days} | force={force}")
            result = build_trending_for_date_range(start_date, days, db, force=force)
            return jsonify(result)

        except ValueError as e:
            logger.warning(f"⚠️ 參數錯誤: {e}")
            return jsonify({"error": str(e)}), 400

        except Exception as e:
            logger.error("❌ /build-daily-trending 發生未預期錯誤", exc_info=True)
            return jsonify({"error": str(e)}), 500

    @bp.route("/refresh-daily-cache", methods=["POST"])
    def refresh_daily_cache_api():
        try:
            data = request.get_json(force=True)
            if data is None:
                raise ValueError("請求缺少 JSON body，或格式不正確")

            # 🔹 limit：最多要同步幾個頻道
            limit = int(data.get("limit", DEFAULT_REFRESH_LIMIT))

            # 🔹 include_recent：是否包含最近 2 天內已檢查的頻道，預設 False（會略過）
            include_recent = bool(data.get("include_recent", False))

            # 🔹 dry_run：是否為模擬模式
            dry_run = bool(data.get("dry_run", False))

            # 🔹 full_scan：是否完整抓取整份播放清單（否則只抓最近兩頁）
            full_scan = bool(data.get("full_scan", False))

            # 🔹 force_category_counts：是否強制建立分類快取（預設 False）
            force_category_counts = bool(data.get("force_category_counts", False))

            logger.info(
                f"🌀 啟動每日快取刷新任務 | "
                f"limit={limit} | include_recent={include_recent} | "
                f"dry_run={dry_run} | full_scan={full_scan} | "
                f"force_category_counts={force_category_counts}"
            )

            result = run_daily_channel_refresh(
                db,
                limit=limit,
                include_recent=include_recent,
                dry_run=dry_run,
                full_scan=full_scan,
                force_category_counts=force_category_counts
            )
            return jsonify(result)

        except ValueError as e:
            logger.warning(f"⚠️ 參數錯誤: {e}")
            return jsonify({"error": str(e)}), 400

        except Exception as e:
            logger.error("❌ /refresh-daily-cache 發生未預期錯誤", exc_info=True)
            return jsonify({"error": str(e)}), 500

    app.register_blueprint(bp)
