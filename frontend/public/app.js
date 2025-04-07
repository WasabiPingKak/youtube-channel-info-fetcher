const apiBase = "https://youtube-api-service-260305364477.asia-east1.run.app";
let allVideos = [];
let currentType = "影片";

function fetchVideos() {
  document.getElementById("status").textContent = "📦 載入中...";
  fetch(apiBase + "/videos")
    .then(res => res.json())
    .then(data => {
      allVideos = data || [];
      if (allVideos.length === 0) {
        document.getElementById("status").textContent = "⚠️ 尚無快取資料，請先更新。";
        return;
      }
      document.getElementById("status").textContent = "";
      renderVideos(currentType);
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
  const filtered = allVideos.filter(video => video.影片類型 === type);
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

document.getElementById("refresh-btn").addEventListener("click", () => {
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;
  if (!start || !end) {
    alert("請選擇起始與結束日期！");
    return;
  }

  document.getElementById("status").textContent = "🔄 正在更新快取...";
  fetch(`${apiBase}/refresh-cache?start=${start}&end=${end}`)
    .then(res => res.json())
    .then(result => {
      document.getElementById("status").textContent = result.message || "✅ 已更新";
      fetchVideos();
    })
    .catch(err => {
      console.error("❌ 快取更新失敗:", err);
      document.getElementById("status").textContent = "❌ 快取更新失敗";
    });
});

// Tab 切換事件
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    renderVideos(currentType);
  });
});

fetchVideos();


function setDefaultDates() {
  const today = new Date();
  const endStr = today.toISOString().split("T")[0];
  document.getElementById("end-date").value = endStr;

  if (allVideos.length > 0) {
    const dates = allVideos.map(v => v.發布日期).sort();
    const lastDate = dates[dates.length - 1].replaceAll("/", "-");
    document.getElementById("start-date").value = lastDate;
  } else {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const startStr = weekAgo.toISOString().split("T")[0];
    document.getElementById("start-date").value = startStr;
  }
}

// 下載 JSON 檔案
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

// 下載 CSV 檔案
document.getElementById("download-csv").addEventListener("click", () => {
  if (!allVideos.length) {
    alert("⚠️ 尚無資料可下載");
    return;
  }
  const headers = Object.keys(allVideos[0]);
  const csvRows = [
    headers.join(","), // 標題列
    ...allVideos.map(row => headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "videos.csv";
  link.click();
});

fetchVideos();
