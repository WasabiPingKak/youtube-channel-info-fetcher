// getCategoryColor.ts

/**
 * 主分類對應的原始色碼（100% 活躍度時）
 */
const BASE_COLORS: Record<string, string> = {
  "遊戲": "#8884d8", // 紫
  "雜談": "#82ca9d", // 綠
  "節目": "#ffc658", // 黃
  "音樂": "#ff7f50", // 橘
};

/**
 * 根據活躍天數對應飽和度等級（0~1）
 */
function getSaturationLevel(daysAgo: number): number {
  if (daysAgo <= 7) return 1.0;
  if (daysAgo <= 14) return 0.8;
  if (daysAgo <= 30) return 0.6;
  if (daysAgo <= 90) return 0.4;
  return 0.2;
}

/**
 * HEX 轉 HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number = 0, s: number = 0, l: number = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }

  return { h, s, l };
}

/**
 * HSL 轉 HEX
 */
function hslToHex(h: number, s: number, l: number): string {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 根據主分類名稱與距今天數，回傳對應 HEX 色碼（飽和度調整後）
 */
export function getCategoryColor(category: string, daysAgo: number): string {
  const base = BASE_COLORS[category] || "#cccccc"; // fallback
  const { h, s, l } = hexToHsl(base);
  const saturationLevel = getSaturationLevel(daysAgo);
  return hslToHex(h, s * saturationLevel, l);
}
