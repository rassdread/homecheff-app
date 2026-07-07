/**
 * Detail UI section order — Phase 4C-UI.
 * Extends canonical DETAIL_SECTION_IDS with accepted_values + conditions slots.
 */

import type { DetailPageKind } from './detail-page-contract';
import { DETAIL_EXCHANGE_SUGGESTIONS_SLOT } from './detail-page-contract';
import { buildDetailSectionPlan } from './detail-kind-matrix';

/** User-facing read order on product detail (mobile + main column). */
export const DETAIL_UI_SECTION_IDS = [
  'hero_media',
  'person_row',
  'description',
  'value_exchange',
  'accepted_values',
  'conditions',
  'trust_block',
  DETAIL_EXCHANGE_SUGGESTIONS_SLOT,
  'availability',
  'reviews',
  'related_listings',
  'action_block',
] as const;

export type DetailUiSectionId = (typeof DETAIL_UI_SECTION_IDS)[number];

export type DetailUiSectionPlan = {
  sectionId: DetailUiSectionId;
  visibility: 'show' | 'hide' | 'collapsible';
};

const UI_INSERT_AFTER_VALUE: DetailUiSectionId[] = [
  'accepted_values',
  'conditions',
];

export function buildDetailUiSectionPlan(kind: DetailPageKind): DetailUiSectionPlan[] {
  const base = buildDetailSectionPlan(kind);
  const out: DetailUiSectionPlan[] = [];

  for (const section of base) {
    if (section.sectionId === 'hero_media') {
      out.push({ sectionId: 'hero_media', visibility: section.visibility });
      continue;
    }
    if (section.sectionId === 'person_row') {
      out.push({ sectionId: 'person_row', visibility: section.visibility });
      continue;
    }
    if (section.sectionId === 'value_exchange') {
      out.push({ sectionId: 'description', visibility: 'show' });
      out.push({
        sectionId: 'value_exchange',
        visibility: section.visibility === 'hide' ? 'hide' : 'collapsible',
      });
      for (const extra of UI_INSERT_AFTER_VALUE) {
        out.push({
          sectionId: extra,
          visibility: section.visibility === 'hide' ? 'hide' : 'show',
        });
      }
      continue;
    }
    if (section.sectionId === 'trust_block') {
      out.push({ sectionId: 'trust_block', visibility: section.visibility });
      out.push({
        sectionId: DETAIL_EXCHANGE_SUGGESTIONS_SLOT,
        visibility: kind === 'INSPIRATION' || kind === 'DELIVERY' ? 'hide' : 'show',
      });
      continue;
    }
    if (section.sectionId === 'description') {
      continue;
    }
    out.push({
      sectionId: section.sectionId as DetailUiSectionId,
      visibility: section.visibility,
    });
  }

  return out;
}

export function isDetailUiSectionVisible(
  plan: DetailUiSectionPlan[],
  sectionId: DetailUiSectionId,
): boolean {
  const entry = plan.find((s) => s.sectionId === sectionId);
  return entry != null && entry.visibility !== 'hide';
}
