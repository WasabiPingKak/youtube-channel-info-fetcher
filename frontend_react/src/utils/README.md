# Utils 目錄

本目錄包含應用程式中使用的通用工具函數，主要用於資料處理和轉換。

## 檔案結構

- `chartDataUtils.js`: 圖表資料處理和轉換工具

## 詳細說明

### chartDataUtils.js

提供用於處理和轉換圖表資料的工具函數。

#### 功能介紹
- 將原始資料轉換為圖表可用的格式
- 提供資料聚合和計算功能
- 支援時間序列資料的處理

#### 主要函數

**processChartData(rawData)**
- 功能：將原始資料轉換為圖表可用的格式
- 參數：rawData - 原始資料物件
- 回傳：處理後的圖表資料物件
- 處理邏輯：
  - 資料清理和格式化
  - 計算統計數據
  - 生成圖表所需的資料結構

**aggregateDataByCategory(data)**
- 功能：依據分類聚合資料
- 參數：data - 原始資料陣列
- 回傳：按分類聚合後的資料物件
- 處理邏輯：
  - 統計每個分類的數量
  - 計算百分比分布
  - 生成分類標籤

**processTimeSeriesData(data)**
- 功能：處理時間序列資料
- 參數：data - 時間序列原始資料
- 回傳：處理後的時間序列資料陣列
- 處理邏輯：
  - 時間格式標準化
  - 資料點排序
  - 計算時間間隔

#### 使用範例
```javascript
import { processChartData, aggregateDataByCategory } from '@/utils/chartDataUtils';

// 處理圖表資料
const rawData = {
    videos: [
        { id: 1, category: '遊戲', date: '2024-01-01' },
        { id: 2, category: '音樂', date: '2024-01-02' }
    ]
};

const chartData = processChartData(rawData);

// 聚合分類資料
const categoryData = aggregateDataByCategory(rawData.videos);

// 在圖表元件中使用
function ChartComponent({ data }) {
    const processedData = processChartData(data);
    return <Chart data={processedData} />;
}
```

## 設計考量

- 函數設計遵循單一職責原則
- 提供清晰的資料轉換流程
- 確保資料處理的一致性和可重用性
- 支援不同圖表類型的資料需求

## 注意事項

- 確保輸入資料的格式符合預期
- 處理可能的異常情況和邊界條件
- 考慮資料量大時的效能優化
- 保持資料處理邏輯的一致性