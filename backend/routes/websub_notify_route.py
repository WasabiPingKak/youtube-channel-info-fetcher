import hashlib
import hmac
import logging
import os
from datetime import UTC, datetime

from apiflask import APIBlueprint
from defusedxml.ElementTree import fromstring as safe_xml_fromstring
from flask import Response, request

websub_notify_bp = APIBlueprint("websub_notify", __name__, tag="WebSub")
COLLECTION_NAME = "live_redirect_notify_queue"


def init_websub_notify_route(app, db):
    @websub_notify_bp.route("/websub-callback", methods=["GET", "POST"])
    @websub_notify_bp.doc(
        summary="WebSub 回調",
        description="接收 YouTube WebSub 推播通知（新影片上傳）",
        hide=True,
    )
    def websub_callback():
        if request.method == "GET":
            # 驗證訂閱請求，回傳 hub.challenge
            hub_mode = request.args.get("hub.mode")
            hub_challenge = request.args.get("hub.challenge")
            hub_topic = request.args.get("hub.topic")
            logging.info(f"🔔 WebSub 驗證請求：mode={hub_mode}, topic={hub_topic}")
            if hub_challenge:
                return Response(hub_challenge, status=200, content_type="text/plain")
            return Response("Missing hub.challenge", status=400)

        elif request.method == "POST":
            try:
                xml_data = request.data

                # 驗證 Hub 簽名（若有設定 WEBSUB_SECRET）
                websub_secret = os.getenv("WEBSUB_SECRET", "")
                if websub_secret:
                    signature = request.headers.get("X-Hub-Signature", "")
                    expected = (
                        "sha1="
                        + hmac.new(websub_secret.encode(), xml_data, hashlib.sha1).hexdigest()
                    )
                    if not hmac.compare_digest(signature, expected):
                        logging.warning("⚠️ WebSub 簽名驗證失敗")
                        return Response("Invalid signature", status=403)
                root = safe_xml_fromstring(xml_data)

                # YouTube 推播的 XML 格式 namespace
                ns = {
                    "atom": "http://www.w3.org/2005/Atom",
                    "yt": "http://www.youtube.com/xml/schemas/2015",
                }
                entries = root.findall("atom:entry", ns)
                logging.info(f"📦 WebSub 接收到 {len(entries)} 筆新影片通知")

                for entry in entries:
                    video_id = entry.find("yt:videoId", ns).text
                    channel_id = entry.find("yt:channelId", ns).text
                    notified_at = datetime.now(UTC)
                    notified_at_str = notified_at.isoformat()
                    doc_id = notified_at.date().isoformat()  # 以 YYYY-MM-DD 作為 document ID

                    logging.info(f"📺 通知影片 videoId={video_id}，channelId={channel_id}")

                    # 取得該日期的 document 參考
                    doc_ref = db.collection(COLLECTION_NAME).document(doc_id)
                    doc = doc_ref.get()
                    current_data = doc.to_dict() or {}
                    videos = current_data.get("videos", [])

                    # 若已存在則覆寫更新（用 videoId 去重）
                    existing_index = next(
                        (i for i, v in enumerate(videos) if v["videoId"] == video_id), None
                    )
                    new_item = {
                        "videoId": video_id,
                        "channelId": channel_id,
                        "notifiedAt": notified_at_str,
                        "processedAt": None,
                    }

                    if existing_index is not None:
                        videos[existing_index] = new_item
                    else:
                        videos.append(new_item)

                    # 寫入更新後的資料
                    doc_ref.set({"updatedAt": datetime.now(UTC).isoformat(), "videos": videos})

                return Response("OK", status=204)
            except Exception:
                logging.error("🔥 WebSub 推播處理失敗", exc_info=True)
                return Response("Internal Server Error", status=500)

    app.register_blueprint(websub_notify_bp)
