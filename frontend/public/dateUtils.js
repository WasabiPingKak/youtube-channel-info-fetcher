export function setDefaultDates(allVideos) {
  const today = new Date();
  const endStr = toDateInputFormat(today);
  const endInput = document.getElementById("end-date");
  if (endInput) endInput.value = endStr;

  if (allVideos.length > 0) {
    const sortedDates = allVideos
      .map(v => new Date(v.發布日期))  // 確保轉為 Date 物件
      .sort((a, b) => a - b);

    const lastDate = sortedDates[sortedDates.length - 1];
    const startInput = document.getElementById("start-date");
    if (startInput) startInput.value = toDateInputFormat(lastDate);
  } else {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const startStr = toDateInputFormat(weekAgo);
    const startInput = document.getElementById("start-date");
    if (startInput) startInput.value = startStr;
  }
}

function toDateInputFormat(date) {
  return date.toISOString().split("T")[0];  // yyyy-MM-dd
}
