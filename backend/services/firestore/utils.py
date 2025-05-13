from typing import Dict, Optional

def needs_update_info(existing: Optional[Dict], new: Dict) -> bool:
    if not existing:
        return True
    return (
        existing.get("name") != new["name"]
        or existing.get("thumbnail") != new["thumbnail"]
        or existing.get("url") != new["url"]
    )
