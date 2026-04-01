# utils/breaker_instances.py
# 全域熔斷器實例 — YouTube API 與 Firestore 各自獨立

from utils.circuit_breaker import CircuitBreaker

youtube_breaker = CircuitBreaker(
    name="youtube_api",
    failure_threshold=5,
    recovery_timeout=30.0,
    half_open_max_calls=1,
)

firestore_breaker = CircuitBreaker(
    name="firestore",
    failure_threshold=5,
    recovery_timeout=30.0,
    half_open_max_calls=1,
)
