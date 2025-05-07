// hooks/utils/badgeUtils.ts
import type { Video, CategorySettings, GameEntry, Badge } from '../../types/editor';

// 小工具：大小寫不敏感包含
const hit = (title: string, kw: string) =>
  title.toLowerCase().includes(kw.toLowerCase());

export function generateBadgesForVideo(
  v: Video,
  cfg: CategorySettings | undefined,
): Badge[] {
  if (!cfg) return [{ main: '未分類' }];
  const badges: Badge[] = [];

  (['雜談', '節目', '音樂', '其他'] as const).forEach((main) => {
    const kws = cfg[main] as string[] | undefined;
    kws?.forEach((kw) => hit(v.title, kw) && badges.push({ main, keyword: kw }));
  });

  (cfg['遊戲'] ?? []).forEach((g: GameEntry) => {
    if (hit(v.title, g.game) || g.keywords.some((kw) => hit(v.title, kw))) {
      badges.push({ main: '遊戲', keyword: g.game });
    }
  });

  return badges.length ? badges : [{ main: '未分類' }];
}
