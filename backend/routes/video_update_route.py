import hmac
import logging
from datetime import UTC, datetime, timedelta

from apiflask import APIBlueprint
from flask import jsonify
from google.api_core.exceptions import GoogleAPIError

from schemas.video_schemas import VideoUpdateRequest
from services.classified_video_fetcher import get_classified_videos
from services.firestore.batch_writer import write_batches_to_firestore
from services.firestore.category_writer import write_category_counts_to_channel_index_batch
from services.firestore.heatmap_writer import is_channel_heatmap_initialized
from services.firestore.sync_time_index import get_last_video_sync_time, update_last_sync_time
from services.heatmap_analyzer import update_single_channel_heatmap
from services.heatmap_cache_writer import append_to_pending_cache
from services.video_analyzer.category_counter import count_category_counts
from services.youtube.fetcher import get_video_data

logger = logging.getLogger(__name__)

video_update_bp = APIBlueprint("video_update", __name__, tag="Video")


def init_video_update_route(app, db):
    @video_update_bp.route("/api/videos/update", methods=["POST"])
    @video_update_bp.doc(summary="更新頻道影片資料", description="驗證 token 後同步頻道的最新影片")
    @video_update_bp.input(VideoUpdateRequest, arg_name="body")
    def update_video_data(body):
        try:
            # 讀取 Firestore 中儲存的 token
            token_ref = db.document(f"channel_data/{body.channelId}/channel_info/update_token")
            token_doc = token_ref.get()

            if not token_doc.exists:
                return jsonify({"error": "Token 不存在或已使用"}), 403

            token_data = token_doc.to_dict()
            stored_token = token_data.get("token")
            expires_at = token_data.get("expiresAt")

            if not stored_token or not hmac.compare_digest(stored_token, body.updateToken):
                return jsonify({"error": "Token 驗證失敗"}), 403

            now = datetime.now(UTC)
            if not expires_at or datetime.fromisoformat(expires_at) < now:
                return jsonify({"error": "Token 已過期"}), 403

            logger.info(f"📦 [update] Token 驗證成功，開始同步頻道 {body.channelId} 的影片")

            last_sync_time = get_last_video_sync_time(db, body.channelId)
            safe_sync_time = last_sync_time + timedelta(seconds=1) if last_sync_time else None
            now = datetime.now(UTC)
            date_ranges = [(safe_sync_time, now)] if safe_sync_time else None

            videos = get_video_data(date_ranges=date_ranges, input_channel=body.channelId)
            if not videos:
                logger.info("📭 無新影片")
            else:
                write_result = write_batches_to_firestore(db, body.channelId, videos)
                update_last_sync_time(db, body.channelId, videos)

                # Update category_counts（分類快取統計）
                classified = get_classified_videos(db, body.channelId)
                counts = count_category_counts(classified)
                if counts.get("all", 0) > 0:
                    write_category_counts_to_channel_index_batch(db, body.channelId, counts)

                # ✅ 在更新 heatmap 前檢查是否已初始化
                was_initialized = is_channel_heatmap_initialized(db, body.channelId)

                update_single_channel_heatmap(db, body.channelId)
                logger.info(f"✅ 成功寫入 {write_result.get('videos_written', 0)} 部影片")

                # ✅ 若首次初始化則寫入 pending 快取
                if not was_initialized:
                    append_to_pending_cache(db, body.channelId)

            token_ref.delete()

            return jsonify({"message": "更新完成"})

        except GoogleAPIError:
            logger.exception("🔥 Firestore 操作失敗")
            return jsonify({"error": "Firestore 操作失敗"}), 500

        except Exception:
            logger.exception("🔥 /api/videos/update 發生錯誤")
            return jsonify(
                {
                    "error": "更新失敗",
                }
            ), 500

    app.register_blueprint(video_update_bp)
