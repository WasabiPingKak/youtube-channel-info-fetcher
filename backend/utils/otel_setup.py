"""OpenTelemetry 初始化（僅 Cloud Run 環境啟用）。

將 traces 推送到 GCP Cloud Trace，使用 Application Default Credentials。
本地開發時自動跳過，不影響既有行為。
"""

import logging
import os

logger = logging.getLogger(__name__)


def _requests_request_hook(span, request_obj):
    """注入 X-Request-ID 到 outbound requests 請求 header。"""
    from utils.request_id import get_request_id

    rid = get_request_id()
    if rid != "-":
        request_obj.headers["X-Request-ID"] = rid


def init_otel(app):
    """初始化 OpenTelemetry tracing。

    必須在 app 建立後、路由註冊前呼叫，讓 FlaskInstrumentor 能包裝 WSGI app。
    非 Cloud Run 環境（K_SERVICE 未設定）時直接跳過。
    """
    if not os.getenv("K_SERVICE"):
        logger.info("OTel disabled: not running on Cloud Run")
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
        from opentelemetry.instrumentation.flask import FlaskInstrumentor
        from opentelemetry.instrumentation.requests import RequestsInstrumentor
        from opentelemetry.propagate import set_global_textmap
        from opentelemetry.propagators.cloud_trace_propagator import (
            CloudTraceFormatPropagator,
        )
        from opentelemetry.resourcedetector.gcp_resource_detector import (
            GoogleCloudResourceDetector,
        )
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        # 自動偵測 Cloud Run metadata（service name、revision、region）
        resource = Resource.create().merge(GoogleCloudResourceDetector().detect())

        # Tracer provider + Cloud Trace exporter
        provider = TracerProvider(resource=resource)
        provider.add_span_processor(BatchSpanProcessor(CloudTraceSpanExporter()))
        trace.set_tracer_provider(provider)

        # 解析 Cloud Run Load Balancer 傳入的 X-Cloud-Trace-Context header
        set_global_textmap(CloudTraceFormatPropagator())

        # 自動攔截 Flask request
        FlaskInstrumentor().instrument_app(app)

        # 自動攔截 outbound HTTP（YouTube API、game alias 等）
        # request_hook 注入 X-Request-ID，讓 distributed tracing 鏈路完整
        RequestsInstrumentor().instrument(request_hook=_requests_request_hook)

        logger.info("OpenTelemetry initialized: traces → Cloud Trace")

    except Exception:
        # OTel 失敗不可 crash 服務
        logger.warning("OpenTelemetry 初始化失敗，服務繼續運行（無 tracing）", exc_info=True)
