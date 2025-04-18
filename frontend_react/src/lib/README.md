# Lib 目錄

本目錄包含應用程式的通用工具函數和服務，主要用於處理 Firebase 和 Firestore 的連接與操作。

## 檔案結構

- `firebase.ts`: Firebase 設定和初始化
- `firestore.ts`: Firestore 資料庫操作函數

## 詳細說明

### firebase.ts

提供 Firebase 服務的初始化和設定。

#### 功能介紹
- 初始化 Firebase 應用程式
- 設定 Firebase 服務（如 Firestore）
- 匯出已設定的 Firebase 服務實例供應用程式使用

#### 使用範例
```typescript
// 從其他檔案中匯入 Firebase 服務
import { db, auth } from '@/lib/firebase';

// 使用 Firestore 服務
const docRef = doc(db, 'collection', 'document');
```

### firestore.ts

提供與 Firestore 資料庫互動的工具函數，專注於頻道設定和影片資料的操作。

#### 功能介紹
- 載入頻道設定資料（`loadChannelSettings`）
- 儲存頻道設定資料（`saveChannelSettings`）
- 其他 Firestore 相關的資料操作函數

#### 主要函數

**loadChannelSettings()**
- 功能：從 Firestore 讀取頻道的分類設定
- 回傳：Promise<ChannelSettings | null>
- 例外處理：記錄錯誤並回傳 null

**saveChannelSettings(settings)**
- 功能：將修改後的頻道設定儲存到 Firestore
- 參數：settings - 修改後的頻道設定物件
- 回傳：Promise<void>
- 例外處理：拋出錯誤，由呼叫者處理

#### 使用範例
```typescript
import { loadChannelSettings, saveChannelSettings } from '@/lib/firestore';

// 載入設定
async function loadSettings() {
    try {
        const settings = await loadChannelSettings();
        if (settings) {
            // 處理設定資料
        } else {
            // 處理設定不存在的情況
        }
    } catch (error) {
        console.error('載入設定時出錯:', error);
    }
}

// 儲存設定
async function updateSettings(newSettings) {
    try {
        await saveChannelSettings(newSettings);
        console.log('設定已成功儲存');
    } catch (error) {
        console.error('儲存設定時出錯:', error);
    }
}
```

## 設計考量

- 集中管理 Firebase 設定和初始化，便於維護和更新
- 將 Firestore 操作抽象為獨立的函數，降低程式碼耦合度
- 使用 TypeScript 提供型別安全和更好的開發體驗
- 提供例外處理機制，增強應用程式的穩健性

## 注意事項

- Firebase 設定資訊應妥善保管，避免洩漏敏感資訊
- 在正式環境中應確保使用適當的安全規則來保護資料庫
- 考慮在未來新增更多的資料驗證和處理邏輯，以提高資料品質