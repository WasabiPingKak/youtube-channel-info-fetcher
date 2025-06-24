import logging
from flask import Blueprint, request, jsonify
from google.cloud.firestore import Client
from datetime import datetime, timedelta, timezone
from services.live_redirect.cache_builder import build_live_redirect_cache_entries

live_redirect_bp = Blueprint("live_redirect", __name__)

CACHE_TTL_MINUTES = 15

def init_live_redirect_route(app, db: Client):
    @live_redirect_bp.route("/api/live-redirect/cache", methods=["GET"])
    def get_live_redirect_cache():
        try:
            force = request.args.get("force", "false").lower() == "true"
            now = datetime.now(timezone.utc)
            today_str = now.date().isoformat()
            yesterday_str = (now - timedelta(days=1)).date().isoformat()

            # 🔸 快取文件參考
            today_cache_ref = db.collection("live_redirect_cache").document(today_str)
            today_cache = today_cache_ref.get().to_dict() or {}

            # ⏳ 若非強制更新且快取未過期，直接回傳
            updated_at = today_cache.get("updatedAt")
            if not force and updated_at:
                updated_time = datetime.fromisoformat(updated_at)
                if now - updated_time < timedelta(minutes=CACHE_TTL_MINUTES):
                    logging.info("♻️ 快取未過期，直接回傳")
                    return jsonify(today_cache)

            # 📥 讀取昨天與今天的通知佇列
            queue_docs = {
                date_str: db.collection("live_redirect_notify_queue").document(date_str).get().to_dict() or {}
                for date_str in [yesterday_str, today_str]
            }

            # 合併 videos，後出現者覆蓋
            all_videos_map = {}
            for data in queue_docs.values():
                for v in data.get("videos", []):
                    video_id = v.get("videoId")
                    if video_id:
                        all_videos_map[video_id] = v
            videos = list(all_videos_map.values())

            # 🔍 第一次處理：build 快取資料（僅處理未處理的影片）
            new_channels, processed_video_ids = build_live_redirect_cache_entries(
                videos, db, now,
                skip_if_processed=True,
                update_endtime_only=False
            )

            # 合併舊有快取（同一影片以新資料為準）
            existing_map = {c["live"]["videoId"]: c for c in today_cache.get("channels", [])}
            for c in new_channels:
                existing_map[c["live"]["videoId"]] = c
            merged_channels = list(existing_map.values())

            # 🔄 寫入今日快取
            today_cache_ref.set({
                "updatedAt": now.isoformat(),
                "channels": merged_channels
            })

            # 📝 回寫 processedAt 至昨天與今天的 queue
            for date_str, data in queue_docs.items():
                new_list = []
                for v in data.get("videos", []):
                    if v.get("videoId") in processed_video_ids:
                        v["processedAt"] = now.isoformat()
                    new_list.append(v)
                db.collection("live_redirect_notify_queue").document(date_str).set({
                    "updatedAt": now.isoformat(),
                    "videos": new_list
                })

            # 🧼 懶更新：處理 endTime 為 null 的快取
            needs_update = [c for c in merged_channels if not c["live"].get("endTime")]
            updated_channels, _ = build_live_redirect_cache_entries(
                needs_update, db, now,
                skip_if_processed=False,
                update_endtime_only=True
            )
            for c in updated_channels:
                merged_video_id = c["live"]["videoId"]
                for i, existing in enumerate(merged_channels):
                    if existing["live"]["videoId"] == merged_video_id:
                        merged_channels[i] = c
                        break

            # 🔄 合併昨天快取的尚未收播影片
            yesterday_cache = db.collection("live_redirect_cache").document(yesterday_str).get().to_dict() or {}
            for c in yesterday_cache.get("channels", []):
                vid = c["live"]["videoId"]
                if vid not in {v["live"]["videoId"] for v in merged_channels}:
                    if not c["live"].get("endTime"):
                        merged_channels.append(c)

            logging.info(f"✅ 快取重建完成，channels={len(merged_channels)}，更新影片={len(processed_video_ids)}")

            return jsonify({
                "updatedAt": now.isoformat(),
                "channels": merged_channels
            })

        except Exception:
            logging.exception("🔥 快取重建流程失敗")
            return jsonify({"error": "Internal Server Error"}), 500

    app.register_blueprint(live_redirect_bp)
