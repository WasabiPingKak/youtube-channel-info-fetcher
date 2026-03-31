import logging

from apiflask import APIBlueprint
from flask import jsonify

from schemas.common import ChannelIdCamelQuery
from schemas.video_schemas import ClassifiedVideoRequest
from services.classified_video_fetcher import get_classified_videos, get_merged_settings
from services.video_check_update_service import check_channel_update_status

logger = logging.getLogger(__name__)
video_bp = APIBlueprint("video", __name__, tag="Video")


def init_video_routes(app, db):
    @video_bp.route("/api/videos/classified", methods=["POST"])
    @video_bp.doc(
        summary="取得分類影片清單", description="依頻道 ID 與時間區間取得分類後的影片列表"
    )
    @video_bp.input(ClassifiedVideoRequest, arg_name="body")
    def get_classified(body):
        logger.info(f"🔍 取得分類影片清單：{body.channel_id}（only_settings={body.only_settings}）")

        if body.only_settings:
            settings = get_merged_settings(db, body.channel_id)
            return jsonify({"success": True, "settings": settings})

        result = get_classified_videos(db, body.channel_id, start=body.start, end=body.end)
        return jsonify({"success": True, "videos": result})

    @video_bp.route("/api/videos/check-update", methods=["GET"])
    @video_bp.doc(
        summary="檢查影片是否需要更新", description="檢查頻道影片同步狀態並產生更新 token"
    )
    @video_bp.input(ChannelIdCamelQuery, location="query", arg_name="query")
    def check_update(query):
        channel_id = query.channelId

        result = check_channel_update_status(db, channel_id)
        return jsonify(result)

    app.register_blueprint(video_bp)
    logger.info("✅ [video_routes] /api/videos/* 路由已註冊")
