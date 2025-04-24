import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

const CHANNEL_ID = import.meta.env.VITE_DEFAULT_CHANNEL_ID || "UCLxa0YOtqi8IR5r2dSLXPng";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5173";

console.log("🌐 API Base = ", API_BASE); // ← 顯示實際使用的後端 URL

export const loadChannelSettings = async () => {
  const res = await fetch(`${API_BASE}/api/firestore/load-category-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel_id: CHANNEL_ID }),
  });

  if (!res.ok) {
    throw new Error(`後端回傳錯誤：${res.status}`);
  }

  const result = await res.json();
  return result.success ? result.settings : null;
};

export const saveChannelSettings = async (data: any) => {
  const res = await fetch(`${API_BASE}/api/categories/save-and-apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel_id: CHANNEL_ID,
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