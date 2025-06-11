# routes/channel_index_route.py

import logging
from flask import Blueprint, jsonify
from firebase_admin import firestore
from datetime import datetime, timedelta, timezone
from dateutil import parser as date_parser

def init_channel_index_route(app, db):
    bp = Blueprint("channel_index_route", __name__)

    @bp.route("/api/channels/index", methods=["GET"])
    def get_all_enabled_channels():
        """
        從所有 batch 檔中抓出 enabled: true 的頻道清單，
        並附帶最近三天內加入的頻道清單 newly_joined_channels。
        同時附上各頻道最後上片時間 lastVideoUploadedAt。
        """
        try:
            # 🔹 讀取同步資料（channel_id → lastVideoSyncAt）
            sync_ref = db.collection("channel_sync_index").document("index_list")
            sync_doc = sync_ref.get()
            sync_map = {}

            if sync_doc.exists:
                sync_list = sync_doc.to_dict().get("channels", [])
                for item in sync_list:
                    cid = item.get("channel_id")
                    sync_time = item.get("lastVideoSyncAt")
                    if cid and sync_time:
                        sync_map[cid] = sync_time


            # 🔹 讀取所有 batch
            root_ref = db.collection("channel_index_batch")
            docs = root_ref.stream()

            all_channels = []
            joined_at_dates = []

            for doc in docs:
                data = doc.to_dict()
                batch_channels = data.get("channels", [])
                for entry in batch_channels:
                    if entry.get("enabled") is not True:
                        continue

                    channel_id = entry.get("channel_id")
                    joined_at = entry.get("joinedAt")
                    parsed_date = None

                    if isinstance(joined_at, datetime):
                        parsed_date = joined_at.date()
                    elif isinstance(joined_at, str):
                        try:
                            parsed_date = date_parser.isoparse(joined_at).date()
                        except Exception:
                            pass

                    if parsed_date:
                        joined_at_dates.append(parsed_date)

                    all_channels.append({
                        "channel_id": channel_id,
                        "name": entry.get("name"),
                        "url": entry.get("url"),
                        "thumbnail": entry.get("thumbnail"),
                        "priority": entry.get("priority", 0),
                        "joinedAt": joined_at,
                        "countryCode": entry.get("countryCode", []),
                        "enabled": entry.get("enabled", True),
                        "lastVideoUploadedAt": sync_map.get(channel_id),
                    })

            # 排序所有資料
            sorted_channels = sorted(
                all_channels,
                key=lambda c: (-c["priority"], c["name"])
            )

            # 找出最近的三個日期
            unique_dates = sorted(set(joined_at_dates), reverse=True)
            recent_dates = set(unique_dates[:3])

            # 篩出最近三天加入的頻道
            newly_joined_channels = [
                ch for ch in sorted_channels
                if ch.get("joinedAt") and try_parse_date(ch["joinedAt"]) in recent_dates
            ]

            return jsonify({
                "success": True,
                "channels": sorted_channels,
                "newly_joined_channels": newly_joined_channels
            })

        except Exception as e:
            logging.exception("❌ 無法讀取頻道索引")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500

    app.register_blueprint(bp)


def try_parse_date(val):
    """統一解析 joinedAt 為 date 物件，錯誤時回傳 None"""
    if isinstance(val, datetime):
        return val.date()
    elif isinstance(val, str):
        try:
            return date_parser.isoparse(val).date()
        except Exception:
            return None
    return None
