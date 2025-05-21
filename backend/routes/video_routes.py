from flask import Blueprint, request, jsonify
from services.classified_video_fetcher import get_classified_videos
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)
video_bp = Blueprint("video", __name__)

def init_video_routes(app, db):
    @video_bp.route("/api/videos/classified", methods=["POST"])
    def get_classified():
        try:
            data = request.get_json()
            channel_id = data.get("channel_id")
            video_type = data.get("video_type")

            if not channel_id or not video_type:
                return jsonify({"error": "channel_id 與 video_type 為必填"}), 400

            logger.info(f"🔍 取得分類影片清單：{channel_id}, 類型={video_type}")
            result = get_classified_videos(db, channel_id, video_type)

            return jsonify({"videos": result})

        except Exception as e:
            logger.exception("🔥 /api/videos/classified 發生錯誤")
            return jsonify({
                "error": "發生錯誤",
                "details": str(e)
            }), 500

    @video_bp.route("/api/videos/check-update", methods=["GET"])
    def check_update():
        try:
            from services.youtube.fetcher import get_video_data

            channel_id = request.args.get("channelId")
            if not channel_id:
                return jsonify({"error": "Missing channelId"}), 400

            index_ref = db.collection("channel_sync_index").document("index_list")
            doc = index_ref.get()
            now = datetime.now(timezone.utc)

            last_checked_at = None
            last_video_sync_at = None
            should_update = False

            if not doc.exists:
                # 初始化文件 + 該頻道
                videos = get_video_data(input_channel=channel_id)
                latest_sync = max(
                    (datetime.fromisoformat(v["snippet"]["publishedAt"]) for v in videos),
                    default=None
                )
                index_ref.set({
                    "channels": [{
                        "channel_id": channel_id,
                        "lastCheckedAt": now,
                        "lastVideoSyncAt": latest_sync
                    }]
                })
                should_update = True
                last_video_sync_at = latest_sync
            else:
                data = doc.to_dict()
                channels = data.get("channels", [])
                found = False
                for ch in channels:
                    if ch.get("channel_id") == channel_id:
                        last_checked_at = ch.get("lastCheckedAt")
                        last_video_sync_at = ch.get("lastVideoSyncAt")
                        found = True

                        if not last_checked_at:
                            should_update = True
                        else:
                            last_checked_dt = datetime.fromisoformat(last_checked_at)
                            if now - last_checked_dt > timedelta(hours=12):
                                should_update = True

                        if should_update:
                            ch["lastCheckedAt"] = now
                        break

                if not found:
                    videos = get_video_data(input_channel=channel_id)
                    latest_sync = max(
                        (v["snippet"]["publishedAt"] for v in videos),
                        default=None
                    )
                    channels.append({
                        "channel_id": channel_id,
                        "lastCheckedAt": now,
                        "lastVideoSyncAt": latest_sync
                    })
                    should_update = True
                    last_video_sync_at = latest_sync

                index_ref.set({"channels": channels})

            response = {
                "shouldUpdate": should_update,
                "channelId": channel_id,
                "lastCheckedAt": now if should_update else last_checked_at,
                "lastVideoSyncAt": last_video_sync_at
            }

            if should_update:
                # 產生簡單 token 並寫入 update_token 文件
                import secrets
                token = secrets.token_urlsafe(24)
                expires_at = (now + timedelta(minutes=2))
                update_token_ref = db.document(f"channel_data/{channel_id}/channel_info/update_token")
                update_token_ref.set({
                    "token": token,
                    "expiresAt": expires_at
                })
                response["updateToken"] = token

            return jsonify(response)

        except Exception as e:
            logger.exception("🔥 /api/videos/check-update 發生錯誤")
            return jsonify({
                "error": "發生錯誤",
                "details": str(e)
            }), 500

    app.register_blueprint(video_bp)
    logger.info("✅ [video_routes] /api/videos/* 路由已註冊")
