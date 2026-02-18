#!/usr/bin/env python3
"""
migrate_prod_to_staging.py
--------------------------
將 Production Firestore 資料庫複製到 Staging 環境

功能：
- 完整複製所有 Collections 與 Subcollections
- 支援資料過濾（保留 N 天資料）
- 自動脫敏（移除 OAuth tokens）
- 安全檢查（防止反向複製）
- 進度顯示與統計

使用範例：
  python tools/migrate_prod_to_staging.py --full --days 90
  python tools/migrate_prod_to_staging.py --full --dry-run
  python tools/migrate_prod_to_staging.py --collections channel_data,channel_index_batch
"""

import sys
import os
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Set
from collections import defaultdict

# 加入專案根目錄以匯入模組
sys.path.append(str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv
from google.cloud import firestore
from google.oauth2 import service_account
from google.api_core.exceptions import GoogleAPIError

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
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


# ============================================================================
# 常數定義
# ============================================================================

# 所有 Collection 列表（按複製順序）
ALL_COLLECTIONS = [
    "global_settings",              # 全域設定（優先）
    "channel_index_batch",          # 頻道索引批次
    "channel_data",                 # 頻道資料（含 subcollections）
    "channel_sync_index",           # 同步追蹤
    "trending_games_daily",         # 趨勢資料
    "stats_cache",                  # 快取資料
    "live_redirect_cache",          # 直播快取
    "live_redirect_notify_queue",   # 通知佇列
    "channel_index",                # 遺留索引（最後）
]

# 需要脫敏的路徑（移除敏感資料）
SANITIZE_PATHS = [
    "channel_data/*/channel_info/meta",  # OAuth tokens
]

# 需要遞迴複製 subcollections 的 collections
RECURSIVE_COLLECTIONS = {
    "channel_data",  # 需要複製所有 subcollections
}

# Batch write 大小限制
BATCH_SIZE = 500

# ============================================================================
# Firestore 客戶端初始化
# ============================================================================

def init_firestore_clients():
    """
    初始化 Production 和 Staging 的 Firestore 客戶端

    Returns:
        tuple: (source_db, target_db, source_db_id, target_db_id)
    """
    # 明確指定資料庫 ID
    source_db_id = os.getenv("SOURCE_FIRESTORE_DATABASE", "(default)")
    target_db_id = os.getenv("TARGET_FIRESTORE_DATABASE", "staging")

    logger.info(f"初始化 Firestore 客戶端...")
    logger.info(f"  來源資料庫: {source_db_id}")
    logger.info(f"  目標資料庫: {target_db_id}")

    try:
        credentials = service_account.Credentials.from_service_account_file(
            str(firebase_key_path)
        )
        project_id = credentials.project_id

        source_db = firestore.Client(
            credentials=credentials,
            project=project_id,
            database=source_db_id
        )

        target_db = firestore.Client(
            credentials=credentials,
            project=project_id,
            database=target_db_id
        )

        logger.info("✓ Firestore 客戶端初始化成功")
        return source_db, target_db, source_db_id, target_db_id

    except Exception as e:
        logger.error(f"❌ 初始化 Firestore 客戶端失敗: {e}")
        raise


# ============================================================================
# 安全檢查
# ============================================================================

def validate_migration_direction(source_db_id: str, target_db_id: str):
    """
    驗證遷移方向，防止誤操作
    """
    logger.info("執行安全檢查...")

    # 檢查：禁止從 Staging 複製到 Production
    if source_db_id == "staging" and target_db_id == "(default)":
        logger.error("❌ 安全檢查失敗！")
        logger.error("❌ 禁止從 Staging 複製到 Production！")
        logger.error("❌ 這個操作會覆蓋正式環境資料，請檢查環境變數設定。")
        sys.exit(1)

    # 檢查：來源和目標不能相同
    if source_db_id == target_db_id:
        logger.error("❌ 安全檢查失敗！")
        logger.error(f"❌ 來源和目標資料庫相同 ({source_db_id})！")
        logger.error("❌ 請檢查環境變數設定。")
        sys.exit(1)

    logger.info("✓ 安全檢查通過")
    logger.info(f"  複製方向: {source_db_id} → {target_db_id}")


def confirm_migration(source_db_id: str, target_db_id: str, dry_run: bool):
    """
    要求使用者確認遷移操作
    """
    if dry_run:
        logger.info("🚧 Dry Run 模式：不會實際寫入資料")
        return

    print("\n" + "=" * 60)
    print("⚠️  警告：此操作將覆蓋 Staging 資料庫的所有資料！")
    print("=" * 60)
    print(f"來源資料庫: {source_db_id}")
    print(f"目標資料庫: {target_db_id}")
    print("=" * 60)

    try:
        response = input("\n請輸入 'yes' 以確認繼續: ").strip().lower()
        if response != 'yes':
            print("❌ 操作已取消")
            sys.exit(0)
    except KeyboardInterrupt:
        print("\n❌ 操作已取消")
        sys.exit(0)

    print("\n開始執行遷移...\n")


# ============================================================================
# 資料脫敏
# ============================================================================

def should_sanitize_document(doc_path: str, sanitize: bool) -> bool:
    """
    判斷文件是否需要脫敏

    Args:
        doc_path: 文件路徑，例如 "channel_data/UCxxx/channel_info/meta"
        sanitize: 是否啟用脫敏模式

    Returns:
        bool: 是否需要脫敏
    """
    if not sanitize:
        return False

    for pattern in SANITIZE_PATHS:
        # 簡單的模式匹配（支援 * 萬用字元）
        pattern_parts = pattern.split("/")
        path_parts = doc_path.split("/")

        if len(pattern_parts) != len(path_parts):
            continue

        match = all(
            p == "*" or p == path_part
            for p, path_part in zip(pattern_parts, path_parts)
        )

        if match:
            return True

    return False


def sanitize_document_data(data: Dict, doc_path: str) -> Dict:
    """
    移除文件中的敏感資料

    Args:
        data: 原始文件資料
        doc_path: 文件路徑

    Returns:
        Dict: 脫敏後的資料
    """
    sanitized = data.copy()

    # 移除 OAuth tokens
    sensitive_fields = ["refresh_token", "access_token"]
    removed_fields = []

    for field in sensitive_fields:
        if field in sanitized:
            del sanitized[field]
            removed_fields.append(field)

    if removed_fields:
        logger.debug(f"  脫敏: {doc_path} (移除 {', '.join(removed_fields)})")

    return sanitized


# ============================================================================
# 文件過濾
# ============================================================================

def should_copy_document(
    doc_id: str,
    data: Dict,
    collection_name: str,
    days_filter: Optional[int]
) -> bool:
    """
    判斷文件是否應該被複製

    Args:
        doc_id: 文件 ID
        data: 文件資料
        collection_name: Collection 名稱
        days_filter: 保留天數（None 表示全部複製）

    Returns:
        bool: 是否應該複製
    """
    # 無過濾條件，全部複製
    if days_filter is None:
        return True

    # 時效性資料：根據文件 ID 判斷（YYYY-MM-DD 格式）
    if collection_name in ["trending_games_daily", "live_redirect_cache", "live_redirect_notify_queue"]:
        try:
            # 文件 ID 格式: YYYY-MM-DD
            doc_date = datetime.strptime(doc_id, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_filter)
            return doc_date >= cutoff_date
        except ValueError:
            # 無法解析日期，全部複製
            return True

    # 其他 Collection：根據 updatedAt 或 createdAt 欄位
    date_fields = ["updatedAt", "createdAt", "joinedAt", "publishDate"]
    for field in date_fields:
        if field in data:
            try:
                field_value = data[field]

                # 處理 Firestore Timestamp
                if hasattr(field_value, "timestamp"):
                    doc_timestamp = field_value
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_filter)
                    return datetime.fromtimestamp(
                        doc_timestamp.timestamp(), tz=timezone.utc
                    ) >= cutoff_date

                # 處理 ISO 8601 字串
                elif isinstance(field_value, str):
                    doc_date = datetime.fromisoformat(
                        field_value.replace("Z", "+00:00")
                    )
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_filter)
                    return doc_date >= cutoff_date

            except (ValueError, AttributeError):
                continue

    # 沒有時間欄位，全部複製
    return True


# ============================================================================
# Collection 複製
# ============================================================================

def copy_collection(
    source_db: firestore.Client,
    target_db: firestore.Client,
    collection_name: str,
    sanitize: bool = True,
    days_filter: Optional[int] = None,
    dry_run: bool = False,
    stats: Dict = None
) -> int:
    """
    複製單個 Collection

    Returns:
        int: 複製的文件數量
    """
    logger.info(f"[{collection_name}] 開始複製...")

    try:
        source_col = source_db.collection(collection_name)
        target_col = target_db.collection(collection_name)

        # 讀取所有文件
        docs = list(source_col.stream())
        total_docs = len(docs)
        copied_docs = 0
        skipped_docs = 0

        if total_docs == 0:
            logger.info(f"[{collection_name}] 無文件，略過")
            return 0

        logger.info(f"[{collection_name}] 找到 {total_docs} 個文件")

        # 批次寫入
        batch = target_db.batch()
        batch_count = 0

        for i, doc in enumerate(docs, 1):
            doc_id = doc.id
            data = doc.to_dict()

            if data is None:
                continue

            # 過濾：檢查是否應該複製
            if not should_copy_document(doc_id, data, collection_name, days_filter):
                skipped_docs += 1
                continue

            # 脫敏：移除敏感資料
            doc_path = f"{collection_name}/{doc_id}"
            if should_sanitize_document(doc_path, sanitize):
                data = sanitize_document_data(data, doc_path)

            # 寫入目標資料庫
            if not dry_run:
                target_doc_ref = target_col.document(doc_id)
                batch.set(target_doc_ref, data)
                batch_count += 1

                # 每 BATCH_SIZE 筆提交一次
                if batch_count >= BATCH_SIZE:
                    batch.commit()
                    batch = target_db.batch()
                    batch_count = 0

            copied_docs += 1

            # 進度顯示
            if i % 100 == 0 or i == total_docs:
                progress = (i / total_docs) * 100
                logger.info(
                    f"[{collection_name}] 進度: {i}/{total_docs} "
                    f"({progress:.1f}%) - 複製 {copied_docs} 筆"
                )

        # 提交剩餘的 batch
        if batch_count > 0 and not dry_run:
            batch.commit()

        logger.info(
            f"[{collection_name}] 完成 - "
            f"複製 {copied_docs} 筆，略過 {skipped_docs} 筆"
        )

        # 更新統計
        if stats is not None:
            stats["total_docs"] += copied_docs
            stats["skipped_docs"] += skipped_docs

        # 遞迴複製 subcollections
        if collection_name in RECURSIVE_COLLECTIONS:
            subcol_count = copy_subcollections(
                source_db, target_db, collection_name, docs,
                sanitize, days_filter, dry_run, stats
            )
            logger.info(
                f"[{collection_name}] Subcollections 複製完成 - {subcol_count} 個文件"
            )

        return copied_docs

    except GoogleAPIError as e:
        logger.error(f"[{collection_name}] Firestore 存取錯誤: {e}")
        raise
    except Exception as e:
        logger.error(f"[{collection_name}] 複製失敗: {e}")
        raise


def copy_subcollections(
    source_db: firestore.Client,
    target_db: firestore.Client,
    parent_collection: str,
    parent_docs: List,
    sanitize: bool,
    days_filter: Optional[int],
    dry_run: bool,
    stats: Dict
) -> int:
    """
    遞迴複製 Subcollections

    Returns:
        int: 複製的文件總數
    """
    total_copied = 0

    for parent_doc in parent_docs:
        parent_id = parent_doc.id

        # 取得所有 subcollections
        subcols = parent_doc.reference.collections()

        for subcol in subcols:
            subcol_name = subcol.id
            subcol_path = f"{parent_collection}/{parent_id}/{subcol_name}"

            # 讀取 subcollection 的所有文件
            subdocs = list(subcol.stream())

            if not subdocs:
                continue

            logger.info(f"  [{subcol_path}] 找到 {len(subdocs)} 個文件")

            # 批次寫入
            batch = target_db.batch()
            batch_count = 0
            copied_count = 0

            for subdoc in subdocs:
                subdoc_id = subdoc.id
                subdata = subdoc.to_dict()

                if subdata is None:
                    continue

                # 過濾
                if not should_copy_document(subdoc_id, subdata, subcol_name, days_filter):
                    continue

                # 脫敏
                subdoc_path = f"{subcol_path}/{subdoc_id}"
                if should_sanitize_document(subdoc_path, sanitize):
                    subdata = sanitize_document_data(subdata, subdoc_path)

                # 寫入
                if not dry_run:
                    target_parent_ref = target_db.collection(parent_collection).document(parent_id)
                    target_subdoc_ref = target_parent_ref.collection(subcol_name).document(subdoc_id)
                    batch.set(target_subdoc_ref, subdata)
                    batch_count += 1

                    if batch_count >= BATCH_SIZE:
                        batch.commit()
                        batch = target_db.batch()
                        batch_count = 0

                copied_count += 1

            # 提交剩餘的 batch
            if batch_count > 0 and not dry_run:
                batch.commit()

            logger.info(f"  [{subcol_path}] 完成 - 複製 {copied_count} 筆")
            total_copied += copied_count

            if stats is not None:
                stats["total_docs"] += copied_count

    return total_copied


# ============================================================================
# 主程式
# ============================================================================

def parse_arguments():
    """解析命令列參數"""
    parser = argparse.ArgumentParser(
        description="將 Production Firestore 資料庫複製到 Staging 環境",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 完整複製（保留 90 天資料，自動脫敏）
  python tools/migrate_prod_to_staging.py --full --days 90

  # 完整複製所有歷史資料
  python tools/migrate_prod_to_staging.py --full --all-history

  # 只複製指定 Collections
  python tools/migrate_prod_to_staging.py --collections channel_data,channel_index_batch --days 90

  # Dry Run 模式（不實際寫入）
  python tools/migrate_prod_to_staging.py --full --days 90 --dry-run

  # 不脫敏模式（保留 OAuth tokens，僅用於特殊測試）
  python tools/migrate_prod_to_staging.py --full --days 90 --no-sanitize
        """
    )

    # 模式選擇
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        "--full",
        action="store_true",
        help="完整複製所有 Collections"
    )
    mode_group.add_argument(
        "--collections",
        type=str,
        help="只複製指定的 Collections（逗號分隔），例如: channel_data,channel_index_batch"
    )

    # 資料過濾
    filter_group = parser.add_mutually_exclusive_group()
    filter_group.add_argument(
        "--days",
        type=int,
        default=90,
        help="保留最近 N 天的資料（預設: 90）"
    )
    filter_group.add_argument(
        "--all-history",
        action="store_true",
        help="複製所有歷史資料（不過濾）"
    )

    # 脫敏選項
    parser.add_argument(
        "--no-sanitize",
        action="store_true",
        help="不脫敏（保留 OAuth tokens 等敏感資料）"
    )

    # Dry Run
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Dry Run 模式：只顯示會複製什麼，不實際執行"
    )

    return parser.parse_args()


def main():
    """主程式進入點"""
    args = parse_arguments()

    # 初始化
    source_db, target_db, source_db_id, target_db_id = init_firestore_clients()

    # 安全檢查
    validate_migration_direction(source_db_id, target_db_id)
    confirm_migration(source_db_id, target_db_id, args.dry_run)

    # 決定要複製的 Collections
    if args.full:
        collections_to_copy = ALL_COLLECTIONS
    else:
        collections_to_copy = [c.strip() for c in args.collections.split(",")]

    # 資料過濾設定
    days_filter = None if args.all_history else args.days
    sanitize = not args.no_sanitize

    # 統計資訊
    stats = {
        "total_collections": len(collections_to_copy),
        "total_docs": 0,
        "skipped_docs": 0,
        "start_time": datetime.now(),
    }

    # 顯示配置
    print("=" * 70)
    print("Firestore Migration Tool")
    print(f"{source_db_id} → {target_db_id}")
    print("=" * 70)
    print(f"Collections: {', '.join(collections_to_copy)}")
    print(f"資料過濾: {'所有歷史資料' if days_filter is None else f'最近 {days_filter} 天'}")
    print(f"脫敏模式: {'是' if sanitize else '否'}")
    print(f"Dry Run: {'是' if args.dry_run else '否'}")
    print("=" * 70)
    print()

    # 執行複製
    try:
        for i, collection_name in enumerate(collections_to_copy, 1):
            print(f"\n[{i}/{len(collections_to_copy)}] 正在複製: {collection_name}")
            print("-" * 70)

            copy_collection(
                source_db=source_db,
                target_db=target_db,
                collection_name=collection_name,
                sanitize=sanitize,
                days_filter=days_filter,
                dry_run=args.dry_run,
                stats=stats
            )

        # 顯示摘要
        stats["end_time"] = datetime.now()
        stats["duration"] = stats["end_time"] - stats["start_time"]

        print("\n" + "=" * 70)
        print("Migration Summary")
        print("=" * 70)
        print(f"Total Collections: {stats['total_collections']}")
        print(f"Total Documents Copied: {stats['total_docs']:,}")
        print(f"Documents Skipped: {stats['skipped_docs']:,}")
        print(f"Total Time: {stats['duration']}")
        print(f"Status: {'✓ Dry Run Completed' if args.dry_run else '✓ Success'}")
        print("=" * 70)

    except KeyboardInterrupt:
        print("\n\n❌ 操作被使用者中斷")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ 遷移過程中發生錯誤: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
