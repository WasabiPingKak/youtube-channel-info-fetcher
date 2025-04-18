# Components 目錄

本目錄包含應用程式中使用的 React 元件，分為多個子目錄以便於管理和重用。

## 目錄結構

- `common/`: 通用元件，可在多個頁面中重複使用
- `classificationEditor/`: 分類編輯相關的特定元件

## 詳細說明

### common/ 子目錄

包含可在整個應用程式中重複使用的通用元件。

#### 檔案結構
- `TopLevelTabs.jsx`: 頂層分類標籤（直播、影片、短片）
- `SubCategoryTabs.jsx`: 子分類標籤，基於頂層分類顯示
- `VideoCard.jsx`: 影片卡片元件，用於顯示影片資訊
- `UnsavedNoticeBar.jsx`: 未儲存變更提示列

#### 主要元件說明

**TopLevelTabs.jsx**
- 提供頂層導覽功能
- 處理不同內容類型（直播、影片、短片）的切換
- 向父元件回傳目前選擇的類型

**SubCategoryTabs.jsx**
- 依據目前選擇的頂層類型顯示對應的子分類
- 提供子分類的切換功能
- 向父元件回傳目前選擇的子分類

**VideoCard.jsx**
- 顯示影片的縮圖、標題、發布日期等資訊
- 提供點擊跳轉到 YouTube 的功能
- 支援顯示標籤和分類資訊

**UnsavedNoticeBar.jsx**
- 當有未儲存的變更時顯示提示
- 提供儲存按鈕的互動

### classificationEditor/ 子目錄

包含與頻道內容分類編輯相關的特定元件。

#### 檔案結構
- `ClassificationEditorMock.jsx`: 分類編輯器的主要元件
- `EditTabSwitcher.jsx`: 編輯器中的分類切換標籤
- `CategoryEditor.jsx`: 分類編輯元件
- `CategoryGroup.jsx`: 分類群組元件
- `GameTagEditor.jsx`: 遊戲標籤編輯器
- `GameTagsGroup.jsx`: 遊戲標籤群組
- `KeywordTagsInput.jsx`: 關鍵詞標籤輸入元件

#### 主要元件說明

**ClassificationEditorMock.jsx**
- 分類編輯器的容器元件
- 整合所有分類編輯相關的子元件
- 處理分類資料的狀態管理
- 提供儲存功能

**EditTabSwitcher.jsx**
- 在分類編輯器中切換不同的編輯類型（直播分類、影片分類、短片分類、遊戲標籤）
- 提供標籤式介面進行切換

**CategoryEditor.jsx**
- 單一分類類型（如直播、影片）的編輯器
- 支援新增、編輯和刪除分類及其關鍵詞

**GameTagEditor.jsx 和 GameTagsGroup.jsx**
- 用於管理遊戲標籤
- 支援新增、編輯和刪除遊戲及其關聯標籤

**KeywordTagsInput.jsx**
- 提供標籤輸入和管理功能
- 支援新增標籤、刪除標籤等操作

## 使用範例

```jsx
// 使用 VideoCard 顯示影片
import VideoCard from "@/components/common/VideoCard";

function VideoList({ videos }) {
    return (
        <div>
            {videos.map(video => (
                <VideoCard key={video.videoId} video={video} />
            ))}
        </div>
    );
}

// 使用分類標籤
import TopLevelTabs from "@/components/common/TopLevelTabs";
import SubCategoryTabs from "@/components/common/SubCategoryTabs";

function CategoryNav({ onTypeChange, onCategoryChange }) {
    const [activeType, setActiveType] = useState("videos");

    const handleTypeChange = (type) => {
        setActiveType(type);
        onTypeChange(type);
    };

    return (
        <>
            <TopLevelTabs activeType={activeType} onTypeChange={handleTypeChange} />
            <SubCategoryTabs activeType={activeType} onCategoryChange={onCategoryChange} />
        </>
    );
}
```

## 設計原則
- 元件遵循單一職責原則，每個元件專注於特定功能
- 使用 Props 進行元件間的資料和事件傳遞
- 將狀態管理邏輯提升到合適的層級，避免過深的元件巢狀結構