import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5173";

console.log("🌐 API Base = ", API_BASE); // ← 顯示實際使用的後端 URL

/**
 * 從後端 API 讀取指定頻道的分類設定
 * @param channelId 頻道 ID
 */
export const loadChannelSettings = async (channelId: string) => {
  const res = await fetch(`${API_BASE}/api/firestore/load-category-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel_id: channelId }),
  });

  if (!res.ok) {
    throw new Error(`後端回傳錯誤：${res.status}`);
  }

  const result = await res.json();
  return result.success ? result.settings : null;
};

/**
 * 將分類設定儲存到指定頻道
 * @param channelId 頻道 ID
 * @param data 要儲存的資料
 * @returns 更新成功的影片數量
 */
export const saveChannelSettings = async (channelId: string, data: any) => {
  const res = await fetch(`${API_BASE}/api/categories/save-and-apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel_id: channelId,
      settings: data,
    }),
  });

  if (!res.ok) {
    throw new Error(`儲存設定失敗：HTTP ${res.status}`);
  }

  const result = await res.json();

  if (!result.success) {
    throw new Error(`後端錯誤：${result.error || "未知錯誤"}`);
  }

  console.log(`✅ 分類設定儲存成功，更新影片 ${result.updated_count} 筆`);
  return result.updated_count;
};
