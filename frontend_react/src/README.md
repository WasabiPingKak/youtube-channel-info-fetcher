# React 前端原始碼目錄

本目錄包含 YouTube 頻道資訊處理器的 React 前端原始碼。專案基於 Vite 和 React 建置，用於管理和瀏覽 YouTube 頻道影片的分類和內容。

## 目錄結構

- `components/`: 可重複使用的 React 元件
  - `common/`: 通用元件
  - `classificationEditor/`: 分類編輯元件
- `hooks/`: 自訂 React Hooks
- `lib/`: 工具函數和服務
- `pages/`: 頁面元件
- `main.jsx`: 應用程式進入點
- `style.css`: 全域樣式
- `vite-env.d.ts`: Vite 型別定義檔

## 技術堆疊

- React: 使用者介面函式庫
- Vite: 前端建置工具
- Firebase/Firestore: 後端資料儲存
- TailwindCSS: 樣式解決方案

## 功能概述

此前端應用程式提供以下主要功能：

1. **影片瀏覽**：依照類型（直播、一般影片、短片）和子分類瀏覽頻道影片
2. **分類管理**：編輯和管理頻道影片的分類系統
3. **遊戲標籤**：管理與遊戲相關的標籤系統

## 主要檔案

### main.jsx

應用程式進入點，負責初始化 React 應用程式，設定路由和全域內容。

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
```

### style.css

全域樣式檔案，提供應用程式的基本樣式設定。

## 開發指南

要開始開發此前端應用程式：

1. 確保已安裝 Node.js 和 npm/yarn
2. 安裝相依套件：`npm install` 或 `yarn`
3. 啟動開發伺服器：`npm run dev` 或 `yarn dev`
4. 開啟瀏覽器存取 `http://localhost:5173`

## 架構設計

應用程式遵循以下架構原則：

1. **元件化設計**：將 UI 拆分為可重複使用的元件
2. **自訂 Hooks**：抽象和共享邏輯
3. **服務分離**：將 API 和外部服務邏輯與 UI 邏輯分離
4. **集中式狀態管理**：使用 React 的內容或自訂 hooks 進行狀態管理

## 資料流

1. 使用者介面透過 hooks 或服務請求資料
2. 資料從 Firestore 取得
3. 資料透過 props 或內容傳遞給元件
4. 元件根據資料渲染介面
5. 使用者操作觸發資料更新，循環重複

## 注意事項

- 遵循目錄中的檔案和程式碼組織結構
- 使用 TypeScript 進行型別檢查，提高程式碼品質
- 確保元件重用以減少重複程式碼
- 遵循 React 最佳實踐，如使用函式元件和 React Hooks