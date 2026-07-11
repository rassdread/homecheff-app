/**
 * Phase 13W — Living Platform evidence queries (SSOT).
 * Only factual, public, measurable data — never invented numbers.
 */

import { prisma } from '@/lib/prisma';
import { getDisplayName } from '@/lib/displayName';
import { LOCAL_SEO_CITIES } from '@/lib/seo/localCities';
import { getEcosystemHubForCitySlug } from '@/lib/community/getEcosystemHubForCitySlug';
import { shouldIndexCityHub } from '@/lib/seo/city-indexability';
import {
  CATEGORY_ECOSYSTEM_SLUGS,
  getCategoryEcosystem,
} from '@/lib/community/getCategoryEcosystem';

export const EVIDENCE_WINDOW_DAYS = 7;

export type PlatformStatistics = {
  generatedAt: string;
  /** Counts from live database — zero is valid. */
  publicProfiles: number;
  publicListings: number;
  publishedInspiration: number;
  productReviews: number;
  activeDeliveryPartners: number;
  completedCommunityOrders: number;
  barterOpenListings: number;
  neighbourhoodRequests: number;
  businessSubscriptionsActive: number;
  categoriesInUse: number;
  indexedCityHubs: number;
};

export type EvidenceListItem = {
  label: string;
  href?: string;
  meta?: string;
};

export type EvidenceSnapshot = {
  generatedAt: string;
  windowDays: number;
  recentMakers: EvidenceListItem[];
  recentListings: EvidenceListItem[];
  recentInspiration: EvidenceListItem[];
  recentRequests: EvidenceListItem[];
  recentBarterListings: EvidenceListItem[];
  activeCities: EvidenceListItem[];
  categoryActivity: EvidenceListItem[];
  deliveryPartnersCount: number;
  completedCommunityOrdersWeek: number;
};

function weekAgo(): Date {
  return new Date(Date.now() - EVIDENCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

function formatDate(iso: Date): string {
  return iso.toISOString().slice(0, 10);
}

/** Aggregate platform statistics — no PII. */
export async function getPlatformStatistics(): Promise<PlatformStatistics> {
  const since = weekAgo();

  const [
    publicProfiles,
    publicListings,
    publishedInspiration,
    productReviews,
    activeDeliveryPartners,
    completedCommunityOrders,
    barterOpenListings,
    neighbourhoodRequests,
    businessSubscriptionsActive,
    categoryRows,
  ] = await Promise.all([
    prisma.user.count({ where: { showProfileToEveryone: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.dish.count({ where: { status: 'PUBLISHED' } }),
    prisma.productReview.count(),
    prisma.deliveryProfile.count({
      where: { isActive: true, isBlocked: false },
    }),
    prisma.communityOrder.count({ where: { status: 'COMPLETED' } }),
    prisma.product.count({
      where: {
        isActive: true,
        barterOpenness: { in: ['MONEY_AND_BARTER', 'BARTER_ONLY'] },
      },
    }),
    prisma.product.count({
      where: { isActive: true, listingIntent: 'REQUEST' },
    }),
    prisma.businessSubscription.count({
      where: { status: 'active' },
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
    }),
  ]);

  let indexedCityHubs = 0;
  for (const city of LOCAL_SEO_CITIES) {
    const hub = await getEcosystemHubForCitySlug(city.slug);
    if (shouldIndexCityHub(hub)) indexedCityHubs += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    publicProfiles,
    publicListings,
    publishedInspiration,
    productReviews,
    activeDeliveryPartners,
    completedCommunityOrders,
    barterOpenListings,
    neighbourhoodRequests,
    businessSubscriptionsActive,
    categoriesInUse: categoryRows.length,
    indexedCityHubs,
  };
}

/** Recent public activity modules for /evidence — minimal fields only. */
export async function getEvidenceSnapshot(): Promise<EvidenceSnapshot> {
  const since = weekAgo();
  const take = 5;

  const [
    recentProducts,
    recentDishes,
    recentUsers,
    recentRequests,
    recentBarter,
    recentInspirationDishes,
    deliveryPartnersCount,
    completedCommunityOrdersWeek,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
      },
    }),
    prisma.dish.findMany({
      where: { status: 'PUBLISHED', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: {
        showProfileToEveryone: true,
        createdAt: { gte: since },
        username: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        username: true,
        name: true,
        displayFullName: true,
        displayNameOption: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        listingIntent: 'REQUEST',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        barterOpenness: { in: ['MONEY_AND_BARTER', 'BARTER_ONLY'] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.dish.findMany({
      where: { status: 'PUBLISHED', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.deliveryProfile.count({
      where: { isActive: true, isBlocked: false },
    }),
    prisma.communityOrder.count({
      where: { status: 'COMPLETED', completedAt: { gte: since } },
    }),
  ]);

  const recentListings: EvidenceListItem[] = [
    ...recentProducts.map((p) => ({
      label: p.title?.trim() || 'Listing',
      href: `/product/${p.id}`,
      meta: `${String(p.category)} · ${formatDate(p.createdAt)}`,
    })),
    ...recentDishes.map((d) => ({
      label: d.title?.trim() || 'Inspiratie',
      href: `/inspiratie/${d.id}`,
      meta: formatDate(d.createdAt),
    })),
  ].slice(0, take);

  const recentMakers: EvidenceListItem[] = recentUsers.map((u) => ({
    label: getDisplayName(u),
    href: u.username ? `/user/${u.username}` : undefined,
    meta: formatDate(u.createdAt),
  }));

  const recentInspiration: EvidenceListItem[] = recentInspirationDishes.map((d) => ({
    label: d.title?.trim() || 'Inspiratie',
    href: `/inspiratie/${d.id}`,
    meta: formatDate(d.createdAt),
  }));

  const recentRequestsItems: EvidenceListItem[] = recentRequests.map((p) => ({
    label: p.title?.trim() || 'Gezocht',
    href: `/product/${p.id}`,
    meta: formatDate(p.createdAt),
  }));

  const recentBarterListings: EvidenceListItem[] = recentBarter.map((p) => ({
    label: p.title?.trim() || 'Ruil',
    href: `/product/${p.id}`,
    meta: formatDate(p.createdAt),
  }));

  const activeCities: EvidenceListItem[] = [];
  for (const city of LOCAL_SEO_CITIES) {
    const hub = await getEcosystemHubForCitySlug(city.slug);
    if (!hub || !shouldIndexCityHub(hub)) continue;
    activeCities.push({
      label: city.label,
      href: `/maaltijden/${city.slug}`,
      meta: `${hub.activeCreatorsWeek} makers (7d) · ${hub.newListingsWeek} listings (7d)`,
    });
  }

  const categoryActivity: EvidenceListItem[] = [];
  for (const slug of CATEGORY_ECOSYSTEM_SLUGS) {
    const eco = await getCategoryEcosystem(slug);
    if (!eco || eco.newListingsWeek + eco.inspirationPostsWeek === 0) continue;
    categoryActivity.push({
      label: slug,
      href: `/gemeenschap/${slug}`,
      meta: `${eco.newListingsWeek} new listings · ${eco.inspirationPostsWeek} inspiration (7d)`,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    windowDays: EVIDENCE_WINDOW_DAYS,
    recentMakers,
    recentListings,
    recentInspiration,
    recentRequests: recentRequestsItems,
    recentBarterListings,
    activeCities,
    categoryActivity,
    deliveryPartnersCount,
    completedCommunityOrdersWeek,
  };
}

/** Public read-only dataset index (architecture for future exports). */
export const PUBLIC_DATASET_CATALOG = [
  { id: 'glossary', path: '/glossary', labelKey: 'datasetGlossary' },
  { id: 'categories', path: '/gemeenschap/keuken', labelKey: 'datasetCategories' },
  { id: 'cities', path: '/maaltijden/vlaardingen', labelKey: 'datasetCities' },
  { id: 'statistics', path: '/statistics', labelKey: 'datasetStatistics' },
  { id: 'docs', path: '/docs', labelKey: 'datasetDocs' },
] as const;
