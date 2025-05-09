import os
from dotenv import load_dotenv

# 嘗試載入 .env.local（優先使用上層目錄的版本）
loaded = load_dotenv(os.path.join("..", ".env.local")) or load_dotenv(".env.local")

if not loaded:
    print("⚠️ 無法載入 .env.local，請確認檔案存在於專案根目錄或當前目錄")
