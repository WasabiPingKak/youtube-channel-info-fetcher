import logging

from apiflask import APIBlueprint
from flask import jsonify, request
from google.api_core.exceptions import GoogleAPIError
from google.cloud.firestore import Client

from services.trending.trending_service import get_trending_games_summary

logger = logging.getLogger(__name__)
bp = APIBlueprint("public_trending", __name__, tag="Trending")


def init_public_trending_route(app, db: Client):
    @bp.route("/api/trending-games", methods=["GET"])
    @bp.doc(summary="取得遊戲趨勢排行", description="回傳指定天數內的熱門遊戲排行統計")
    def trending_games_api():
        try:
            logger.info("🚀 [GET /api/trending-games] 處理開始")

            # 取得並驗證 days 參數
            try:
                days = int(request.args.get("days", "30"))
            except ValueError:
                logger.warning("⚠️ days 參數格式錯誤，已套用預設值 30")
                days = 30

            if days not in {7, 14, 30}:
                logger.warning(f"⚠️ days 參數不合法：{days}，已套用預設值 30")
                days = 30

            result = get_trending_games_summary(db, days)

            if "error" in result:
                logger.warning("⚠️ 回傳包含錯誤訊息")
                return jsonify(result), 500

            logger.info(f"✅ 趨勢資料傳回成功（區間 {days} 天）")
            return jsonify(result)

        except GoogleAPIError:
            logger.exception("🔥 Firestore 操作失敗")
            return jsonify({"error": "Firestore 操作失敗"}), 500

        except Exception:
            logger.exception("🔥 /api/trending-games 發生例外錯誤")
            return jsonify({"error": "伺服器內部錯誤"}), 500

    app.register_blueprint(bp)
