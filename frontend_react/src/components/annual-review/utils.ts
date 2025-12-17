/** 秒 -> X小時MM分鐘（<1小時不顯示小時；有小時時分鐘補零） */
export function formatDurationHM(totalSeconds?: number | null): string {
  const s = typeof totalSeconds === "number" ? totalSeconds : 0;
  if (s <= 0) return "未知";

  const totalMinutes = Math.floor(s / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}分鐘`;
  const mm = String(minutes).padStart(2, "0");
  return `${hours}小時${mm}分鐘`;
}

/** ISO(UTC) -> YYYY-MM-DD HH:MM (GMT+8) */
export function formatDateTimeGMT8(isoString?: string | null): string {
  if (!isoString) return "未知";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "未知";

  const gmt8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const yyyy = gmt8.getUTCFullYear();
  const mm = String(gmt8.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(gmt8.getUTCDate()).padStart(2, "0");
  const hh = String(gmt8.getUTCHours()).padStart(2, "0");
  const min = String(gmt8.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min} (GMT+8)`;
}

/** 解析 YYYY-MM-DD 為 UTC Date 物件 */
export function parseYMDToUtc(ymd?: string | null): Date | null {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** 計算包含頭尾的天數 */
export function calcInclusiveDays(startYmd?: string | null, endYmd?: string | null): number | null {
  const s = parseYMDToUtc(startYmd);
  const e = parseYMDToUtc(endYmd);
  if (!s || !e) return null;
  const diff = e.getTime() - s.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

/** 限制數值範圍 */
export function clampInt(n: unknown, min: number, max: number): number {
  const x = typeof n === "number" ? Math.floor(n) : NaN;
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/**
 * 將 YYYY-MM-DD 轉為 "M月D日 週X"
 * 例如: "2025-02-03" -> "2月3日 週一"
 */
export function formatDateWithWeekday(dateStr?: string | null): string {
  if (!dateStr) return "未知日期";
  const date = parseYMDToUtc(dateStr);
  if (!date) return dateStr;

  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  const w = weekdays[date.getUTCDay()];

  return `${month}月${day}日 ${w}`;
}