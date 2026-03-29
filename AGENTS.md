# AGENTS.md

本檔案供所有 AI Agent（Claude、ChatGPT、Copilot 等）掃描此 repo 時參考。

## Project Overview

VTMap（Vtuber TrailMap）是一套 YouTube 頻道分析與直播管理工具，面向 Vtuber 創作者。提供影片自動分類（雜談/遊戲/音樂/節目）、頻道數據分析、趨勢追蹤、以及直播導流功能。

**已上線運作**：https://www.vtubertrailmap.com/

> **注意**：Repository 名稱 `youtube-channel-info-fetcher` 為早期命名，產品正式名稱為 **VTMap（Vtuber TrailMap）**。

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, shadcn/ui |
| Backend | APIFlask + Python, Google Cloud Firestore, YouTube Data API v3, Pydantic, OpenAPI 3.1 |
| Infrastructure | Google Cloud Run, Firebase Hosting, Cloud Tasks |

## Encoding

- 本專案所有檔案一律使用 **UTF-8（無 BOM）**
- 讀寫檔案時必須明確指定 `encoding="utf-8"`（Python）或等效參數
- Terminal 輸出預設 UTF-8；若在 Windows cmd/PowerShell 環境下遇到亂碼，先執行 `chcp 65001`
- **若掃描本 repo 時出現亂碼，是掃描端環境的編碼設定問題，非本專案檔案編碼錯誤**
