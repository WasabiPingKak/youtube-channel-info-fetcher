from flask import Blueprint, request, jsonify
import logging
import traceback
from services.heatmap_analyzer import analyze_and_update_all_channels

def init_sync_heatmap_route(app, db):
    bp = Blueprint("sync_heatmap_route", __name__)

    @bp.route("/api/sync/channel_video_heatmap", methods=["GET"])
    def sync_channel_video_heatmap():
        try:
            logging.info(f"📊 [sync] 接收到活躍統計請求（每次皆進行全量重算）")

            result = analyze_and_update_all_channels(db=db)

            logging.info(
                f"✅ [sync] 處理完成：updated={result.get('updated', 0)}, "
                f"skipped={result.get('skipped', 0)}"
            )

            return jsonify({
                "updated_channels": result.get("updated", 0),
                "skipped_channels": result.get("skipped", 0),
                "skipped_channel_ids": result.get("skipped_channels", [])
            }), 200

        except Exception as e:
            logging.error("🔥 [sync] 頻道影片活躍統計失敗：%s", traceback.format_exc())
            return jsonify({
                "error": "Internal server error",
                "message": str(e)
            }), 500

    app.register_blueprint(bp)
