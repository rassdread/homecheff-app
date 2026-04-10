import { hasUsableMediaUrl } from "@/components/feed/feedMedia";

/** Minimale velden voor ranking (GeoFeed FeedItem is hiermee compatibel). */
export type RankableSaleItem = {
  id: string;
  photo: string | null;
  createdAt: string;
  viewCount?: number;
  propsCount?: number;
  distanceKm?: number;
};

export function computeRecencyBoost(createdAt: string, nowMs: number): number {
  const hoursOld =
    (nowMs - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (!Number.isFinite(hoursOld) || hoursOld < 0) return 0;
  if (hoursOld < 24) return 50;
  if (hoursOld < 72) return 30;
  if (hoursOld < 168) return 10;
  return 0;
}

export function computeDistanceBoost(distanceKm?: number): number {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return 0;
  const d = distanceKm;
  if (d < 1) return 40;
  if (d < 5) return 25;
  if (d < 10) return 10;
  return 0;
}

export function saleItemHasMedia(item: RankableSaleItem): boolean {
  return hasUsableMediaUrl(item.photo);
}

export function computeSaleScore(
  item: RankableSaleItem,
  nowMs: number
): number {
  const props = item.propsCount ?? 0;
  const views = item.viewCount ?? 0;
  let score =
    props * 3 +
    views * 0.5 +
    computeRecencyBoost(item.createdAt, nowMs) +
    computeDistanceBoost(item.distanceKm);
  if (saleItemHasMedia(item)) score += 10;
  return score;
}

export type ScoredSale<T extends RankableSaleItem = RankableSaleItem> = {
  item: T;
  score: number;
};

export function rankSalesByScore<T extends RankableSaleItem>(
  items: T[],
  nowMs: number
): ScoredSale<T>[] {
  return items
    .map((item) => ({ item, score: computeSaleScore(item, nowMs) }))
    .sort((a, b) => b.score - a.score);
}

/** Cold-start: max 2 lage-views items vooraan, daarna de rest, resterend fresh achteraan. */
export function applyColdStartScoreOrder<T extends RankableSaleItem>(
  ranked: ScoredSale<T>[]
): T[] {
  const fresh = ranked.filter((x) => (x.item.viewCount || 0) < 5);
  const rest = ranked.filter((x) => (x.item.viewCount || 0) >= 5);
  return [
    ...fresh.slice(0, 2).map((x) => x.item),
    ...rest.map((x) => x.item),
    ...fresh.slice(2).map((x) => x.item),
  ];
}

export type TopThreeSalesResult<T extends RankableSaleItem> = {
  winner: T;
  second: T;
  /** Alleen gezet als géén inspiratie op plek 3 */
  thirdSale?: T;
  /** true = positie 3 is voor inspiratiekaart */
  useInspirationAtThird: boolean;
};

/**
 * Positie 1 = hoogste score; 2 = sterk met media (anders beste restant);
 * 3 = inspiratie (als toegestaan en beschikbaar) of derde beste sale.
 */
export function pickTopThreeSales<T extends RankableSaleItem>(
  pool: T[],
  scoreById: Map<string, number>,
  options: {
    allowInspirationAtThird: boolean;
    hasInspiration: boolean;
  }
): TopThreeSalesResult<T> | null {
  if (pool.length < 2) return null;
  const score = (i: T) => scoreById.get(i.id) ?? 0;

  const byScore = [...pool].sort((a, b) => score(b) - score(a));
  const winner = byScore[0];
  const restAfterWinner = byScore.filter((x) => x.id !== winner.id);
  const withMedia = restAfterWinner
    .filter((x) => saleItemHasMedia(x))
    .sort((a, b) => score(b) - score(a));
  const second =
    withMedia[0] ??
    [...restAfterWinner].sort((a, b) => score(b) - score(a))[0];

  const useInspirationAtThird =
    options.allowInspirationAtThird && options.hasInspiration;

  const used = new Set([winner.id, second.id]);
  const rest2 = byScore.filter((x) => !used.has(x.id));

  if (useInspirationAtThird) {
    return { winner, second, useInspirationAtThird: true };
  }

  const thirdSale =
    rest2.length > 0
      ? [...rest2].sort((a, b) => score(b) - score(a))[0]
      : undefined;

  return {
    winner,
    second,
    thirdSale,
    useInspirationAtThird: false,
  };
}
