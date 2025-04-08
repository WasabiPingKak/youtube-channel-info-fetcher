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