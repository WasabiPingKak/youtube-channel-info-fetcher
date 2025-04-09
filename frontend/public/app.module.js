import { fetchVideos as fetchVideoData, refreshCache, syncCategories, loadCategoryList as loadCategoryData } from "./videoService.js";
import { renderCharts } from "./chartRenderer.js";
import { renderVideos } from "./videoRenderer.js";
import { setDefaultDates } from "./dateUtils.js";
import { downloadJSON, downloadCSV } from "./downloadUtils.js";
import { setupTabSwitching, setupRefreshButton, setupDownloadButtons } from "./events.js";
import { TagManager } from './tagManager.js';


function updatePreviewSource() {
  const filtered = allVideos.filter(v => (v["影片類型"] || "").toLowerCase() === currentType.toLowerCase());
  TagManager.setVideoData(filtered);
  TagManager.init();  // 強制刷新分類預覽
}

let allVideos = [];
let currentType = "直播檔";

function refreshAndReload(start, end) {
  document.getElementById("status").textContent = "🔄 正在更新快取...";
  refreshCache(start, end)
    .then(result => {
      document.getElementById("status").textContent = result.message || "✅ 已更新";
      fetchAndRenderVideos();
      updatePreviewSource();
    })
    .catch(err => {
      console.error("❌ 快取更新失敗:", err);
      document.getElementById("status").textContent = "❌ 快取更新失敗";
    });
}

function fetchAndRenderVideos() {
  document.getElementById("status").textContent = "📦 載入中...";
  fetchVideoData()
    .then(data => {
      allVideos = data || [];
      if (allVideos.length === 0) {
        document.getElementById("status").textContent = "⚠️ 尚無快取資料，請先更新。";
        return;
      }
      document.getElementById("status").textContent = "";
      updatePreviewSource();
      renderVideos(currentType, allVideos);
      renderCharts(currentType, allVideos);
      setDefaultDates(allVideos);
  updatePreviewSource();
    })
    .catch(err => {
      console.error("❌ API 錯誤:", err);
      document.getElementById("status").textContent = "❌ 讀取失敗";
    });
}

setupTabSwitching(type => {
  currentType = type;
  renderVideos(currentType, allVideos);
  renderCharts(currentType, allVideos);
  setDefaultDates(allVideos);
  updatePreviewSource();
});

setupRefreshButton(refreshAndReload);

setupDownloadButtons(allVideos, () => downloadJSON(allVideos), () => downloadCSV(allVideos));

document.getElementById("sync-category").addEventListener("click", () => {
  const name = document.getElementById("category-name").value.trim();
  const keywords = document.getElementById("category-keywords").value.split(",").map(k => k.trim()).filter(Boolean);
  const mode = document.getElementById("category-mode").value;

  if (!name || keywords.length === 0) {
    document.getElementById("category-sync-result").textContent = "⚠️ 請填入分類名稱與至少一個關鍵字";
    return;
  }

  document.getElementById("category-sync-result").textContent = "🔄 同步中...";

  syncCategories(name, keywords, mode)
    .then(data => {
      if (data.message) {
        document.getElementById("category-sync-result").textContent = "✅ " + data.message;
        document.getElementById("category-name").value = "";
        document.getElementById("category-keywords").value = "";
        loadCategories();
      } else if (data.error) {
        document.getElementById("category-sync-result").textContent = "❌ " + data.error;
      } else {
        document.getElementById("category-sync-result").textContent = "⚠️ 未知回應";
      }
    })
    .catch(err => {
      console.error("❌ 同步分類失敗:", err);
      document.getElementById("category-sync-result").textContent = "❌ 發生錯誤";
    });
});

async function loadCategories() {
  const container = document.getElementById("category-list");
  container.innerHTML = "載入中...";

  try {
    const data = await loadCategoryData();

    container.innerHTML = "";

    if (data.length === 0) {
      container.textContent = "（尚無分類資料）";
      return;
    }

    data.forEach(cat => {
      const wrapper = document.createElement("div");
      wrapper.className = "category-block";

      const title = document.createElement("h3");
      title.textContent = `📂 ${cat.name}`;
      title.style.cursor = "pointer";
      wrapper.appendChild(title);

      if (cat.keywords && cat.keywords.length > 0) {
        const ul = document.createElement("ul");
        cat.keywords.forEach(kw => {
          const li = document.createElement("li");
          li.textContent = kw;
          ul.appendChild(li);
        });
        ul.classList.add("collapsed");
        title.addEventListener("click", () => {
          ul.classList.toggle("collapsed");
        });
        wrapper.appendChild(ul);
      } else {
        const note = document.createElement("p");
        note.textContent = "（無關鍵字）";
        wrapper.appendChild(note);
      }

      container.appendChild(wrapper);
    });
  } catch (err) {
    container.innerHTML = "❌ 讀取分類失敗";
    console.error(err);
  }
}

fetchAndRenderVideos();
      updatePreviewSource();
loadCategories();

window.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-tag-manager");
  if (!toggleButton) {
    console.warn("找不到 #toggle-tag-manager 元素");
    return;
  }

  toggleButton.addEventListener("click", () => {
    console.log("✅ 編輯分類按鈕被點擊");
    const panel = document.getElementById("tag-manager-panel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    if (panel.style.display === "block") {
      TagManager.init();
    }
  });
});