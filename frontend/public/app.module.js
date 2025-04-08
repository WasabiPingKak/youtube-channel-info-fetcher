import { fetchVideos as fetchVideoData, refreshCache, syncCategories, loadCategoryList as loadCategoryData } from "./videoService.js";
import { renderCharts } from "./chartRenderer.js";

let allVideos = [];
let currentType = "直播檔";

function fetchVideos() {
  document.getElementById("status").textContent = "📦 載入中...";
  fetchVideoData()
    .then(data => {
      allVideos = data || [];
      if (allVideos.length === 0) {
        document.getElementById("status").textContent = "⚠️ 尚無快取資料，請先更新。";
        return;
      }
      document.getElementById("status").textContent = "";
      console.log("🎯 選擇影片類型:", currentType);
      renderVideos(currentType);
      renderCharts(currentType, allVideos);
      setDefaultDates();
    })
    .catch(err => {
      console.error("❌ API 錯誤:", err);
      document.getElementById("status").textContent = "❌ 讀取失敗";
    });
}

function renderVideos(type) {
  const countLabel = document.getElementById("status");
  const list = document.getElementById("video-list");
  list.innerHTML = "";
  const filtered = allVideos.filter(video => video.影片類型?.toLowerCase() === type.toLowerCase());
  if (filtered.length === 0) {
    countLabel.textContent = `📊 ${type}：0 筆`;
    list.innerHTML = "<li>🚫 沒有符合的資料。</li>";
    return;
  }
  countLabel.textContent = `📊 ${type}：${filtered.length} 筆`;
  filtered.forEach(video => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${video.發布日期}</strong>｜${video.影片類型}<br>
      <strong>${video.標題}</strong><br>
      ⏱️ ${video.影片時長}｜📂 類別：${video.類別}
    `;
    list.appendChild(li);
  });
}

const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    if (!start || !end) {
      alert("請選擇起始與結束日期！");
      return;
    }

    document.getElementById("status").textContent = "🔄 正在更新快取...";
    refreshCache(start, end)
      .then(result => {
        document.getElementById("status").textContent = result.message || "✅ 已更新";
        fetchVideos();
      })
      .catch(err => {
        console.error("❌ 快取更新失敗:", err);
        document.getElementById("status").textContent = "❌ 快取更新失敗";
      });
  });
}

document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    console.log("🎯 選擇影片類型:", currentType);
    renderVideos(currentType);
    renderCharts(currentType, allVideos);
    setDefaultDates();
  });
});

document.getElementById("download-json").addEventListener("click", () => {
  if (!allVideos.length) {
    alert("⚠️ 尚無資料可下載");
    return;
  }
  const blob = new Blob([JSON.stringify(allVideos, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "videos.json";
  link.click();
});

document.getElementById("download-csv").addEventListener("click", () => {
  if (!allVideos.length) {
    alert("⚠️ 尚無資料可下載");
    return;
  }
  const headers = Object.keys(allVideos[0]);
  const csvRows = [
    headers.join(","),
    ...allVideos.map(row => headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "videos.csv";
  link.click();
});

function setDefaultDates() {
  const today = new Date();
  const endStr = today.toISOString().split("T")[0];
  const endInput = document.getElementById("end-date");
  if (endInput) endInput.value = endStr;

  if (allVideos.length > 0) {
    const sortedDates = allVideos
      .map(v => v.發布日期.replaceAll("/", "-"))
      .sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    const startInput = document.getElementById("start-date");
    if (startInput) startInput.value = lastDate;
  } else {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const startStr = weekAgo.toISOString().split("T")[0];
    const startInput = document.getElementById("start-date");
    if (startInput) startInput.value = startStr;
  }
}

fetchVideos();

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

loadCategories();