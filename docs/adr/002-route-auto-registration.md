# ADR-002：Route 自動註冊機制

## 狀態

已採用

## 背景

隨著 API endpoint 數量增長（目前 26 個 route 模組），手動在 `app.py` 逐一 import 並註冊路由會導致：

- `app.py` 膨脹，每新增 route 都需修改進入點
- 容易遺漏註冊，造成 endpoint 無法存取

## 決策

採用 **反射式自動掃描**機制：`utils/route_loader.py` 在啟動時掃描 `routes/` package 下所有模組，自動呼叫符合 `init_*` 命名慣例的函式。

### 運作方式

1. `pkgutil.iter_modules()` 列舉 `routes/` 下所有模組
2. `inspect.getmembers()` 找出 `init_` 開頭的函式
3. 依函式簽名判斷是否需要 `db` 參數：有 `db` 則傳入 `(app, db)`，否則傳入 `(app)`
4. `app.py` 只需一行 `register_all_routes(app, db)`

### 慣例約束

- 每個 route 模組必須定義 `init_<name>_route(app, db)` 或 `init_<name>_route(app)` 函式
- 函式名稱必須以 `init_` 開頭，否則不會被掃描到

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| 手動 import | 明確、IDE 可追蹤 | 隨 route 數量增長難以維護 |
| Flask Blueprint auto-register | Flask 原生 | 仍需手動 `register_blueprint` |
| 第三方 auto-discovery（如 flask-rebar） | 標準化 | 多一個 dependency |

## 影響

- **正面**：新增 route 只需在 `routes/` 建檔，零修改 `app.py`
- **負面**：隱式發現機制在 IDE 中不易追蹤呼叫鏈；命名慣例違反時 route 會靜默失效
- **緩解**：啟動時 log 輸出已註冊的函式數量，可快速發現遺漏
- **關鍵檔案**：`backend/utils/route_loader.py`、`backend/routes/`
