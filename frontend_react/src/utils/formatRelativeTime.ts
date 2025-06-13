export function formatRelativeTime(isoDateStr: string): string {
  if (!isoDateStr) return "";

  try {
    const now = new Date();
    const past = new Date(isoDateStr);
    const diffMs = now.getTime() - past.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (hours < 24) {
      return `${hours} 小時前`;
    }

    if (days < 30) {
      return `${days} 天前`;
    }

    // 格式化為 yyyy/mm/dd
    const y = past.getFullYear();
    const m = `${past.getMonth() + 1}`.padStart(2, "0");
    const d = `${past.getDate()}`.padStart(2, "0");
    return `${y}/${m}/${d}`;
  } catch (e) {
    return "";
  }
}
