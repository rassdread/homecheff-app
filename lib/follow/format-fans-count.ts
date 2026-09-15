/** Dutch/English fan count copy for tiles — 0 fans / 1 fan / N fans. */
export function formatFansCountLabel(
  count: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const n = Math.max(0, Math.floor(count) || 0);
  if (n === 1) return t('follow.fansCountOne') || '1 fan';
  return t('follow.fansCountMany', { count: n }) || `${n} fans`;
}
