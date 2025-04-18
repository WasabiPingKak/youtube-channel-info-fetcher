# Pages 目錄

本目錄包含應用程式的主要頁面元件，用於路由和顯示不同功能模組。

## 檔案結構

- `VideoExplorerPage.jsx`: 影片瀏覽頁面

## 詳細說明

### VideoExplorerPage.jsx

該頁面用於瀏覽和分類查看 YouTube 頻道的影片內容。

#### 功能介紹
- 支援三種內容類型切換：直播、一般影片和短片（videos、live、shorts）
- 依據選擇的內容類型顯示對應的子分類
- 根據分類篩選並顯示符合條件的影片
- 顯示影片載入狀態和錯誤訊息

#### 主要元件
- 使用 `TopLevelTabs` 切換主要內容類型
- 使用 `SubCategoryTabs` 切換子分類
- 使用 `VideoCard` 顯示影片卡片

#### 狀態管理
- `videoType`: 目前選擇的影片類型（"videos"、"live"、"shorts"）
- `activeCategory`: 目前選擇的分類
- 使用 `useVideoCache` hook 取得影片資料

#### 使用範例
```jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VideoExplorerPage from "./pages/VideoExplorerPage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<VideoExplorerPage />} />
            </Routes>
        </Router>
    );
}
```

## 設計考量
- 頁面元件專注於資料和視圖的組合，實際的資料取得邏輯委託給 hooks
- 使用基於分類的篩選機制，便於使用者快速查找特定類型的影片
- 提供完整的載入狀態和錯誤處理機制，提升使用者體驗

## 未來擴展
- 可以新增更多頁面如設定頁面、資料分析頁面等
- 可增強現有頁面的功能，例如新增搜尋、排序和更多過濾選項