// tagService.js - 與後端 Firestore 溝通的模組

const API_BASE = "/api/categories";

export async function getTagConfig() {
  try {
    const res = await fetch(API_BASE, {
      method: "GET",
    });
    if (!res.ok) throw new Error("無法取得分類設定");
    return await res.json();
  } catch (err) {
    console.error("🔥 getTagConfig 發生錯誤", err);
    return [];
  }
}

export async function saveTagConfig(tagData) {
  try {
    const res = await fetch(API_BASE + "/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tagData),
    });
    if (!res.ok) throw new Error("分類設定儲存失敗");
    return await res.json();
  } catch (err) {
    console.error("🔥 saveTagConfig 發生錯誤", err);
    return null;
  }
}