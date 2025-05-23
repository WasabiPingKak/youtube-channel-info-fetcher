from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
import logging
from datetime import datetime, timezone, timedelta

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

            # 🟡 預設為昨天
            start_date = data.get("startDate")
            if not start_date:
                start_date = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

            days = int(data.get("days", 1))
            force = bool(data.get("force", False))

            if days <= 0:
                return jsonify({"error": "days 參數必須為正整數"}), 400

            logger.info(f"🚀 開始處理 build_daily_trending | start={start_date} | days={days} | force={force}")
            result = build_trending_for_date_range(start_date, days, db, force=force)
            return jsonify(result)

        except Exception as e:
            logger.error("❌ /build-daily-trending 發生錯誤", exc_info=True)
            return jsonify({"error": str(e)}), 500

    @bp.route("/refresh-daily-cache", methods=["POST"])
    def refresh_daily_cache_api():
        try:
            data = request.get_json(force=True)

            # 🔹 limit：最多要同步幾個頻道
            limit = int(data.get("limit", DEFAULT_REFRESH_LIMIT))

            # 🔹 include_recent：是否包含最近 2 天內已檢查的頻道，預設 False（會略過）
            include_recent = bool(data.get("include_recent", False))

            # 🔹 dry_run：是否為模擬模式
            dry_run = bool(data.get("dry_run", False))

            # 🔹 full_scan：是否完整抓取整份播放清單（否則只抓最近兩頁）
            full_scan = bool(data.get("full_scan", False))

            logger.info(f"🌀 啟動每日快取刷新任務 | limit={limit} | include_recent={include_recent} | dry_run={dry_run} | full_scan={full_scan}")
            result = run_daily_channel_refresh(
                db,
                limit=limit,
                include_recent=include_recent,
                dry_run=dry_run,
                full_scan=full_scan
            )
            return jsonify(result)

        except Exception as e:
            logger.error("❌ /refresh-daily-cache 發生錯誤", exc_info=True)
            return jsonify({"error": str(e)}), 500

    app.register_blueprint(bp)
