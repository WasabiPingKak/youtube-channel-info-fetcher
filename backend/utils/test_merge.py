import logging
from game_alias_fetcher import fetch_global_alias_map
from game_alias_merger import merge_game_aliases

# 🔹 取得中央設定（從 Google Apps Script Web App）
global_alias_map = fetch_global_alias_map(force_refresh=True)

# 🔹 模擬使用者設定（假設從 Firestore 載入）
user_config = [
    {
        "game": "Final Fantasy XIV",
        "keywords": ["FF14自訂", "測試幻想14"]
    },
    {
        "game": "魔物獵人 荒野",
        "keywords": ["MHWilds", "野外狩獵"]
    },
    {
        "game": "Apex 英雄",
        "keywords": ["APX", "欸配"]  # 欄位中已經有 "欸配"，測試去重行為
    }
]

# 🔁 合併
merged = merge_game_aliases(user_config, global_alias_map)

# 🔎 顯示結果
import json
print(json.dumps(merged, ensure_ascii=False, indent=2))
