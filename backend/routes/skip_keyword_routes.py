import logging

from apiflask import APIBlueprint
from firebase_admin import firestore
from flask import jsonify

from schemas.category_editor_schemas import SkipKeywordRequest
from utils.auth_decorator import require_auth

logger = logging.getLogger(__name__)


def init_skip_keyword_routes(app, db):
    bp = APIBlueprint(
        "skip_keyword",
        __name__,
        url_prefix="/api/quick-editor/skip-keyword",
        tag="Category Editor",
    )

    @bp.route("/add", methods=["POST"])
    @bp.doc(
        summary="加入略過關鍵字",
        description="將指定關鍵字加入該頻道的略過清單",
        security="CookieAuth",
    )
    @require_auth(db)
    @bp.input(SkipKeywordRequest, arg_name="body")
    def add_skipped_keyword(body, auth_channel_id=None):
        logger.info(f"✅ /skip-keyword/add 驗證成功，channel_id = {auth_channel_id}")

        if body.channelId != auth_channel_id:
            logger.warning(
                f"⛔ 嘗試略過他人頻道：JWT={auth_channel_id}, 請求 channel_id={body.channelId}"
            )
            return jsonify({"error": "無權限操作此頻道資料"}), 403

        doc_ref = (
            db.collection("channel_data")
            .document(body.channelId)
            .collection("settings")
            .document("skip_keywords")
        )
        doc_ref.set({"skipped": firestore.ArrayUnion([body.keyword])}, merge=True)

        return jsonify({"success": True})

    @bp.route("/remove", methods=["POST"])
    @bp.doc(
        summary="移除略過關鍵字",
        description="將指定關鍵字從該頻道的略過清單中移除",
        security="CookieAuth",
    )
    @require_auth(db)
    @bp.input(SkipKeywordRequest, arg_name="body")
    def remove_skipped_keyword(body, auth_channel_id=None):
        logger.info(f"✅ /skip-keyword/remove 驗證成功，channel_id = {auth_channel_id}")

        if body.channelId != auth_channel_id:
            logger.warning(
                f"⛔ 嘗試移除他人略過關鍵字：JWT={auth_channel_id}, 請求 channel_id={body.channelId}"
            )
            return jsonify({"error": "無權限操作此頻道資料"}), 403

        doc_ref = (
            db.collection("channel_data")
            .document(body.channelId)
            .collection("settings")
            .document("skip_keywords")
        )
        doc_ref.set({"skipped": firestore.ArrayRemove([body.keyword])}, merge=True)

        return jsonify({"success": True})

    app.register_blueprint(bp)
