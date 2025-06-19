import React, { Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactGA from "react-ga4";

ReactGA.initialize("G-Q2S0XSEW74");

import VideoExplorerPage from "./pages/VideoExplorerPage";
import ThanksPage from "./pages/ThanksPage";
import AuthorizeChannelPage from "./pages/AuthorizeChannelPage";
import AuthLoadingPage from "./pages/AuthLoadingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ChannelSelectorPage from "./pages/ChannelSelectorPage";
import TrendingGamesPage from "./pages/TrendingGamesPage";
import GameAliasPage from "./pages/GameAliasPage";
import CategoryAliasPage from "./pages/CategoryAliasPage";
import ChangelogPage from "./pages/ChangelogPage";
import MySettingsPage from "./pages/MySettingsPage";
import ChannelCategoryEditorPage from "./pages/ChannelCategoryEditorPage";
import QuickCategoryEditorPage from "./pages/QuickCategoryEditorPage";
import ChannelActiveTimeExplorerPage from "./pages/ChannelActiveTimeExplorerPage";

import "flag-icons/css/flag-icons.min.css";
import "./style.css";

/* --- 條件編譯：是否載入 /settings --- */
const enableSettings = import.meta.env.VITE_ENABLE_SETTINGS === "true";

/* --- 建立 QueryClient 實例 --- */
const queryClient = new QueryClient();

/* --- 只有在正式環境啟用 persist 快取（跨重整）--- */
//if (!import.meta.env.DEV) {
import("@tanstack/react-query-persist-client").then(({ persistQueryClient }) => {
  import("@tanstack/query-sync-storage-persister").then(({ createSyncStoragePersister }) => {
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 1000 * 60 * 60 * 12,
    });
  });
});
//}

/* --- 可選：提供給 DevTools Console 測試 invalidate 用 --- */
if (import.meta.env.DEV) {
  window.queryClient = queryClient;
}

/* ✅ 自訂 Hook：每次頁面切換時上報 GA page_view */
function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);
}

/* ✅ 包成一層 Layout，以使用 useLocation 追蹤 */
function AppRoutes() {
  usePageTracking();

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Routes>
        {/* 公開頁面 */}
        <Route path="/" element={<Navigate to="/trending" replace />} />
        <Route path="/videos" element={<VideoExplorerPage />} />
        <Route path="/channels" element={<ChannelSelectorPage />} />
        <Route path="/authorize-channel" element={<AuthorizeChannelPage />} />
        <Route path="/thanks" element={<ThanksPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/trending" element={<TrendingGamesPage />} />
        <Route path="/game-aliases" element={<GameAliasPage />} />
        <Route path="/category-aliases" element={<CategoryAliasPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/my-settings" element={<MySettingsPage />} />
        <Route path="/my-category-editor" element={<ChannelCategoryEditorPage />} />
        <Route path="/quick-category-editor/:channelId" element={<QuickCategoryEditorPage />} />
        <Route path="/auth-loading" element={<AuthLoadingPage />} />
        <Route path="/active-time" element={<ChannelActiveTimeExplorerPage />} />

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
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {(() => {
      const currentHost = window.location.hostname;
      if (currentHost === "vtuber-channel-analyzer-v3.web.app") {
        window.location.href =
          "https://www.vtubertrailmap.com" + window.location.pathname + window.location.search;
        return null;
      }
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster position="top-center" />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      );
    })()}
  </React.StrictMode>
);
