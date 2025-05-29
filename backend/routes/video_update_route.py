from flask import request, jsonify
from services.firestore.batch_writer import write_batches_to_firestore
from services.firestore.sync_time_index import get_last_video_sync_time, update_last_sync_time
from services.youtube.fetcher import get_video_data
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

def init_video_update_route(app, db):
    @app.route("/api/videos/update", methods=["POST"])
    def update_video_data():
        try:
            data = request.get_json()
            channel_id = data.get("channelId")
            update_token = data.get("updateToken")

            if not channel_id or not update_token:
                return jsonify({"error": "channelId 與 updateToken 為必填"}), 400

            # 讀取 Firestore 中儲存的 token
            token_ref = db.document(f"channel_data/{channel_id}/channel_info/update_token")
            token_doc = token_ref.get()

            if not token_doc.exists:
                return jsonify({"error": "Token 不存在或已使用"}), 403

            token_data = token_doc.to_dict()
            stored_token = token_data.get("token")
            expires_at = token_data.get("expiresAt")

            if not stored_token or stored_token != update_token:
                return jsonify({"error": "Token 驗證失敗"}), 403

            now = datetime.now(timezone.utc)
            if not expires_at or datetime.fromisoformat(expires_at) < now:
                return jsonify({"error": "Token 已過期"}), 403

            # ✅ 驗證成功，開始匯入影片
            logger.info(f"📦 [update] Token 驗證成功，開始同步頻道 {channel_id} 的影片")

            last_sync_time = get_last_video_sync_time(db, channel_id)
            safe_sync_time = last_sync_time + timedelta(seconds=1) if last_sync_time else None
            now = datetime.now(timezone.utc)
            date_ranges = [(safe_sync_time, now)] if safe_sync_time else None

            videos = get_video_data(date_ranges=date_ranges, input_channel=channel_id)
            if not videos:
                logger.info("📭 無新影片")
            else:
                write_result = write_batches_to_firestore(db, channel_id, videos)
                update_last_sync_time(db, channel_id, videos)
                logger.info(f"✅ 成功寫入 {write_result.get('videos_written', 0)} 部影片")

            # 刪除 token（一次性使用）
            token_ref.delete()

            return jsonify({"message": "更新完成"})

        except Exception as e:
            logger.exception("🔥 /api/videos/update 發生錯誤")
            return jsonify({
                "error": "更新失敗",
                "details": str(e)
            }), 500