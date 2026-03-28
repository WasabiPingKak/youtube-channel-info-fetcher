import logging

from firebase_admin import firestore
from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from schemas.category_editor_schemas import SkipKeywordRequest
from utils.auth_decorator import require_auth

logger = logging.getLogger(__name__)


def init_skip_keyword_routes(app, db):
    bp = Blueprint("skip_keyword", __name__, url_prefix="/api/quick-editor/skip-keyword")

    @bp.route("/add", methods=["POST"])
    @require_auth(db)
    def add_skipped_keyword(auth_channel_id=None):
        try:
            logger.info(f"✅ /skip-keyword/add 驗證成功，channel_id = {auth_channel_id}")

            data = request.get_json()
            body = SkipKeywordRequest(**data)

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

        except ValidationError:
            raise
        except Exception:
            logger.error("🔥 加入略過關鍵字失敗", exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    @bp.route("/remove", methods=["POST"])
    @require_auth(db)
    def remove_skipped_keyword(auth_channel_id=None):
        try:
            logger.info(f"✅ /skip-keyword/remove 驗證成功，channel_id = {auth_channel_id}")

            data = request.get_json()
            body = SkipKeywordRequest(**data)

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

        except ValidationError:
            raise
        except Exception:
            logger.error("🔥 移除略過關鍵字失敗", exc_info=True)
            return jsonify({"error": "內部伺服器錯誤"}), 500

    app.register_blueprint(bp)
