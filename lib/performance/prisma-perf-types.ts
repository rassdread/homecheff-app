export type PrismaPerfCategory = 'feed-db' | 'trust' | 'stats' | 'enrichment' | 'other';

export type PrismaPerfSnapshot = {
  queryCount: number;
  totalMs: number;
  durationByCategory: Partial<Record<PrismaPerfCategory, number>>;
  countByCategory: Partial<Record<PrismaPerfCategory, number>>;
  slowestMs: number;
  slowestKey: string | null;
};
