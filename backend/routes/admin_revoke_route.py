import logging

from apiflask import APIBlueprint
from flask import jsonify
from google.cloud.firestore import SERVER_TIMESTAMP

from schemas.admin_schemas import AdminRevokeRequest
from utils.auth_decorator import clear_revoke_cache, require_auth
from utils.jwt_util import is_admin_channel_id
from utils.rate_limiter import limiter


def init_admin_revoke_route(app, db):
    bp = APIBlueprint("admin_revoke", __name__, tag="Admin")

    @bp.route("/api/admin/revoke", methods=["POST"])
    @bp.doc(
        summary="管理員撤銷頻道授權",
        description="撤銷指定頻道的 OAuth 授權，使該頻道所有已簽發的 JWT 立即失效",
    )
    @limiter.limit("5 per minute")
    @require_auth(db)
    @bp.input(AdminRevokeRequest, arg_name="body")
    def admin_revoke_channel(body, auth_channel_id):
        # 權限檢查：僅 admin 可操作
        if not is_admin_channel_id(auth_channel_id):
            logging.warning(f"🚫 非管理員嘗試撤銷授權：operator={auth_channel_id}")
            return jsonify({"error": "權限不足"}), 403

        target_id = body.target_channel_id

        # 寫入 revoked_at 時間戳
        meta_ref = (
            db.collection("channel_data")
            .document(target_id)
            .collection("channel_info")
            .document("meta")
        )
        meta_doc = meta_ref.get()
        if not meta_doc.exists:
            logging.warning(f"⚠️ 撤銷目標不存在：target={target_id}")
            return jsonify({"error": "找不到該頻道的授權資料"}), 404

        meta_ref.update({"revoked_at": SERVER_TIMESTAMP})
        clear_revoke_cache(target_id)

        # Audit log
        logging.info(f"🔒 管理員撤銷授權：operator={auth_channel_id}, target={target_id}")

        return jsonify(
            {
                "success": True,
                "target_channel_id": target_id,
                "message": "已撤銷該頻道的授權",
            }
        ), 200

    app.register_blueprint(bp)
