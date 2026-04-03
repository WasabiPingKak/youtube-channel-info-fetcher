import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud import firestore

from services.heatmap_cache_writer import write_weekly_heatmap_cache
from utils.admin_auth import require_admin_key


def init_weekly_heatmap_cache_route(app, db: firestore.Client):
    bp = APIBlueprint("weekly_heatmap_cache_route", __name__, tag="Heatmap")

    @bp.route("/admin/update_weekly_heatmap_cache", methods=["GET"])
    @bp.doc(
        summary="更新週間熱力圖快取",
        description="重新建構 weekly heatmap 快取資料",
        security="BearerAuth",
    )
    @require_admin_key
    def update_weekly_heatmap_cache():
        logging.info("🧱 [admin] 開始重新建構 weekly heatmap 快取資料...")
        success = write_weekly_heatmap_cache(db)
        if success:
            return jsonify({"message": "✅ 快取更新成功"}), 200
        else:
            return jsonify({"error": "⚠️ 快取更新失敗"}), 500

    @bp.route("/api/heatmap/weekly", methods=["GET"])
    @bp.doc(summary="取得週間熱力圖快取", description="回傳合併 weekly + pending 的熱力圖資料")
    def get_weekly_heatmap_cache():
        weekly_doc = db.document("stats_cache/active_time_weekly").get()
        pending_doc = db.document("stats_cache/active_time_pending").get()

        if not weekly_doc.exists:
            return jsonify({"error": "weekly cache not found"}), 404

        weekly_data = weekly_doc.to_dict() or {}
        pending_data = pending_doc.to_dict() if pending_doc.exists else {}

        weekly_list = weekly_data.get("channels", [])
        pending_list = pending_data.get("channels", [])  # type: ignore[union-attr]

        # 👉 轉為 dict[channelId] → pending 覆蓋 weekly
        channel_map = {ch["channelId"]: ch for ch in weekly_list if "channelId" in ch}
        for ch in pending_list:
            if "channelId" in ch:
                channel_map[ch["channelId"]] = ch

        merged_channels_list = list(channel_map.values())

        response = {
            "generatedAt": weekly_data.get("generatedAt"),
            "version": weekly_data.get("version", 1),
            "channels": merged_channels_list,
        }

        return jsonify(response), 200

    app.register_blueprint(bp)
