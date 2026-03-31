# routes/donation_route.py
import logging
from datetime import datetime

from apiflask import APIBlueprint
from flask import jsonify
from google.api_core.exceptions import GoogleAPIError


def init_donation_route(app, db):
    blueprint = APIBlueprint("donation", __name__, tag="Donation")

    @blueprint.route("/donations", methods=["GET"])
    @blueprint.doc(summary="取得贊助清單", description="回傳所有包含 vtmap 關鍵字的贊助紀錄")
    def get_donations():
        try:
            collection_ref = db.collection("donations_by_amount")
            date_docs = list(collection_ref.stream())

            if len(date_docs) == 0:
                return jsonify([])

            result = []

            for date_doc in date_docs:
                date_doc_data = date_doc.to_dict()
                items_data = date_doc_data.get("items", [])

                if not items_data or not isinstance(items_data, list):
                    continue

                for item_data in items_data:
                    if not isinstance(item_data, dict):
                        continue

                    patron_name = item_data.get("PatronName", "")
                    patron_note = item_data.get("PatronNote", "")

                    order_info = item_data.get("OrderInfo", {})
                    if order_info:
                        payment_date_str = order_info.get("PaymentDate", "")
                        trade_amt = order_info.get("TradeAmt", 0)
                    else:
                        payment_date_str = ""
                        trade_amt = 0

                    if trade_amt == 0:
                        trade_amt = item_data.get("TradeAmt", 0)

                    if isinstance(patron_note, str) and "vtmap" in patron_note.lower():
                        try:
                            payment_dt = datetime.strptime(payment_date_str, "%Y/%m/%d+%H:%M:%S")
                            result.append(
                                {
                                    "patronName": patron_name,
                                    "patronNote": patron_note,
                                    "tradeAmt": trade_amt,
                                    "paymentDate": payment_date_str,
                                    "_sortKey": payment_dt,
                                }
                            )
                        except Exception as parse_err:
                            logging.warning(
                                "[Donation] 日期格式解析失敗: %s | %s", payment_date_str, parse_err
                            )

            sorted_result = sorted(result, key=lambda x: x["_sortKey"], reverse=True)
            for r in sorted_result:
                r.pop("_sortKey", None)

            return jsonify(sorted_result)

        except GoogleAPIError:
            logging.exception("[Donation] Firestore 操作失敗")
            return jsonify({"error": "Firestore 操作失敗"}), 500

        except Exception:
            logging.exception("[Donation] 讀取捐款資料失敗")
            return jsonify({"error": "Internal server error"}), 500

    app.register_blueprint(blueprint, url_prefix="/api")
