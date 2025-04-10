let chartInstance;

export function renderCategoryChart(categoryStats) {
  const labels = Object.keys(categoryStats);
  const data = {
    labels,
    datasets: [
      {
        label: "影片數量",
        data: labels.map(k => categoryStats[k].count),
        backgroundColor: "#42A5F5"
      },
      {
        label: "總分鐘數",
        data: labels.map(k => categoryStats[k].minutes),
        backgroundColor: "#66BB6A"
      }
    ]
  };

  drawChart(data, "分類統計圖");
}

export function renderKeywordChart(keywordStats) {
  const labels = Object.keys(keywordStats);
  const data = {
    labels,
    datasets: [
      {
        label: "影片數量",
        data: labels.map(k => keywordStats[k].count),
        backgroundColor: "#FFCA28"
      },
      {
        label: "總分鐘數",
        data: labels.map(k => keywordStats[k].minutes),
        backgroundColor: "#EF5350"
      }
    ]
  };

  drawChart(data, "標籤統計圖");
}

function drawChart(data, title) {
  const ctxContainer = document.getElementById("chart-area");
  ctxContainer.innerHTML = "<canvas id='main-chart'></canvas>";
  const ctx = document.getElementById("main-chart");

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title
        }
      }
    }
  });
}