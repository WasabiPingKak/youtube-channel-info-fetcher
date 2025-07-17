# routes/donation_route.py
from flask import Blueprint, jsonify
from google.cloud.firestore import Client
from datetime import datetime
import logging

donation_bp = Blueprint("donation", __name__)

def init_donation_route(app, db: Client):
    app.register_blueprint(donation_bp, url_prefix="/api")

@donation_bp.route("/donations", methods=["GET"])
def get_donations():
    db = Client()
    try:
        collection_ref = db.collection("donations_by_amount")

        # 🔍 先檢查 collection 是否存在及有資料
        logging.info("🔍 開始檢查 donations_by_amount collection...")

        date_docs = collection_ref.stream()
        date_docs_list = list(date_docs)  # 轉換成 list 以便檢查

        logging.info(f"📊 找到 {len(date_docs_list)} 個日期文件")

        if len(date_docs_list) == 0:
            logging.warning("❗ donations_by_amount collection 沒有任何文件!")
            # 檢查 collection 是否真的存在
            try:
                collections = db.collections()
                collection_names = [col.id for col in collections]
                logging.debug(f"🗂️ 資料庫中存在的 collections: {collection_names}")
            except Exception as col_err:
                logging.error(f"❌ 無法列出 collections: {col_err}")

            return jsonify([])  # 返回空陣列

        result = []

        for date_doc in date_docs_list:
            logging.debug(f"🗓️ 處理日期文件: {date_doc.id}")

            # 檢查日期文件的內容
            date_doc_data = date_doc.to_dict()
            logging.debug(f"📄 日期文件內容: {date_doc_data}")

            # 🔍 檢查是否有 items 欄位 (應該是陣列)
            items_data = date_doc_data.get("items", [])

            if not items_data:
                logging.warning(f"❗ 日期文件 {date_doc.id} 沒有 items 欄位")
                continue

            if not isinstance(items_data, list):
                logging.warning(f"❗ items 不是陣列格式: {type(items_data)}")
                continue

            logging.debug(f"📦 目錄 {date_doc.id} 下有 {len(items_data)} 個 items")

            # 處理 items 陣列中的每個項目
            for index, item_data in enumerate(items_data):
                logging.debug(f"🔍 處理 item[{index}]")

                logging.debug(f"📝 Item 原始資料: {item_data}")

                if not isinstance(item_data, dict):
                    logging.warning(f"❗ Item[{index}] 不是字典格式")
                    continue

                # 🔍 印出完整的 item 結構
                logging.debug(f"🔍 Item[{index}] 的所有 keys: {list(item_data.keys())}")

                # 從外層取得欄位
                patron_name = item_data.get("PatronName", "")
                patron_note = item_data.get("PatronNote", "")

                # 從 OrderInfo 取得欄位
                order_info = item_data.get("OrderInfo", {})
                if order_info:
                    payment_date_str = order_info.get("PaymentDate", "")
                    trade_amt = order_info.get("TradeAmt", 0)  # 可能在 OrderInfo 內
                else:
                    payment_date_str = ""
                    trade_amt = 0

                # 如果 TradeAmt 不在 OrderInfo 內，檢查外層
                if trade_amt == 0:
                    trade_amt = item_data.get("TradeAmt", 0)

                # 🔍 印出每一筆資料，協助除錯
                logging.info({
                    "item_index": index,
                    "patronName": patron_name,
                    "patronNote": patron_note,
                    "tradeAmt": trade_amt,
                    "paymentDate": payment_date_str,
                    "orderInfo_keys": list(order_info.keys()) if order_info else [],
                })

                if isinstance(patron_note, str) and "vtmap" in patron_note.lower():
                    logging.info(f"✅ 找到包含 vtmap 的捐款: item[{index}]")
                    try:
                        # Example: "2025/07/03+02:03:58"
                        payment_dt = datetime.strptime(payment_date_str, "%Y/%m/%d+%H:%M:%S")
                        result.append({
                            "patronName": patron_name,
                            "patronNote": patron_note,
                            "tradeAmt": trade_amt,
                            "paymentDate": payment_date_str,
                            "_sortKey": payment_dt  # 暫存排序用
                        })
                    except Exception as parse_err:
                        logging.warning(f"❗ Skip invalid date format in item[{index}]: {payment_date_str} | {parse_err}")
                else:
                    logging.debug(f"⏭️ 跳過不包含 vtmap 的捐款: item[{index}]")

        logging.info(f"🎯 總共找到 {len(result)} 筆符合條件的捐款")

        # Sort by payment date (descending)
        sorted_result = sorted(result, key=lambda x: x["_sortKey"], reverse=True)

        # Remove internal sort key before return
        for r in sorted_result:
            r.pop("_sortKey", None)

        logging.info(f"📤 返回 {len(sorted_result)} 筆捐款資料")
        return jsonify(sorted_result)

    except Exception as e:
        logging.exception("🔥 Failed to fetch donations from Firestore")
        return jsonify({"error": "Internal server error"}), 500