import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5173";


/**
 * 從後端 API 讀取指定頻道的分類設定
 * @param channelId 頻道 ID
 */
export const loadChannelSettings = async (channelId: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/firestore/load-category-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: channelId }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP錯誤：${res.status}`, code: "HTTP_ERROR" };
    }

    const result = await res.json();
    return {
      success: result.success,
      settings: result.settings || null,
      error: result.error || null,
      code: result.code || null,
    };
  } catch (error: any) {
    console.error("loadChannelSettings error:", error);
    return { success: false, error: error.message || "未知錯誤", code: "FETCH_ERROR" };
  }
};

/**
 * 將分類設定儲存到指定頻道
 * @param channelId 頻道 ID
 * @param data 要儲存的資料
 */
export const saveChannelSettings = async (channelId: string, data: any) => {
  try {
    const res = await fetch(`${API_BASE}/api/categories/save-and-apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel_id: channelId,
        settings: data,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP錯誤：${res.status}` };
    }

    const result = await res.json();

    if (!result.success) {
      return { success: false, error: result.error || "未知錯誤" };
    }

    return { success: true, updated_count: result.updated_count };
  } catch (error: any) {
    console.error("saveChannelSettings error:", error);
    return { success: false, error: error.message || "未知錯誤" };
  }
};
