# routes/ecpay_return_route.py
import logging

from apiflask import APIBlueprint
from flask import request

from services.ecpay_service import handle_ecpay_return
from utils.rate_limiter import limiter


def init_ecpay_return_route(app, db):
    blueprint = APIBlueprint("ecpay_return", __name__, tag="Payment")

    @blueprint.route("/ecpay/return", methods=["POST"])
    @blueprint.doc(summary="綠界付款回調", description="接收綠界 ECPay 付款結果通知", hide=True)
    @limiter.limit("20 per minute")
    def ecpay_return():
        try:
            if request.is_json:
                payload = request.get_json()
            else:
                payload = request.form.to_dict()

            result = handle_ecpay_return(payload, db)
            return result
        except Exception as e:
            logging.error("❌ 處理綠界回傳失敗：%s", e, exc_info=True)
            return "0|Error", 400

    app.register_blueprint(blueprint)
