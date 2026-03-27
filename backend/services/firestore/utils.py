def needs_update_info(existing: dict | None, new: dict) -> bool:
    if not existing:
        return True
    return (
        existing.get("name") != new["name"]
        or existing.get("thumbnail") != new["thumbnail"]
        or existing.get("url") != new["url"]
    )
