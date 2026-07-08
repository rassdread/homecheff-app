/**
 * Business analytics tier gates — Phase 12A.
 * Exposes only metrics that exist in seller dashboard APIs today.
 */

import type { AnalyticsLevel } from '@/lib/business/visibility-profile';

export type SellerAnalyticsMetric =
  | 'views'
  | 'clicks'
  | 'favorites'
  | 'messages'
  | 'conversion_rate'
  | 'popular_listings'
  | 'regional_reach'
  | 'category_performance'
  | 'campaign_performance'
  | 'profile_visits'
  | 'accepted_value_insights'
  | 'export';

const TIER_METRICS: Record<AnalyticsLevel, readonly SellerAnalyticsMetric[]> = {
  none: [],
  basic: ['views', 'favorites'],
  pro: ['views', 'favorites', 'messages', 'conversion_rate', 'popular_listings'],
  premium: [
    'views',
    'favorites',
    'messages',
    'conversion_rate',
    'popular_listings',
    'profile_visits',
    'export',
  ],
};

/**
 * Metrics returned by /api/seller/dashboard/stats (Phase 13C).
 * Keep in sync with stats route response fields.
 */
export const IMPLEMENTED_ANALYTICS_METRICS: readonly SellerAnalyticsMetric[] = [
  'views',
  'favorites',
  'messages',
  'conversion_rate',
  'popular_listings',
] as const;

export const UNIMPLEMENTED_ANALYTICS_METRICS: readonly SellerAnalyticsMetric[] = [
  'clicks',
  'regional_reach',
  'category_performance',
  'campaign_performance',
  'profile_visits',
  'accepted_value_insights',
  'export',
] as const;

export function analyticsMetricsForLevel(level: AnalyticsLevel): SellerAnalyticsMetric[] {
  return [...TIER_METRICS[level]];
}

export function canAccessAnalyticsMetric(
  level: AnalyticsLevel,
  metric: SellerAnalyticsMetric,
): boolean {
  return TIER_METRICS[level].includes(metric);
}

export function isAnalyticsMetricImplemented(metric: SellerAnalyticsMetric): boolean {
  return IMPLEMENTED_ANALYTICS_METRICS.includes(metric);
}
