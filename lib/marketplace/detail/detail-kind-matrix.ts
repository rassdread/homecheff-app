/**
 * Per-ListingKind detail section matrix — Phase 4C.
 */

import type {
  DetailPageKind,
  DetailSectionId,
  DetailSectionPlan,
  DetailSectionVisibility,
} from './detail-page-contract';
import { DETAIL_SECTION_IDS } from './detail-page-contract';

export type DetailKindBehavior = {
  kind: DetailPageKind;
  personRole: 'seller' | 'provider' | 'host' | 'coach' | 'requester' | 'creator' | 'courier';
  routePattern: string;
  currentImplementation: string;
  reviewChannel: 'product' | 'deal' | 'dish' | 'delivery' | 'none';
  availabilityType: 'stock' | 'event_date' | 'calendar' | 'needed_by' | 'meta' | 'none';
  valueExchangeFull: boolean;
  showDesiredExchanges: boolean;
};

export const DETAIL_KIND_BEHAVIORS: Record<DetailPageKind, DetailKindBehavior> = {
  PRODUCT: {
    kind: 'PRODUCT',
    personRole: 'seller',
    routePattern: '/product/[id]',
    currentImplementation: 'app/product/[id]/page.tsx',
    reviewChannel: 'product',
    availabilityType: 'stock',
    valueExchangeFull: true,
    showDesiredExchanges: false,
  },
  SERVICE: {
    kind: 'SERVICE',
    personRole: 'provider',
    routePattern: '/product/[id]',
    currentImplementation: 'app/product/[id]/page.tsx (shared)',
    reviewChannel: 'deal',
    availabilityType: 'calendar',
    valueExchangeFull: true,
    showDesiredExchanges: false,
  },
  TASK: {
    kind: 'TASK',
    personRole: 'provider',
    routePattern: '/product/[id]',
    currentImplementation: 'app/product/[id]/page.tsx (shared)',
    reviewChannel: 'deal',
    availabilityType: 'calendar',
    valueExchangeFull: true,
    showDesiredExchanges: false,
  },
  WORKSHOP: {
    kind: 'WORKSHOP',
    personRole: 'host',
    routePattern: '/product/[id]',
    currentImplementation: 'app/product/[id]/page.tsx (shared)',
    reviewChannel: 'deal',
    availabilityType: 'event_date',
    valueExchangeFull: true,
    showDesiredExchanges: false,
  },
  COACHING: {
    kind: 'COACHING',
    personRole: 'coach',
    routePattern: '/product/[id]',
    currentImplementation: 'app/product/[id]/page.tsx (shared)',
    reviewChannel: 'deal',
    availabilityType: 'calendar',
    valueExchangeFull: true,
    showDesiredExchanges: false,
  },
  DELIVERY: {
    kind: 'DELIVERY',
    personRole: 'courier',
    routePattern: '/bezorger/[username]',
    currentImplementation: 'app/bezorger/[username]/page.tsx',
    reviewChannel: 'delivery',
    availabilityType: 'none',
    valueExchangeFull: false,
    showDesiredExchanges: false,
  },
  REQUEST: {
    kind: 'REQUEST',
    personRole: 'requester',
    routePattern: '/request/[slug] (planned)',
    currentImplementation: 'app/product/[id]/page.tsx (incorrect)',
    reviewChannel: 'deal',
    availabilityType: 'needed_by',
    valueExchangeFull: true,
    showDesiredExchanges: true,
  },
  INSPIRATION: {
    kind: 'INSPIRATION',
    personRole: 'creator',
    routePattern: '/inspiratie/[id] | /recipe/[id] | /garden/[id] | /design/[id]',
    currentImplementation: 'components/inspiratie/InspiratieDetail.tsx',
    reviewChannel: 'dish',
    availabilityType: 'meta',
    valueExchangeFull: false,
    showDesiredExchanges: false,
  },
};

type SectionOverride = Partial<Record<DetailSectionId, DetailSectionVisibility>>;

const KIND_SECTION_OVERRIDES: Record<DetailPageKind, SectionOverride> = {
  PRODUCT: {},
  SERVICE: { availability: 'show' },
  TASK: { availability: 'show' },
  WORKSHOP: { availability: 'show' },
  COACHING: { availability: 'show' },
  DELIVERY: {
    value_exchange: 'hide',
    reviews: 'show',
    related_listings: 'hide',
  },
  REQUEST: {
    person_row: 'show',
    value_exchange: 'show',
    availability: 'show',
  },
  INSPIRATION: {
    value_exchange: 'hide',
    trust_block: 'hide',
    related_listings: 'hide',
    action_block: 'show',
  },
};

export function buildDetailSectionPlan(
  kind: DetailPageKind,
): DetailSectionPlan[] {
  const overrides = KIND_SECTION_OVERRIDES[kind] ?? {};
  return DETAIL_SECTION_IDS.map((sectionId) => ({
    sectionId,
    visibility: overrides[sectionId] ?? 'show',
  }));
}

export function kindBehavior(kind: DetailPageKind): DetailKindBehavior {
  return DETAIL_KIND_BEHAVIORS[kind];
}
