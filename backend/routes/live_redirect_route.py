from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
from datetime import datetime, timedelta, timezone
import logging
from services.live_redirect.notify_queue_reader import get_pending_video_ids
from services.live_redirect.cache_updater import process_video_ids

live_redirect_bp = Blueprint("live_redirect", __name__)

def init_live_redirect_route(app, db: Client):
    @live_redirect_bp.route("/api/live-redirect/cache", methods=["GET"])
    def get_live_redirect_cache():
        try:
            force = request.args.get("force", "false").lower() == "true"
            now = datetime.now(timezone.utc)

            # 🔍 檢查是否已有新鮮快取
            cached = check_and_return_fresh_cache(db, now, force)
            if cached is not None:
                return jsonify(cached)

            # 📥 取得待處理影片清單（從 notify queue 取出未處理的 videoId）
            pending_videos = get_pending_video_ids(db, force=force, now=now)
            logging.info(f"📌 待處理影片數量：{len(pending_videos)}")

            # 🔄 更新快取資料與回寫 processedAt
            result = process_video_ids(db, pending_videos, now)
            logging.info(f"✅ 快取重建完成，共 {len(result['channels'])} 筆資料")

            return jsonify(result)

        except Exception:
            logging.exception("🔥 /api/live-redirect/cache 快取流程失敗")
            return jsonify({"error": "Internal Server Error"}), 500

    app.register_blueprint(live_redirect_bp)


def check_and_return_fresh_cache(db: Client, now: datetime, force: bool) -> dict | None:
    """
    檢查今天的快取是否仍在有效時間內（5 分鐘），若是則直接回傳，不執行更新流程。

    Args:
        db (Client): Firestore 實例
        now (datetime): 當前 UTC 時間
        force (bool): 是否強制刷新快取

    Returns:
        dict | None: 若快取有效則回傳快取內容，否則回傳 None 表示需要重建
    """
    today_str = now.date().isoformat()
    cache_ref = db.collection("live_redirect_cache").document(today_str)
    today_cache = cache_ref.get().to_dict() or {}

    updated_at_str = today_cache.get("updatedAt")
    if updated_at_str:
        try:
            updated_at = datetime.fromisoformat(updated_at_str)
            if not force and now - updated_at < timedelta(minutes=5):
                logging.info("♻️ 快取尚新（5 分鐘內），直接回傳")
                return today_cache
        except Exception as e:
            logging.warning(f"⚠️ 快取時間格式錯誤：{updated_at_str} / error={e}")

    return None
