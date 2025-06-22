import logging
import os
import time
import requests
from flask import Blueprint, Response
from google.cloud.firestore import Client

websub_subscribe_bp = Blueprint("websub_subscribe", __name__)
HUB_URL = "https://pubsubhubbub.appspot.com/subscribe"
CALLBACK_URL = os.getenv("WEBSUB_CALLBACK_URL")

RETRY_DELAY_SECONDS = 60
SLEEP_BETWEEN_REQUESTS = 0.5

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

                topic = f"https://www.youtube.com/xml/feeds/videos.xml?channel_id={channel_id}"
                payload = {
                    "hub.mode": "subscribe",
                    "hub.topic": topic,
                    "hub.callback": CALLBACK_URL,
                    "hub.verify": "async"
                }

                logging.info(f"📡 發送訂閱請求：{channel_id}")

                for attempt in range(2):
                    try:
                        response = requests.post(HUB_URL, data=payload)
                        if response.status_code == 202:
                            subscribed += 1
                            break
                        elif response.status_code in [429] or 500 <= response.status_code < 600:
                            logging.warning(f"⚠️ 第 {attempt+1} 次訂閱失敗（可 retry）：{channel_id} → {response.status_code}")
                            if attempt == 0:
                                time.sleep(RETRY_DELAY_SECONDS)
                        else:
                            logging.warning(f"❗訂閱失敗（不 retry）：{channel_id} → {response.status_code} - {response.text}")
                            break
                    except Exception as e:
                        logging.error(f"🔥 發送訂閱時發生例外：{channel_id}", exc_info=True)
                        break

                time.sleep(SLEEP_BETWEEN_REQUESTS)

            return Response(f"✅ 已發送訂閱請求 {subscribed} 筆", status=200)

        except Exception as e:
            logging.error("🔥 訂閱發送失敗", exc_info=True)
            return Response("Internal Server Error", status=500)

    app.register_blueprint(websub_subscribe_bp)
