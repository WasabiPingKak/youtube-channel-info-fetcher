import logging

from apiflask import APIBlueprint
from flask import jsonify

from schemas.category_editor_schemas import QuickApplyRequest
from utils.auth_decorator import require_auth

quick_apply_bp = APIBlueprint("quick_category_apply", __name__, tag="Category Editor")


def init_quick_category_apply_route(app, db):
    @quick_apply_bp.route("/api/quick-editor/channel-config-apply", methods=["POST"])
    @quick_apply_bp.doc(
        summary="快速套用分類關鍵字",
        description="將關鍵字加入指定的分類與子分類",
        security="CookieAuth",
    )
    @require_auth(db)
    @quick_apply_bp.input(QuickApplyRequest, arg_name="body")
    def apply_quick_category(body, auth_channel_id=None):
        try:
            # 🔐 channelId 與使用者 JWT 是否一致
            if body.channelId != auth_channel_id:
                logging.warning(
                    f"⛔ 嘗試寫入他人頻道資料：JWT={auth_channel_id}, 請求 channel_id={body.channelId}"
                )
                return jsonify({"error": "無權限操作此頻道資料"}), 403

            # 🔧 Firestore 操作
            config_ref = (
                db.collection("channel_data")
                .document(body.channelId)
                .collection("settings")
                .document("config")
            )

            doc = config_ref.get()
            config_data = doc.to_dict() or {}
            updated_config = config_data.copy()

            # ✅ 確保四大主分類永遠存在，且型別為 dict（防止過去為 list）
            REQUIRED_MAIN_CATEGORIES = ["雜談", "遊戲", "音樂", "節目"]
            for cat in REQUIRED_MAIN_CATEGORIES:
                if not isinstance(updated_config.get(cat), dict):
                    updated_config[cat] = {}

            # ➤ 寫入分類設定
            for target in body.targets:
                main_category = target.mainCategory
                subcategory_name = target.subcategoryName

                if not isinstance(updated_config.get(main_category), dict):
                    updated_config[main_category] = {}

                if subcategory_name == body.keyword:
                    updated_config[main_category].setdefault(subcategory_name, [])
                else:
                    updated_config[main_category].setdefault(subcategory_name, [])
                    if body.keyword not in updated_config[main_category][subcategory_name]:
                        updated_config[main_category][subcategory_name].append(body.keyword)

            logging.info(f"📥 正在儲存快速分類設定：{body.channelId} - {body.keyword}")
            config_ref.set(updated_config, merge=True)

            return jsonify({"success": True, "message": "已儲存分類設定"})

        except Exception:
            logging.error("🔥 快速分類 API 發生錯誤", exc_info=True)
            return jsonify({"success": False, "message": "內部錯誤，請稍後再試"}), 500

    app.register_blueprint(quick_apply_bp)
