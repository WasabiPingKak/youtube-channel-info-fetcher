# routes/annual_review_route.py

from flask import request, jsonify
import logging
import os

from utils.jwt_util import verify_jwt
from services.annual_review.generate import generate_annual_review_data


def init_annual_review_routes(app, db):
    @app.route("/api/annual-review/generate", methods=["POST"])
    def generate_annual_review():
        try:
            # ✅ 取出 JWT (from __session cookie)
            token = request.cookies.get("__session")
            decoded = verify_jwt(token) if token else None
            jwt_channel_id = decoded.get("channelId") if decoded else None

            # ✅ 取出 Bearer Token (from Authorization Header)
            auth_header = request.headers.get("Authorization", "")
            is_admin = False
            if auth_header.startswith("Bearer "):
                admin_key = auth_header.replace("Bearer ", "").strip()
                is_admin = admin_key == os.environ.get("ADMIN_API_KEY")

            # ✅ 解析 payload
            data = request.get_json()
            channel_id = data.get("channel_id")
            year = data.get("year")

            if not channel_id or not isinstance(channel_id, str):
                return jsonify({"error": "缺少必要欄位 channel_id"}), 400
            if not year or not isinstance(year, int):
                return jsonify({"error": "缺少必要欄位 year"}), 400

            # 🔐 權限驗證
            if not is_admin:
                if not jwt_channel_id:
                    logging.warning("🔒 無法驗證使用者身份")
                    return jsonify({"error": "未登入或權限不足"}), 401

                if jwt_channel_id != channel_id:
                    logging.warning(
                        f"⛔ 嘗試觸發他人頻道統計：JWT={jwt_channel_id}, payload={channel_id}"
                    )
                    return jsonify({"error": "無權限操作此頻道"}), 403

            # ✅ 呼叫統計主流程
            result = generate_annual_review_data(db, channel_id, year)

            if result.get("success"):
                return jsonify(result)
            else:
                return (
                    jsonify(
                        {
                            "error": "統計過程失敗",
                            "details": result.get("error", "未知錯誤"),
                        }
                    ),
                    500,
                )

        except Exception as e:
            logging.error("🔥 年度回顧 API 發生錯誤", exc_info=True)
            return jsonify({"error": "內部錯誤，請稍後再試"}), 500
