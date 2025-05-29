from datetime import datetime

def parse_firestore_date(raw) -> datetime | None:
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    elif hasattr(raw, "to_datetime"):
        return raw.to_datetime()
    return None
