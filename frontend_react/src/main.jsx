import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import VideoExplorerPage from "./pages/VideoExplorerPage";
import "./style.css";

/* --- 條件編譯：是否載入 /settings --- */
const enableSettings = import.meta.env.VITE_ENABLE_SETTINGS === "true";

let CategoryEditor = null;
if (enableSettings) {
  /* 只有在 dev 或顯式開啟時才動態載入，生產版將被 tree-shaking 移除 */
  CategoryEditor = React.lazy(() =>
    import("./components/CategoryEditor/CategoryEditor")
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* lazy 元件需要 Suspense 包裹 */}
      <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          {/* 公開頁面 */}
          <Route path="/videos" element={<VideoExplorerPage />} />

          {/* 管理頁（僅在開啟時加入） */}
          {enableSettings && CategoryEditor && (
            <Route path="/settings" element={<CategoryEditor />} />
          )}

          {/* 其他路徑 → redirect 提示 */}
          <Route
            path="*"
            element={
              <div className="p-4">
                <p>
                  請訪問{" "}
                  <a href="/videos" className="text-blue-600 underline">
                    /videos
                  </a>
                </p>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
