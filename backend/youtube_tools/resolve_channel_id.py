# ----------------------------------------
# 📌 使用說明（Usage）
#
# 1. 在上一層資料夾準備 `.env.local`：
#    YOUTUBE_API_KEY=你的API金鑰
#
# 2. 將要解析的 YouTube 頻道網址清單，放入本資料夾的 `channel_list_handle.txt`，一行一個。
#
# 3. 執行此腳本後，會：
#    - 將 UC 開頭的 channel ID 寫入 `channel_list.txt`（一行一筆，append）
#    - 快取 handle ↔ channelId 到 `handle_cache.json`
# ----------------------------------------
# 執行腳本
# python resolve_channel_id.py

import os
import re
import json
import requests
from dotenv import load_dotenv

# ✅ 載入 API 金鑰
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env.local'))
API_KEY = os.getenv("API_KEY")

# ✅ 檔案與快取路徑
CACHE_FILE = "handle_cache.json"
OUTPUT_FILE = "channel_list.txt"
INPUT_FILE = "channel_list_handle.txt"

# ✅ 載入快取（若無則初始化）
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        handle_cache = json.load(f)
else:
    handle_cache = {}

def extract_channel_id(url: str) -> str | None:
    """
    擷取 UC channelId，如果是 @handle 會查 API。
    """
    url = url.strip()

    # 1. 是 UC 格式
    match = re.match(r'^https?://(www\.)?youtube\.com/channel/(UC[\w-]+)', url)
    if match:
        return match.group(2)

    # 2. 是 @handle 格式
    match = re.match(r'^https?://(www\.)?youtube\.com/@([\w\-.]+)', url)
    if match:
        handle = "@" + match.group(2)

        # 查快取
        if handle in handle_cache:
            print(f"✅ 快取命中：{handle} → {handle_cache[handle]}")
            return handle_cache[handle]

        # 查 API
        print(f"🌐 正在查詢 API：{handle}")
        try:
            response = requests.get(
                "https://www.googleapis.com/youtube/v3/channels",
                params={
                    "part": "id",
                    "forHandle": handle,
                    "key": API_KEY
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            if data["items"]:
                channel_id = data["items"][0]["id"]
                handle_cache[handle] = channel_id
                # 更新快取
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(handle_cache, f, ensure_ascii=False, indent=2)
                print(f"✅ 查詢成功：{handle} → {channel_id}")
                return channel_id
            else:
                print(f"❌ 找不到頻道：{handle}")
        except Exception as e:
            print(f"❌ API 錯誤：{e}")
        return None

    # 3. 不支援格式
    print(f"⚠️ 略過不支援格式：{url}")
    return None

# ✅ 讀取網址清單並處理
if not os.path.exists(INPUT_FILE):
    print(f"❌ 找不到輸入檔案：{INPUT_FILE}")
    exit(1)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    urls = [line.strip() for line in f if line.strip()]

print(f"🔍 共讀取 {len(urls)} 筆網址，開始處理...\n")

success_count = 0
with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f:
    for url in urls:
        channel_id = extract_channel_id(url)
        if channel_id:
            out_f.write(channel_id + "\n")
            success_count += 1

print(f"\n✅ 完成處理，共寫入 {success_count} 筆 channel ID 到 {OUTPUT_FILE}")
