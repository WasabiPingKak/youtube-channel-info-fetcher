# ADR-009：靜態型別檢查從 pyright 遷移至 mypy

## 狀態

已採用

## 背景

專案原本使用 pyright（standard mode）做 Python 靜態型別檢查，僅在 pre-commit hook 本地執行。隨著團隊工具鏈標準化需求，決定遷移至 mypy。

## 決策

採用 mypy 取代 pyright，搭配以下設定：

- `check_untyped_defs = true`：檢查無型別註解的函式內部
- `warn_return_any = true`：警告回傳 Any 的型別不安全
- `warn_unused_ignores = true`：自動偵測過時的 type: ignore 註解
- Per-module `ignore_missing_imports`：僅對缺乏 stubs 的第三方套件（Firebase、OpenTelemetry 等）關閉 import 檢查
- 安裝 `google-api-python-client-stubs` 提供 YouTube API 的具體型別

## 影響

- `# type: ignore` 註解從 pyright error code（`reportAttributeAccessIssue`）改為 mypy error code（`union-attr`）
- Firestore SDK 的 `.exists`/`.to_dict()` 仍需 `# type: ignore[union-attr]`（SDK 型別定義將 sync 與 async 合併為 union）
- Google API Client 的 `execute()` 回傳值從 `Any` 變為具體 TypedDict（如 `ChannelListResponse`），需用 `dict()` 包裝以相容既有 `-> dict` 簽名
