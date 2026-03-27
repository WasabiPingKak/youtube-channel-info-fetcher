import logging
from typing import Any

from utils.categorizer import normalize

logger = logging.getLogger(__name__)
logger.debug("📦 [game_alias_merger.py] 模組已開始執行")


def merge_game_aliases(
    user_config: list[dict[str, Any]], global_alias_map: dict[str, list[str]]
) -> list[dict[str, Any]]:
    """
    合併使用者設定與中央 Google Sheet 遊戲別名設定。
    使用者設定為補充（非覆蓋），根據遊戲名稱比對。
    """
    logger.debug("🔧 merge_game_aliases() 被呼叫")
    logger.debug("🌐 中央遊戲條目數量：%d", len(global_alias_map))
    logger.debug("📥 使用者自訂遊戲條目數量：%d", len(user_config))

    merged: dict[str, dict[str, Any]] = {}

    # 1️⃣ 先加入 Google Sheet 資料
    for game, aliases in global_alias_map.items():
        unique_map = {}
        for alias in aliases:
            key = normalize(alias)
            if key not in unique_map:
                unique_map[key] = alias
        merged[game] = {"game": game, "keywords": list(unique_map.values())}
        logger.debug("📄 加入中央遊戲 [%s] → %d 筆別名", game, len(unique_map))

    # 2️⃣ 再補上使用者設定（補充 keywords）
    for entry in user_config:
        game = entry.get("game")
        keywords = entry.get("keywords")

        if not game or not isinstance(keywords, list):
            logger.warning(f"⚠️ 無效的使用者設定（跳過）: {entry}")
            continue

        existing_entry = merged.get(game)
        if existing_entry:
            logger.debug("🔁 合併使用者設定 → [%s]", game)
        else:
            logger.debug("🆕 新增使用者自訂遊戲 → [%s]", game)

        normalized_existing = {normalize(kw): kw for kw in merged.get(game, {}).get("keywords", [])}

        for kw in keywords:
            key = normalize(kw)
            if key not in normalized_existing:
                normalized_existing[key] = kw
                logger.debug(f"➕ 使用者補充 [{game}] → {kw}")

        # 寫回 merged 結構
        merged[game] = {"game": game, "keywords": list(normalized_existing.values())}

    logger.debug("✅ merge_game_aliases() 完成，總遊戲數量：%d", len(merged))
    return list(merged.values())
