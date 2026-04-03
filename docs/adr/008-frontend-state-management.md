# ADR-008：前端狀態管理 — Zustand + TanStack Query

## 狀態

已採用

## 背景

VTMap 前端需要管理兩類狀態：

1. **Server state**：來自後端 API 的資料（頻道列表、影片分類結果、趨勢排行等），具有快取、失效、重新取得等需求
2. **Client state**：UI 互動狀態（分類編輯器的暫存修改、表單狀態等），僅存在於前端

這兩類狀態的生命週期和更新模式截然不同，混在一起管理會增加複雜度。

## 決策

採用 **雙軌策略**：

- **TanStack Query**（React Query）：管理所有 server state
- **Zustand**：管理 client state

### TanStack Query 設定

```typescript
// 全域預設：12 小時快取 + localStorage 持久化
staleTime: 1000 * 60 * 60 * 12   // 12 小時不重新取得
gcTime: 1000 * 60 * 60 * 12      // 12 小時後清除快取
maxAge: 1000 * 60 * 60 * 12      // localStorage 持久化最長 12 小時
```

- `createSyncStoragePersister` 將快取寫入 localStorage，頁面重新載入後不需重新請求
- `ReactQueryDevtools` 在開發環境自動啟用

### Zustand 使用場景

- `useQuickCategoryEditorStore`：分類編輯器的 optimistic update + rollback
- 各類 UI 互動狀態的暫存

### Zustand 設計模式

- Store 包含 state + async actions，actions 內直接呼叫 API
- Optimistic update：先更新 local state，API 失敗時 rollback
- Toast notification 整合在 store actions 中

## 評估過的替代方案

| 方案 | 優點 | 缺點 |
|------|------|------|
| Redux Toolkit + RTK Query | 完整生態、DevTools 強大 | Boilerplate 多，對本專案規模過重 |
| SWR + Context | 輕量 | SWR 快取策略不如 TanStack Query 彈性 |
| 純 Context + useReducer | 零依賴 | 手動處理快取、失效、loading state |

## 影響

- **正面**：server state 的快取、失效、重試全由 TanStack Query 處理；Zustand 的 API 極簡，新增 store 只需幾行
- **負面**：localStorage 持久化是全域啟用，所有 query 都會被快取（需注意敏感資料）
- **已知限制**：目前無從 Pydantic schema 自動產生 TypeScript 型別，前後端型別需手動同步
- **關鍵檔案**：`frontend_react/src/main.tsx`（Query Client 設定）、`frontend_react/src/stores/`
