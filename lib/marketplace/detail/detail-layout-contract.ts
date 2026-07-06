/**
 * Mobile + desktop detail layout plans — Phase 4C.
 */

import type { DetailLayoutPlan, DetailPageKind } from './detail-page-contract';
import { buildDetailSectionPlan } from './detail-kind-matrix';

export function buildMobileDetailLayout(
  kind: DetailPageKind,
): DetailLayoutPlan {
  const sections = buildDetailSectionPlan(kind).map((s) => ({
    ...s,
    visibility:
      s.sectionId === 'value_exchange' && kind !== 'INSPIRATION'
        ? ('collapsible' as const)
        : s.visibility,
  }));

  return {
    tier: 'mobile',
    sections,
    stickyActionBar: kind !== 'INSPIRATION',
    valueExchangeCollapsible: kind !== 'INSPIRATION' && kind !== 'DELIVERY',
    sidebarSticky: false,
  };
}

export function buildDesktopDetailLayout(
  kind: DetailPageKind,
): DetailLayoutPlan {
  return {
    tier: 'desktop',
    sections: buildDetailSectionPlan(kind),
    stickyActionBar: false,
    valueExchangeCollapsible: false,
    sidebarSticky: true,
  };
}

/** Desktop grid: hero left, sidebar right with trust + actions above fold. */
export const DESKTOP_DETAIL_GRID = {
  columns: 'lg:grid-cols-[3fr_2fr]',
  heroColumn: 'hero_media',
  sidebarSections: [
    'person_row',
    'value_exchange',
    'trust_block',
    'action_block',
  ] as const,
  mainColumnSections: [
    'description',
    'availability',
    'reviews',
    'related_listings',
  ] as const,
} as const;

export function sidebarSectionsVisibleWithoutScroll(
  kind: DetailPageKind,
): string[] {
  const plan = buildDesktopDetailLayout(kind);
  return plan.sections
    .filter(
      (s) =>
        s.visibility !== 'hide' &&
        (DESKTOP_DETAIL_GRID.sidebarSections as readonly string[]).includes(
          s.sectionId,
        ),
    )
    .map((s) => s.sectionId);
}
