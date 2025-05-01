/* --------------------------------------------------------------------------
 * CategoryEditorV2 - 型別定義
 * 依據「分類標籤編輯器設計規格 v3.5」整理
 * ------------------------------------------------------------------------ */

/** 影片三大類型（直播 / 影片 / Shorts） */
export type VideoType = 'live' | 'videos' | 'shorts';

/** 主分類名稱（固定五種，含「其他」） */
export type MainCategory = '雜談' | '節目' | '音樂' | '遊戲' | '其他';

/** 遊戲項目：名稱 + 關鍵字清單 */
export interface GameEntry {
  /** 遊戲顯示名稱（唯一） */
  game: string;
  /** 關鍵字或別名（不含遊戲名稱本身） */
  keywords: string[];
}

/** 單一影片文件（Firestore `videos/{videoId}`）— 只列前端會用到的欄位 */
export interface Video {
  videoId: string;
  title: string;
  /** Firestore 以字符串保存，前端可轉 Date */
  publishDate: string;
  /** 秒數 */
  duration: number;
  /** 'live' | 'videos' | 'shorts' — 從 Firestore 的 `type` 欄位轉換 */
  type: VideoType;
  /** 可能同時包含多個主分類名稱 */
  matchedCategories: MainCategory[];
  /** 命中「遊戲」時的遊戲名稱 */
  game?: string;
  /** 影片原始分類欄位（後端維護，前端僅展示用） */
  category?: MainCategory[];
  /** 命中關鍵字清單（僅除錯用，可省略） */
  matchedKeywords?: string[];
}

/** 五大主分類的設定：
 *  - 雜談 / 節目 / 音樂 / 其他 → 關鍵字陣列
 *  - 遊戲 → GameEntry 陣列
 */
export interface CategorySettings {
  雜談: string[];
  節目: string[];
  音樂: string[];
  遊戲: GameEntry[];
  其他: string[];
}

/** 三種影片類型對應各自的 CategorySettings */
export type CategoryConfig = Record<VideoType, CategorySettings>;

/** 編輯器全域狀態（儲存於 Zustand Store） */
export interface EditorState {
  /** 目前正在編輯的頻道 ID */
  channelId: string;
  /** 三大類型完整設定 */
  config: CategoryConfig;
  /** 該頻道全部影片清單（前端自行依 type 過濾） */
  videos: Video[];
  /** 使用者目前頁籤（live / videos / shorts） */
  activeType: VideoType;
  /** 尚未儲存旗標 */
  unsaved: boolean;
  /** 使用者在「建議關鍵字」面板點 × 忽略的詞 */
  removedSuggestedKeywords: string[];
}
