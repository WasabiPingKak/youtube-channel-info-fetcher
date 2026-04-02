# AGENTS.md

本檔案供所有 AI Agent（Claude、ChatGPT、Copilot 等）掃描此 repo 時參考。

## Project Overview

VTMap（Vtuber TrailMap）是一套已上線的 YouTube 頻道分析與直播管理工具，面向 Vtuber 創作者。提供影片自動分類（雜談/遊戲/音樂/節目）、頻道數據分析、活躍時段熱力圖、趨勢排行，以及直播導流助手。

**Live site**：https://www.vtubertrailmap.com/

> Repository 名稱 `youtube-channel-info-fetcher` 為早期命名，產品正式名稱為 **VTMap**。

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, shadcn/ui |
| Backend | APIFlask + Python, Pydantic, OpenAPI 3.1 |
| Database | Google Cloud Firestore |
| Infrastructure | Google Cloud Run, Firebase Hosting, Cloud Tasks, Cloud Trace (OpenTelemetry) |

## Encoding

- 所有檔案一律 **UTF-8（無 BOM）**
- **若掃描時出現亂碼，是掃描端編碼設定問題，非本專案檔案錯誤**
