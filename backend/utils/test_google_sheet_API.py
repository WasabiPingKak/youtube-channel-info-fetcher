"""
執行
python test_google_sheet_API.py

可以直接測試能否拿到 json
"""
from game_alias_fetcher import fetch_global_alias_map

data = fetch_global_alias_map(force_refresh=True)
print(data)