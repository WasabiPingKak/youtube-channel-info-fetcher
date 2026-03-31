#!/usr/bin/env python3
"""
migrate_tokens_to_kms.py
------------------------
將 Firestore 中未加密的 refresh_token 批次加密為 KMS 密文

功能：
- 掃描所有 channel_data/*/channel_info/meta 文件
- 偵測未加密的明文 refresh_token（非 base64 格式）
- 使用 KMS 加密後寫回 Firestore
- 支援 --dry-run 模式預覽影響範圍
- 支援指定目標資料庫（預設 production）

使用範例：
  # Dry Run（預覽影響範圍，不實際寫入）
  python tools/migrate_tokens_to_kms.py --dry-run

  # 正式執行（加密 production 資料庫）
  python tools/migrate_tokens_to_kms.py

  # 指定資料庫
  python tools/migrate_tokens_to_kms.py --database staging --dry-run
"""

import argparse
import base64
import logging
import os
import sys
from pathlib import Path

# 加入專案根目錄以匯入模組
sys.path.append(str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
from google.cloud import firestore
from google.oauth2 import service_account

from utils.kms_crypto import is_kms_configured, kms_encrypt

# 載入環境變數
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env.local")
project_root = Path(__file__).resolve().parents[2]
firebase_key_path = (project_root / os.getenv("FIREBASE_KEY_PATH", "")).resolve()

os.environ["FIREBASE_KEY_PATH"] = str(firebase_key_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(firebase_key_path)

# Logging 設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def is_plaintext_token(token: str) -> bool:
    """
    判斷 token 是否為未加密的明文。
    KMS 加密後的 token 是合法的 base64 字串；
    Google OAuth refresh_token 通常以 '1//' 開頭，不是合法 base64。
    """
    try:
        decoded = base64.b64decode(token, validate=True)
        # 合法 base64 且重新編碼後與原文一致 → 視為已加密
        return base64.b64encode(decoded).decode("utf-8") != token
    except Exception:
        return True


def init_firestore_client(database_id: str) -> firestore.Client:
    """初始化 Firestore 客戶端"""
    credentials = service_account.Credentials.from_service_account_file(str(firebase_key_path))
    project_id = credentials.project_id

    client = firestore.Client(
        credentials=credentials, project=project_id, database=database_id
    )
    logger.info(f"✓ Firestore 客戶端初始化成功（資料庫: {database_id}）")
    return client


def migrate_tokens(db: firestore.Client, dry_run: bool) -> dict:
    """
    掃描所有 channel_data 下的 meta 文件，將明文 refresh_token 加密寫回。

    Returns:
        dict: 統計結果
    """
    stats = {
        "scanned": 0,
        "plaintext_found": 0,
        "encrypted": 0,
        "skipped_no_token": 0,
        "already_encrypted": 0,
        "errors": 0,
    }

    # 取得所有 channel_data 下的文件
    channel_docs = db.collection("channel_data").stream()

    for channel_doc in channel_docs:
        channel_id = channel_doc.id
        meta_ref = (
            db.collection("channel_data")
            .document(channel_id)
            .collection("channel_info")
            .document("meta")
        )
        meta_doc = meta_ref.get()

        stats["scanned"] += 1

        if not meta_doc.exists:
            continue

        data = meta_doc.to_dict()
        raw_token = data.get("refresh_token")

        if not raw_token:
            stats["skipped_no_token"] += 1
            logger.debug(f"  [{channel_id}] 無 refresh_token，略過")
            continue

        if not is_plaintext_token(raw_token):
            stats["already_encrypted"] += 1
            logger.debug(f"  [{channel_id}] 已加密，略過")
            continue

        # 找到明文 token
        stats["plaintext_found"] += 1
        # 遮蔽顯示：只顯示前 4 字元
        masked = raw_token[:4] + "****"
        logger.info(f"  [{channel_id}] 發現明文 token ({masked})")

        if dry_run:
            continue

        # 加密並寫回
        try:
            encrypted_token = kms_encrypt(raw_token)
            meta_ref.update({"refresh_token": encrypted_token})
            stats["encrypted"] += 1
            logger.info(f"  [{channel_id}] ✅ 加密完成")
        except Exception:
            stats["errors"] += 1
            logger.exception(f"  [{channel_id}] ❌ 加密失敗")

    return stats


def parse_arguments():
    """解析命令列參數"""
    parser = argparse.ArgumentParser(
        description="將 Firestore 中未加密的 refresh_token 批次加密為 KMS 密文",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # Dry Run（預覽影響範圍）
  python tools/migrate_tokens_to_kms.py --dry-run

  # 正式執行
  python tools/migrate_tokens_to_kms.py

  # 指定資料庫
  python tools/migrate_tokens_to_kms.py --database staging --dry-run
        """,
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Dry Run 模式：只掃描並顯示需要加密的 token，不實際寫入",
    )
    parser.add_argument(
        "--database",
        type=str,
        default="(default)",
        help="Firestore 資料庫 ID（預設: (default)，即 production）",
    )

    return parser.parse_args()


def main():
    """主程式進入點"""
    args = parse_arguments()

    # 檢查 KMS 是否已設定（dry-run 僅掃描不加密，不需要 KMS）
    if not args.dry_run and not is_kms_configured():
        logger.error("❌ KMS 未設定！請確認環境變數 GOOGLE_CLOUD_PROJECT、KMS_KEY_RING、KMS_KEY_ID")
        logger.error("   此腳本需要 KMS 才能加密 token，不可在未設定 KMS 的環境下執行。")
        sys.exit(1)

    # 初始化 Firestore
    db = init_firestore_client(args.database)

    # 顯示配置
    print("=" * 60)
    print("Refresh Token KMS Migration")
    print("=" * 60)
    print(f"資料庫: {args.database}")
    print(f"Dry Run: {'是' if args.dry_run else '否'}")
    print("=" * 60)

    if not args.dry_run:
        try:
            response = input("\n⚠️  此操作將修改 Firestore 資料，請輸入 'yes' 以確認: ").strip().lower()
            if response != "yes":
                print("❌ 操作已取消")
                sys.exit(0)
        except KeyboardInterrupt:
            print("\n❌ 操作已取消")
            sys.exit(0)

    print()
    logger.info("開始掃描 channel_data...")

    # 執行遷移
    stats = migrate_tokens(db, args.dry_run)

    # 顯示結果
    print()
    print("=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"掃描頻道數: {stats['scanned']}")
    print(f"無 token: {stats['skipped_no_token']}")
    print(f"已加密: {stats['already_encrypted']}")
    print(f"發現明文: {stats['plaintext_found']}")
    if args.dry_run:
        print("狀態: 🚧 Dry Run 完成（未寫入）")
    else:
        print(f"成功加密: {stats['encrypted']}")
        print(f"加密失敗: {stats['errors']}")
        status = "✓ 完成" if stats["errors"] == 0 else "⚠️ 完成（有錯誤）"
        print(f"狀態: {status}")
    print("=" * 60)


if __name__ == "__main__":
    main()
