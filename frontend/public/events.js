import { getTagConfig } from './tagService.js';
import { renderCategoryChart, renderKeywordChart } from './chartRenderer.js';
import { renderFilteredVideos } from './videoRenderer.js';
import { getCategoryStats, getKeywordStats, filterVideosByCategory } from './videoService.js';

export function setupTabSwitching(onSwitch) {
  document.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const type = btn.dataset.type;
      onSwitch(type);
    });
  });
}

export function setupRefreshButton(onRefresh) {
  const btn = document.getElementById("refresh-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    if (!start || !end) {
      alert("請選擇起始與結束日期！");
      return;
    }
    onRefresh(start, end);
  });
}

export function setupDownloadButtons(allVideos, onJSON, onCSV) {
  document.getElementById("download-json").addEventListener("click", () => {
    if (!allVideos.length) {
      alert("⚠️ 尚無資料可下載");
      return;
    }
    onJSON();
  });

  document.getElementById("download-csv").addEventListener("click", () => {
    if (!allVideos.length) {
      alert("⚠️ 尚無資料可下載");
      return;
    }
    onCSV();
  });
}

let currentCategory = "全部";
let availableCategories = [];

export async function setupSubCategoryButtons() {
  try {
    const rawCategories = await getTagConfig();
    availableCategories = rawCategories.map(c => c.category);
    const container = document.getElementById("sub-category-buttons");
    container.innerHTML = "";

    const categories = ["全部", ...availableCategories, "未分類"];

    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "sub-category-button";
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".sub-category-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = cat;
        console.log("🔘 子分類點擊：", cat);

        if (!window.globalData) return;
        const { allVideos, tagConfig } = window.globalData;
        const currentType = document.querySelector(".tab-button.active")?.dataset.type || "直播檔";

        let filtered = allVideos.filter(v => (v.影片類型 || '').toLowerCase() === currentType.toLowerCase());
        let subset = [];

        if (currentCategory === "全部") {
          const stats = getCategoryStats(filtered, tagConfig);
          renderCategoryChart(stats);
          subset = filtered;
        } else {
          subset = filterVideosByCategory(filtered, currentCategory, tagConfig);
          const stats = getKeywordStats(subset, tagConfig, currentCategory);
          renderKeywordChart(stats);
        }

        renderFilteredVideos(subset, currentType, currentCategory, tagConfig);
      });
      container.appendChild(btn);
    });
  } catch (err) {
    console.error("❌ 子分類載入錯誤:", err);
  }
}
