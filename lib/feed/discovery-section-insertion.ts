/**
 * Discovery section insertion rules — desktop vs mobile spacing and frequency.
 */

import type { DiscoverySectionId } from '@/lib/discovery/sections';
import type { DiscoveryFeedInsertionPlan } from './discovery-feed-contract';

/** Canonical section display order for feed surfaces. */
export const DISCOVERY_SECTION_DISPLAY_ORDER: DiscoverySectionId[] = [
  'nearby',
  'trending',
  'trusted_makers',
  'top_rated',
  'new_creators',
];

export const DISCOVERY_MOBILE_ITEMS_BETWEEN_SECTIONS = 6;
export const DISCOVERY_DESKTOP_SECTION_SPACING = 'mb-8';
export const DISCOVERY_MAX_VISIBLE_SECTIONS = 5;

export function buildDiscoveryInsertionPlan(
  surface: 'mobile' | 'desktop',
  availableSectionIds: DiscoverySectionId[],
): DiscoveryFeedInsertionPlan {
  const sectionOrder = DISCOVERY_SECTION_DISPLAY_ORDER.filter((id) =>
    availableSectionIds.includes(id),
  ).slice(0, DISCOVERY_MAX_VISIBLE_SECTIONS);

  return {
    surface,
    sectionOrder,
    itemsBetweenSections: DISCOVERY_MOBILE_ITEMS_BETWEEN_SECTIONS,
    leadingSectionsOnDesktop: true,
  };
}

export type FeedDisplayRow =
  | { row: 'section'; sectionId: DiscoverySectionId; titleKey: string }
  | { row: 'sale'; listingId: string };

/**
 * Flatten sections + overflow listings into display rows with section headers.
 */
export function buildDiscoveryFeedDisplayRows(
  sections: Array<{
    sectionId: DiscoverySectionId;
    titleKey: string;
    listingIds: string[];
  }>,
  overflowListingIds: string[],
  plan: DiscoveryFeedInsertionPlan,
): FeedDisplayRow[] {
  const rows: FeedDisplayRow[] = [];
  const usedInSection = new Set<string>();

  for (const section of sections) {
    if (!plan.sectionOrder.includes(section.sectionId)) continue;
    if (section.listingIds.length === 0) continue;

    rows.push({
      row: 'section',
      sectionId: section.sectionId,
      titleKey: section.titleKey,
    });

    for (const id of section.listingIds) {
      rows.push({ row: 'sale', listingId: id });
      usedInSection.add(id);
    }

    if (plan.surface === 'mobile' && plan.itemsBetweenSections > 0) {
      let spacer = 0;
      while (
        spacer < plan.itemsBetweenSections &&
        overflowListingIds.length > 0
      ) {
        const next = overflowListingIds.shift();
        if (!next || usedInSection.has(next)) continue;
        rows.push({ row: 'sale', listingId: next });
        usedInSection.add(next);
        spacer += 1;
      }
    }
  }

  for (const id of overflowListingIds) {
    if (usedInSection.has(id)) continue;
    rows.push({ row: 'sale', listingId: id });
  }

  return rows;
}
