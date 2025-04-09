
export function renderVideos(type, allVideos) {
  const countLabel = document.getElementById("status");
  const list = document.getElementById("video-list");
  function formatDateToTaipei(isoString) {
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date(isoString));
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}/${m}/${d}`;
}

list.innerHTML = "";

  const filtered = allVideos
    .filter(video => video.影片類型?.toLowerCase() === type.toLowerCase())
    .sort((a, b) => new Date(b.發布日期) - new Date(a.發布日期)); // 加上這一行進行排序

  if (filtered.length === 0) {
    countLabel.textContent = `📊 ${type}：0 筆`;
    list.innerHTML = "<li>🚫 沒有符合的資料。</li>";
    return;
  }

  countLabel.textContent = `📊 ${type}：${filtered.length} 筆`;
  filtered.forEach(video => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${formatDateToTaipei(video.發布日期)}</strong>｜${video.影片類型}<br>
      <strong>${video.標題}</strong><br>
      ⏱️ ${video.影片時長}｜📂 類別：${video.類別}
    `;
    list.appendChild(li);
  });
}
