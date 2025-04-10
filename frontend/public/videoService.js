
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)) // 全形轉半形
    .replace(/[\u3000]/g, ' ') // 全形空白
    .replace(/[【】\[\]\(\)「」、，。！？?!…—~～<>《》]/g, '') // 移除標點
    .trim();
}



const apiBase = "https://youtube-api-service-260305364477.asia-east1.run.app";

export async function fetchVideos() {
  const res = await fetch(apiBase + "/videos");
  return await res.json();
}

export async function refreshCache(start, end) {
  const res = await fetch(`${apiBase}/refresh-cache?start=${start}&end=${end}`);
  return await res.json();
}

export async function syncCategories(name, keywords, mode) {
  const res = await fetch(apiBase + "/api/categories/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ name, keywords, mode }])
  });
  return await res.json();
}

export async function loadCategoryList() {
  const res = await fetch(apiBase + "/api/categories");
  return await res.json();
}

export function filterVideosByCategory(videos, categoryName, tagConfig) {
  if (categoryName === "全部") return videos;

  if (categoryName === "未分類") {
    const allKeywords = tagConfig.flatMap(c => c.keywords.map(k => k.toLowerCase()));
    return videos.filter(v => {
      const title = normalize(v["標題"]);
      return !allKeywords.some(kw => title.includes(kw));
    });
  }

  
const matchedCategory = tagConfig.find(c => c.category === categoryName);
console.log("🔍 [分類篩選] 選擇分類:", categoryName);
console.log("🔍 [分類篩選] 命中的分類資料:", matchedCategory);
const targetKeywords = matchedCategory?.keywords || [];
console.log("🔍 [分類篩選] 該分類的關鍵字:", targetKeywords);

  return videos.filter(v => {
    const title = normalize(v["標題"]);
    return targetKeywords.some(kw => title.includes(normalize(kw)));
  });
}

export function getCategoryStats(videos, tagConfig) {
  const stats = {};

  videos.forEach(v => {
    const title = normalize(v["標題"]);
    const matchedCategories = tagConfig.filter(c =>
      c.keywords.some(k => title.includes(k.toLowerCase()))
    ).map(c => c.category);

    if (matchedCategories.length === 0) {
      matchedCategories.push("未分類");
    }

    matchedCategories.forEach(cat => {
      if (!stats[cat]) stats[cat] = { count: 0, minutes: 0 };
      stats[cat].count += 1;
      stats[cat].minutes += v["總分鐘數"] || 0;
    });
  });

  return stats;
}

export function getKeywordStats(videos, tagConfig, categoryName) {
  const target = tagConfig.find(c => c.category === categoryName);
  if (!target) return {};

  const stats = {};
  target.keywords.forEach(k => stats[k] = { count: 0, minutes: 0 });

  videos.forEach(v => {
    const title = normalize(v["標題"]);
    target.keywords.forEach(k => {
      if (title.includes(k.toLowerCase())) {
        stats[k].count += 1;
        stats[k].minutes += v["總分鐘數"] || 0;
      }
    });
  });

  return stats;
}
