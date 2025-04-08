
export function setDefaultDates(allVideos) {
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
