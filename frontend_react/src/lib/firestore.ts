import { apiPost } from "@/lib/api";

/**
 * 從後端 API 讀取指定頻道的分類設定
 * @param channelId 頻道 ID
 */
export const loadChannelSettings = async (channelId: string) => {
  try {
    const res = await apiPost("/api/firestore/load-category-settings", {
      channel_id: channelId,
    });

    if (res.status === 404) {
      return { success: false, error: "NOT_FOUND", code: "not-found" };
    }
    if (!res.ok) {
      return { success: false, error: `HTTP錯誤：${res.status}`, code: "HTTP_ERROR" };
    }

    const result = await res.json();
    return {
      success: true,
      settings: result.settings || null,
      error: null,
      code: null,
    };
  } catch (error: unknown) {
    console.error("loadChannelSettings error:", error);
    const message = error instanceof Error ? error.message : "未知錯誤";
    return { success: false, error: message, code: "FETCH_ERROR" };
  }
};

/**
 * 將分類設定儲存到指定頻道
 * @param channelId 頻道 ID
 * @param data 要儲存的資料
 */
export const saveChannelSettings = async (channelId: string, data: Record<string, unknown>) => {
  try {
    const res = await apiPost("/api/categories/save-and-apply", {
      channel_id: channelId,
      settings: data,
    });

    if (!res.ok) {
      const result = await res.json().catch(() => null);
      return { success: false, error: result?.error || `HTTP錯誤：${res.status}` };
    }

    const result = await res.json();

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, updated_count: result.updated_count };
  } catch (error: unknown) {
    console.error("saveChannelSettings error:", error);
    const message = error instanceof Error ? error.message : "未知錯誤";
    return { success: false, error: message };
  }
};
