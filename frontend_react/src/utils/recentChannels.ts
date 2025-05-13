const STORAGE_KEY = "recent_channels";
const MAX_RECENT = 3;

export function getRecentChannelIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("❌ 讀取最近使用頻道失敗:", e);
    return [];
  }
}

export function addRecentChannel(channelId: string): void {
  try {
    const current = getRecentChannelIds();
    const updated = [channelId, ...current.filter((id) => id !== channelId)];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated.slice(0, MAX_RECENT))
    );
  } catch (e) {
    console.error("❌ 儲存最近使用頻道失敗:", e);
  }
}

export function clearRecentChannels(): void {
  localStorage.removeItem(STORAGE_KEY);
}
