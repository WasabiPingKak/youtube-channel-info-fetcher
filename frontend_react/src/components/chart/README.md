# Chart 元件目錄

本目錄包含用於資料視覺化的圖表元件，提供多種圖表類型來展示 YouTube 頻道的分類和標籤統計資料。

## 目錄結構

- `ChartSwitcher.jsx`: 圖表類型切換器，用於在不同圖表類型間切換
- `ChartTypeBar.jsx`: 長條圖元件，用於顯示分類或標籤的數量統計
- `ChartTypePie.jsx`: 圓餅圖元件，用於顯示分類或標籤的比例分布
- `CategoryChart.jsx`: 分類圖表容器元件，整合圖表切換和顯示功能
- `CategoryChartSection.jsx`: 分類圖表區段元件，包含完整的圖表展示功能

## 功能概述

這些圖表元件提供以下主要功能：

1. **資料視覺化**：將分類和標籤資料轉換為直觀的圖表展示
2. **圖表切換**：支援在不同圖表類型（長條圖、圓餅圖）間切換
3. **互動功能**：提供圖表互動，如懸停顯示詳細資訊
4. **響應式設計**：適應不同螢幕尺寸的圖表顯示

## 使用範例

```jsx
import CategoryChartSection from './CategoryChartSection';

function Dashboard() {
    return (
        <div>
            <CategoryChartSection
                data={categoryData}
                title="分類統計"
            />
        </div>
    );
}
```

## 設計原則

- 使用 Chart.js 作為基礎圖表庫
- 保持元件的可重用性和可配置性
- 提供統一的資料格式介面
- 確保圖表的響應式設計和效能優化