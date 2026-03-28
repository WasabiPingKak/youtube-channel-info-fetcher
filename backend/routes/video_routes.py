import logging
from datetime import UTC, datetime, timedelta

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from schemas.video_schemas import ClassifiedVideoRequest
from services.classified_video_fetcher import get_classified_videos, get_merged_settings
from utils.channel_validator import is_valid_channel_id

logger = logging.getLogger(__name__)
video_bp = Blueprint("video", __name__)


def init_video_routes(app, db):
    @video_bp.route("/api/videos/classified", methods=["POST"])
    def get_classified():
        try:
            data = request.get_json()
            if data is None:
                logger.warning("⚠️ 無法解析 JSON，可能缺少 Content-Type: application/json")
                return jsonify({"error": "無法解析 JSON，請確認 Content-Type"}), 400

            logger.info(f"📥 請求內容：{data}")

            body = ClassifiedVideoRequest(**data)

            logger.info(
                f"🔍 取得分類影片清單：{body.channel_id}（only_settings={body.only_settings}）"
            )

            if body.only_settings:
                settings = get_merged_settings(db, body.channel_id)
                return jsonify({"settings": settings})

            result = get_classified_videos(db, body.channel_id, start=body.start, end=body.end)
            return jsonify({"videos": result})

        except ValidationError:
            raise
        except Exception:
            logger.exception("🔥 /api/videos/classified 發生錯誤")
            return jsonify({"error": "伺服器內部錯誤"}), 500

    @video_bp.route("/api/videos/check-update", methods=["GET"])
    def check_update():
        try:
            channel_id = request.args.get("channelId")
            if not channel_id:
                return jsonify({"error": "Missing channelId"}), 400
            if not is_valid_channel_id(channel_id):
                return jsonify({"error": "channelId 格式不合法"}), 400

            index_ref = db.collection("channel_sync_index").document("index_list")
            doc = index_ref.get()
            now = datetime.now(UTC)
            now_iso = now.isoformat()

            last_checked_at = None
            last_video_sync_at = None
            should_update = False

            if not doc.exists:
                logger.info(f"📄 [check-update] 尚未存在 index_list，初始化頻道 {channel_id}")
                index_ref.set(
                    {
                        "channels": [
                            {
                                "channel_id": channel_id,
                                "lastCheckedAt": now_iso,
                                # 不寫入 lastVideoSyncAt，等 /update 時再補
                            }
                        ]
                    }
                )
                logger.info(
                    f"📝 [check-update] 寫入 index_list：新增頻道 {channel_id}（僅設定 lastCheckedAt）"
                )
                should_update = True
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
                            logger.info(
                                f"🧭 [check-update] 頻道 {channel_id} 沒有 lastCheckedAt，需更新"
                            )
                        else:
                            last_checked_dt = datetime.fromisoformat(last_checked_at)
                            delta = now - last_checked_dt
                            if delta > timedelta(hours=12):
                                should_update = True
                                logger.info(f"⏰ [check-update] 距離上次檢查已超過 {delta}，需更新")

                        if should_update:
                            ch["lastCheckedAt"] = now_iso
                        break

                if not found:
                    logger.info(
                        f"➕ [check-update] 頻道 {channel_id} 尚未在 index_list 中，加入新紀錄"
                    )
                    channels.append(
                        {
                            "channel_id": channel_id,
                            "lastCheckedAt": now_iso,
                            # 不寫入 lastVideoSyncAt，等 /update 時再補
                        }
                    )
                    logger.info(
                        f"📝 [check-update] 寫入 index_list：新增頻道 {channel_id}（僅設定 lastCheckedAt）"
                    )
                    should_update = True

                index_ref.set({"channels": channels})
                logger.info(
                    f"📦 [check-update] 寫入整份 channels 更新：頻道 {channel_id}，shouldUpdate = {should_update}"
                )

            response = {
                "shouldUpdate": should_update,
                "channelId": channel_id,
                "lastCheckedAt": now_iso if should_update else last_checked_at,
                "lastVideoSyncAt": last_video_sync_at,  # 沒寫入但仍保留現有資料
            }

            if should_update:
                import secrets

                token = secrets.token_urlsafe(24)
                expires_at = (now + timedelta(minutes=2)).isoformat()
                update_token_ref = db.document(
                    f"channel_data/{channel_id}/channel_info/update_token"
                )
                update_token_ref.set({"token": token, "expiresAt": expires_at})
                logger.info(
                    f"🔐 [check-update] 產生更新 token for {channel_id}，expiresAt = {expires_at}"
                )
                response["updateToken"] = token

            return jsonify(response)

        except Exception:
            logger.exception("🔥 /api/videos/check-update 發生錯誤")
            return jsonify({"error": "伺服器內部錯誤"}), 500

    app.register_blueprint(video_bp)
    logger.info("✅ [video_routes] /api/videos/* 路由已註冊")
