# ADR-010: 頻道頁面改為三頁籤佈局

## 狀態
已採用 (2026-04-06)

## 背景
原頻道頁面將所有內容（頻道資訊、Treemap/Heatmap、影片類型 tab、分類 tab、圖表切換、圓餅/長條圖、影片列表）垂直堆疊在同一頁面。操作區佔據大量視覺空間，使用者需捲動很久才能看到影片列表，且多層控制項（兩層 tab + 圖表切換 + 排序）造成認知負擔。

## 決策
將頻道頁面拆為三個頁籤，各自聚焦一個任務：

1. **總覽**：圓餅/長條圖 + Treemap，用 segment control 切換影片類型
2. **影片**：一行 filter bar（類型 segment + 分類 chip + 排序 dropdown）+ 影片列表
3. **活躍時段**：全頁 Heatmap

新增圖表→影片聯動：點擊圓餅圖圖例自動跳轉到影片頁籤並帶入該分類。

## 配套變更
- 建立 `categoryColors.ts` 共用配色系統，badge / chip / 圖表共用色碼
- 分類選擇從 dropdown 改為攤平 chip，配色與 badge 一致
- Treemap drill-down 從 ECharts 內建 click 改為外部分類 chip 控制
- 圓餅圖、長條圖、Treemap、Heatmap 統一深色模式支援
- 載入狀態改用 skeleton 效果

## 影響
- 刪除 7 個舊元件（TopLevelTabs、SubCategoryTabs、ContentExportCardSection 等）
- 新增 4 個頁籤 section 元件 + 2 個 skeleton 元件
- 前端路由不變（仍為 `/videos?channel=`），頁籤狀態為 client-side state
