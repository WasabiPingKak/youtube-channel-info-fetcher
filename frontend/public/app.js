
const apiBase = "https://youtube-api-service-260305364477.asia-east1.run.app";
let allVideos = [];
let currentType = "直播檔";

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
      console.log("🎯 選擇影片類型:", currentType);
      renderVideos(currentType);
      renderCharts(currentType);
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

function renderCharts(type) {
  const chartArea = document.getElementById("chart-area");
  chartArea.innerHTML = "";

  const categoryCount = {};
  const categoryDuration = {};

  allVideos.filter(video => video.影片類型?.toLowerCase() === type.toLowerCase()).forEach(video => {
    const category = video["類別"];
    const duration = parseInt(video["總分鐘數"]) || 0;

    if (!categoryCount[category]) {
      categoryCount[category] = 0;
      categoryDuration[category] = 0;
    }

    categoryCount[category]++;
    categoryDuration[category] += duration;
  });

  const labelsCountSorted = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a]);
  const labelsDurationSorted = Object.keys(categoryDuration).sort((a, b) => categoryDuration[b] - categoryDuration[a]);

  const videoCounts = labelsCountSorted.map(label => categoryCount[label]);
  const durations = labelsDurationSorted.map(label => categoryDuration[label]);

  chartArea.innerHTML = `
    <div class="chart-container">
      <canvas id="chart-videos"></canvas>
    </div>
    <div class="chart-container">
      <canvas id="chart-duration"></canvas>
    </div>
  `;

  const ctx1 = document.getElementById("chart-videos").getContext("2d");
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: labelsCountSorted,
      datasets: [{
        label: '影片數量',
        data: videoCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: '各類別影片數量' }
      }
    }
  });

  const ctx2 = document.getElementById("chart-duration").getContext("2d");
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: labelsDurationSorted,
      datasets: [{
        label: '總分鐘數',
        data: durations,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: '各類別影片總時長（分鐘）' }
      }
    }
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
}

document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    console.log("🎯 選擇影片類型:", currentType);
    renderVideos(currentType);
    renderCharts(currentType);
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

  fetch(apiBase + "/api/categories/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ name, keywords, mode }])
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        document.getElementById("category-sync-result").textContent = "✅ " + data.message;
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



async function loadCategoryList() {
  const container = document.getElementById("category-list");
  container.innerHTML = "載入中...";

  try {
    const res = await fetch("https://youtube-api-service-260305364477.asia-east1.run.app/api/categories");
    const data = await res.json();

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

loadCategoryList();
