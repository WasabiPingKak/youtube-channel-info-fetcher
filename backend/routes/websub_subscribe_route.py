import logging
import os
import time
import requests
from flask import Blueprint, request, Response
from google.cloud.firestore import Client
from utils.channel_validator import is_valid_channel_id

websub_subscribe_bp = Blueprint("websub_subscribe", __name__)
HUB_URL = "https://pubsubhubbub.appspot.com/subscribe"
CALLBACK_URL = os.getenv("WEBSUB_CALLBACK_URL")

RETRY_DELAY_SECONDS = 60
SLEEP_BETWEEN_REQUESTS = 0.5

def subscribe_channel_by_id(channel_id: str) -> bool:
    """
    可獨立呼叫的訂閱函式（初始化後觸發或 API 單獨測試）
    """
    if not channel_id:
        logging.warning("❌ 呼叫 subscribe_channel_by_id 時缺少 channel_id")
        return False

    if not CALLBACK_URL:
        logging.error("❌ 未設定 WEBSUB_CALLBACK_URL 環境變數")
        return False

    topic = f"https://www.youtube.com/xml/feeds/videos.xml?channel_id={channel_id}"
    payload = {
        "hub.mode": "subscribe",
        "hub.topic": topic,
        "hub.callback": CALLBACK_URL,
        "hub.verify": "async"
    }

    logging.info(f"📡 單獨訂閱頻道：{channel_id}")
    try:
        response = requests.post(HUB_URL, data=payload)
        if response.status_code == 202:
            logging.info(f"✅ 訂閱成功：{channel_id}")
            return True
        else:
            logging.warning(f"❗訂閱失敗：{channel_id} → {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logging.error(f"🔥 單筆訂閱發生例外：{channel_id}", exc_info=True)
        return False


def init_websub_subscribe_route(app, db: Client):
    @websub_subscribe_bp.route("/api/websub/subscribe-all", methods=["POST"])
    def subscribe_all_channels():
        try:
            doc = db.collection("channel_sync_index").document("index_list").get()
            data = doc.to_dict() or {}
            channels = data.get("channels", [])

            if not channels:
                return Response("⚠️ 無頻道資料可訂閱", status=400)

            logging.info(f"🔍 WEBSUB_CALLBACK_URL = {CALLBACK_URL}")

            subscribed = 0
            for item in channels:
                channel_id = item.get("channel_id")
                if not channel_id:
                    continue

                success = False
                for attempt in range(2):
                    success = subscribe_channel_by_id(channel_id)
                    if success:
                        subscribed += 1
                        break
                    elif attempt == 0:
                        time.sleep(RETRY_DELAY_SECONDS)

                time.sleep(SLEEP_BETWEEN_REQUESTS)

            return Response(f"✅ 已發送訂閱請求 {subscribed} 筆", status=200)

        except Exception as e:
            logging.error("🔥 訂閱發送失敗", exc_info=True)
            return Response("Internal Server Error", status=500)

    @websub_subscribe_bp.route("/api/websub/subscribe-one", methods=["POST"])
    def subscribe_single_channel():
        channel_id = request.args.get("channel_id")
        if not channel_id:
            return Response("❌ 缺少 channel_id 參數", status=400)
        if not is_valid_channel_id(channel_id):
            return Response("❌ channel_id 格式不合法", status=400)

        success = subscribe_channel_by_id(channel_id)
        if success:
            return Response(f"✅ 已訂閱頻道 {channel_id}", status=200)
        else:
            return Response(f"❌ 訂閱失敗：{channel_id}", status=500)

    app.register_blueprint(websub_subscribe_bp)
