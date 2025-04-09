
export function renderVideos(type, allVideos) {
  const countLabel = document.getElementById("status");
  const list = document.getElementById("video-list");
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
      <strong>${video.發布日期}</strong>｜${video.影片類型}<br>
      <strong>${video.標題}</strong><br>
      ⏱️ ${video.影片時長}｜📂 類別：${video.類別}
    `;
    list.appendChild(li);
  });
}
