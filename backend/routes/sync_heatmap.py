import logging

from apiflask import APIBlueprint
from flask import jsonify

from services.heatmap_analyzer import analyze_and_update_all_channels
from utils.admin_auth import require_admin_key


def init_sync_heatmap_route(app, db):
    bp = APIBlueprint("sync_heatmap_route", __name__, tag="Admin")

    @bp.route("/api/sync/channel_video_heatmap", methods=["GET"])
    @bp.doc(
        summary="同步熱力圖資料",
        description="全量重算所有頻道的影片活躍統計",
        security="BearerAuth",
    )
    @require_admin_key
    def sync_channel_video_heatmap():
        try:
            logging.info("📊 [sync] 接收到活躍統計請求（每次皆進行全量重算）")

            result = analyze_and_update_all_channels(db=db)

            logging.info(
                f"✅ [sync] 處理完成：updated={result.get('updated', 0)}, "
                f"skipped={result.get('skipped', 0)}"
            )

            return jsonify(
                {
                    "updated_channels": result.get("updated", 0),
                    "skipped_channels": result.get("skipped", 0),
                    "skipped_channel_ids": result.get("skipped_channels", []),
                }
            ), 200

        except Exception:
            logging.error("🔥 [sync] 頻道影片活躍統計失敗", exc_info=True)
            return jsonify(
                {
                    "error": "Internal server error",
                }
            ), 500

    app.register_blueprint(bp)
