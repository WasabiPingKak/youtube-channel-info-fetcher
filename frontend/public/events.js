
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
