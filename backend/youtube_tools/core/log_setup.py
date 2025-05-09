import logging
from core.constants import LOG_FILE

# 建立 logger 實例
logger = logging.getLogger("youtube_channel_import")
logger.setLevel(logging.INFO)

# 設定格式
_fmt = logging.Formatter(
    fmt="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# 終端輸出 handler
sh = logging.StreamHandler()
sh.setFormatter(_fmt)
logger.addHandler(sh)

# 檔案輸出 handler
fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
fh.setFormatter(_fmt)
logger.addHandler(fh)
