# Hooks 目錄

本目錄包含專案中使用的自訂 React Hooks，用於抽象和重用邏輯元件。

## 檔案結構

- `useChannelSettings.ts`: 管理頻道分類設定的 Hook
- `useVideoCache.ts`: 處理影片資料的快取與取得功能的 Hook

## 詳細說明

### useChannelSettings.ts

用於管理 YouTube 頻道的分類設定，包含直播、影片和短片等不同類型的分類。

#### 功能介紹
- 從 Firestore 讀取頻道分類設定
- 提供預設分類結構
- 儲存分類設定到資料庫
- 提供分類設定的狀態管理

#### 使用範例
```tsx
import { useChannelSettings } from "@/hooks/useChannelSettings";

function SettingsComponent() {
    const { channelSettings, setChannelSettings, saveSettings, loading } = useChannelSettings();

    // 修改設定
    const updateCategory = (category) => {
        setChannelSettings(prev => ({
            ...prev,
            classifications: {
                ...prev.classifications,
                live: {
                    ...prev.classifications.live,
                    [category]: [...newValues]
                }
            }
        }));
    };

    // 儲存設定
    const handleSave = async () => {
        await saveSettings();
    };

    return (
        // 元件 UI
    );
}
```

### useVideoCache.ts

用於從 Firestore 取得並快取頻道影片資料。

#### 功能介紹
- 從 Firestore 取得頻道的所有影片
- 提供載入狀態和錯誤處理
- 快取影片資料以優化效能

#### 回傳值
- `videos`: 影片資料陣列
- `loading`: 載入狀態
- `error`: 錯誤狀態

#### 使用範例
```tsx
import { useVideoCache } from "@/hooks/useVideoCache";

function VideoList() {
    const { videos, loading, error } = useVideoCache();

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤：{error.message}</div>;

    return (
        <div>
            {videos.map(video => (
                <div key={video.videoId}>
                    {video.title}
                </div>
            ))}
        </div>
    );
}
```

## 注意事項
- `useChannelSettings` 中的預設設定結構在資料庫無資料時會被使用
- `useVideoCache` 目前使用固定的頻道 ID，未來可能需要修改為動態設定