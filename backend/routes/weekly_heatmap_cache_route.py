from flask import Blueprint, jsonify
import logging
from utils.admin_auth import require_admin_key
from services.heatmap_cache_writer import write_weekly_heatmap_cache

def init_weekly_heatmap_cache_route(app, db):
    bp = Blueprint("weekly_heatmap_cache_route", __name__)

    @bp.route("/admin/update_weekly_heatmap_cache", methods=["GET"])
    @require_admin_key
    def update_weekly_heatmap_cache():
        try:
            logging.info("🧱 [admin] 開始重新建構 weekly heatmap 快取資料...")
            success = write_weekly_heatmap_cache(db)
            if success:
                return jsonify({"message": "✅ 快取更新成功"}), 200
            else:
                return jsonify({"error": "⚠️ 快取更新失敗"}), 500
        except Exception as e:
            logging.error("🔥 快取更新時發生例外", exc_info=True)
            return jsonify({"error": "快取更新失敗"}), 500

    @bp.route("/api/heatmap/weekly", methods=["GET"])
    def get_weekly_heatmap_cache():
        try:
            weekly_doc = db.document("stats_cache/active_time_weekly").get()
            pending_doc = db.document("stats_cache/active_time_pending").get()

            if not weekly_doc.exists:
                return jsonify({"error": "weekly cache not found"}), 404

            weekly_data = weekly_doc.to_dict()
            pending_data = pending_doc.to_dict() if pending_doc.exists else {}

            weekly_list = weekly_data.get("channels", [])
            pending_list = pending_data.get("channels", [])

            # 👉 轉為 dict[channelId] → pending 覆蓋 weekly
            channel_map = {ch["channelId"]: ch for ch in weekly_list if "channelId" in ch}
            for ch in pending_list:
                if "channelId" in ch:
                    channel_map[ch["channelId"]] = ch

            merged_channels_list = list(channel_map.values())

            response = {
                "generatedAt": weekly_data.get("generatedAt"),
                "version": weekly_data.get("version", 1),
                "channels": merged_channels_list
            }

            return jsonify(response), 200

        except Exception as e:
            logging.error("🔥 讀取 weekly heatmap cache 失敗", exc_info=True)
            return jsonify({"error": "internal server error"}), 500

    app.register_blueprint(bp)
