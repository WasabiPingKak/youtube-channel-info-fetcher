import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CategoryEditor from "./components/CategoryEditor/CategoryEditor";
import VideoExplorerPage from "./pages/VideoExplorerPage"; // 匯入剛剛的頁面元件
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/videos" element={<VideoExplorerPage />} />
        <Route path="/settings" element={<CategoryEditor />} />
        <Route
          path="*"
          element={
            <div className="p-4">
              <p>請訪問 <a href="/videos" className="text-blue-600 underline">/videos</a> 或 <a href="/settings" className="text-blue-600 underline">/settings</a></p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
