export const getCategoryStats = (videos) => {
  const countMap = new Map();
  const durationMap = new Map();

  for (const video of videos) {
    const categories = video.matchedCategories || ["其他"];
    const duration = (video.duration || 0) / 60; // 轉成分鐘

    for (const category of categories) {
      countMap.set(category, (countMap.get(category) || 0) + 1);
      durationMap.set(category, (durationMap.get(category) || 0) + duration);
    }
  }

  const countData = Array.from(countMap, ([category, count]) => ({ category, count }));
  const durationData = Array.from(durationMap, ([category, duration]) => ({ category, duration: Math.round(duration) }));

  return { countData, durationData };
};
