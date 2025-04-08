export function renderCharts(type, allVideos) {
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
      datasets: [{ label: '影片數量', data: videoCounts, backgroundColor: 'rgba(54, 162, 235, 0.6)' }]
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
      datasets: [{ label: '總分鐘數', data: durations, backgroundColor: 'rgba(255, 99, 132, 0.6)' }]
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