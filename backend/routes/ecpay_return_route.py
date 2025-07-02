# routes/ecpay_return_route.py
import logging
from flask import request
from flask import Blueprint
from services.ecpay_service import handle_ecpay_return

def init_ecpay_return_route(app, db):
    blueprint = Blueprint("ecpay_return", __name__)

    @blueprint.route("/ecpay/return", methods=["POST"])
    def ecpay_return():
        logging.info("[ECPay Route] request.content_type: %s", request.content_type)
        logging.info("[ECPay Route] request.get_data: %r", request.get_data())
        logging.info("[ECPay Route] request.form: %s", request.form)

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
