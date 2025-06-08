/**
 * 標準化文字：用於影片標題、關鍵詞分析與比對
 * @param text 原始文字
 * @param options 可選參數：是否保留 "."（預設 false）
 */
export function normalize(text: string, options?: { preserveDot?: boolean }): string {
  const separated = text
    .replace(/([\p{Script=Han}])([a-zA-Z])/gu, '$1 $2') // 中文+英文 → 中 英
    .replace(/([a-zA-Z])([\p{Script=Han}])/gu, '$1 $2'); // 英文+中文 → 英 中

  const replaced = separated.replace(/[\[\]【】()（）]/g, ' '); // 取代括號字元

  const pattern = options?.preserveDot
    ? /[^\p{L}\p{N}_\.]+/gu // 保留中英文字母、數字、底線與點號
    : /[^\p{L}\p{N}_]+/gu;  // 不保留點號

  return replaced.replace(pattern, ' ').toLowerCase();
}

/**
 * 擷取括號中的片語，排除僅包住一個中文字的情況
 */
export function extractBracketPhrases(text: string): string[] {
  const matches = text.match(/[\[\(【（](.*?)[\]\)】）]/g);
  if (!matches) return [];

  return matches
    .map((phrase) => phrase.slice(1, -1)) // 去除前後括號
    .filter((content) => {
      const onlyChineseChar = /^[\p{Script=Han}]$/u; // 僅一個中文字
      return !onlyChineseChar.test(content.trim());
    })
    .map((content) => normalize(content).trim())
    .filter((phrase) => phrase.length > 0);
}

/**
 * 停用詞清單（中文）
 */
export const ZH_STOP_WORDS = [
  '更新', '這個',
  're',
  '台v', '男v', '台灣', '台湾', '台灣vtuber', '台湾vtuber',
  '日v', '馬v', '馬來西亞', '马来西亚', 'vtuber', 'ai vtuber',
  '新人',
  '初見歡迎', '初見大歓迎', '初見歓迎', '初見',
  '對不起', '天啊', '什麼', '興奮', '遊戲',
  'live', 'shorts',
  'high', 'game', 'games', 'gaming', 'super', 'life', 'youtube',
  'city', 'wrong', 'new', 'take', 'vs', 'v.s', 'v.s.'
];

/**
 * 停用詞清單（英文）
 */
export const EN_STOP_WORDS = [
  'a', 'an', 'the', // 冠詞
  'and', 'or', 'but', 'if', 'because', 'as', 'while', 'than', // 連接詞
  'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'off', 'out', 'over', 'to', 'with', 'about', 'against', 'between', 'during', 'without', 'within', 'through', 'under', 'above', 'below', // 介系詞
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'want', // be 動詞
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', // 助動詞
  'this', 'that', 'these', 'those', // 指示代名詞
  'it', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'their', 'our', // 人稱代名詞
  'so', 'such', 'not', 'no', 'nor', 'too', 'very', 'just', 'only', 'own', 'same', 'than', // 其他常見功能詞
  'well', 'also', 'then', 'there', 'here', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'ever', 'after', 'before'
];

/**
 * 流水號常見前綴詞（中英混用）
 */
export const SERIAL_PREFIXES = [
  'no', 'ep', 'episode', 'epsode',
  'no.', 'ep.',
  'vol', 'vol.',
  'part', 'pt',
  'part.', 'pt.',
  'ch', 'ch.', 'chapter', 'chapter.', ,
  'day', 'week', 'month', 'season',
  '章節', '章', '集', '部', '篇', '期', '話', '卷'
];

/**
 * 停用詞集合
 */
export const STOP_WORDS = new Set([
  ...EN_STOP_WORDS,
  ...ZH_STOP_WORDS,
  ...SERIAL_PREFIXES,
]);

/**
 * 流水號樣式判斷用的正則
 */
export const REGEX_SKIP_PATTERNS: RegExp[] = [
  /^\d+$/, // 純阿拉伯數字
  /^[一二三四五六七八九零十百千萬億兆]+$/, // 純中文數字
  /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv)$/i, // 羅馬數字
  /^#?\d{1,4}$/, // #12、003
  /^s\d+e\d+$/i, // s01e03
  /^\d{4}\.\d{1,2}\.\d{1,2}$/, // 日期格式
  /^第[一二三四五六七八九十百千萬億零〇两\d]+(年|季|周|週|日|個月)$/, // 中文時間格式
  /^第[一二三四五六七八九十百千萬億零〇两\d]+[章集部篇期話卷]$/, // 第五章、第12集
  /^[序一二三四五六七八九十百千萬億零〇两\d]+[章集部篇期話卷]$/, // 六部、12篇
  /^[上下前中後][章集部篇期話卷]$/, // 上集、後篇、中章等
  /^第?[一二三四五六七八九十百千萬零〇两\d]+[週周]目$/, // 一周目、2週目、第二周目
];

/**
 * 判斷是否為編號／流水號樣式
 */
export function isSerialPattern(word: string): boolean {
  const normalized = word.toLowerCase();

  // 1. 直接命中正則樣式
  if (REGEX_SKIP_PATTERNS.some((regex) => regex.test(normalized))) {
    return true;
  }

  // 2. 命中前綴 + 數字，例如 ep12、vol003
  const match = normalized.match(/^([a-z\.]+)(\d{1,4})$/);
  if (match) {
    const [_, prefix] = match;
    if (SERIAL_PREFIXES.includes(prefix)) {
      return true;
    }
  }

  // 3. 括號完整包覆的模式
  const BRACKET_PAIRS: [string, string][] = [
    ['(', ')'],
    ['（', '）'],
    ['[', ']'],
    ['【', '】'],
  ];

  for (const [open, close] of BRACKET_PAIRS) {
    for (const pattern of REGEX_SKIP_PATTERNS) {
      const wrappedRegex = new RegExp(`^\\${open}${pattern.source}\\${close}$`, pattern.flags);
      if (wrappedRegex.test(normalized)) {
        if (normalized === '二周目') {
          console.log(`  ✅ 命中包覆樣式 REGEX_SKIP_PATTERNS: ${wrappedRegex}`);
        }
        return true;
      }
    }

    const prefixMatch = normalized.match(new RegExp(`^\\${open}([a-z\\.]+\\d{1,4})\\${close}$`));
    if (prefixMatch) {
      const raw = prefixMatch[1].toLowerCase();
      const subMatch = raw.match(/^([a-z\.]+)(\d{1,4})$/);
      if (subMatch && SERIAL_PREFIXES.includes(subMatch[1])) {
        if (normalized === '二周目') {
          console.log(`  ✅ 命中包覆 prefix+數字: ${raw}`);
        }
        return true;
      }
    }
  }

  return false;
}