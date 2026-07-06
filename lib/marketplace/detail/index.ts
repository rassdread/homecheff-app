export type {
  DetailSectionId,
  DetailLayoutTier,
  DetailPageKind,
  DetailSectionVisibility,
  DetailSectionPlan,
  DetailLayoutPlan,
  DetailForbiddenSignal,
  DetailActionId,
  DetailActionContract,
} from './detail-page-contract';

export {
  DETAIL_SECTION_IDS,
  DETAIL_LAYOUT_TIERS,
  DETAIL_PAGE_KINDS,
  DETAIL_FORBIDDEN_SIGNALS,
  DETAIL_ACTION_IDS,
  listingKindToDetailKind,
  isCanonicalDetailSectionOrder,
} from './detail-page-contract';

export type {
  DetailTrustLineKind,
  DetailTrustLine,
  DetailTrustBlockPlan,
} from './detail-trust-block';

export {
  primaryTrustChannelForKind,
  buildDetailTrustBlock,
  detailTrustUsesForbiddenSignals,
} from './detail-trust-block';

export {
  DETAIL_ACTION_MATRIX,
  actionsForDetailKind,
  primaryActionForKind,
  stickyMobileActions,
  allDetailKindsHaveActions,
} from './detail-action-matrix';

export type { DetailKindBehavior } from './detail-kind-matrix';

export {
  DETAIL_KIND_BEHAVIORS,
  buildDetailSectionPlan,
  kindBehavior,
} from './detail-kind-matrix';

export {
  buildMobileDetailLayout,
  buildDesktopDetailLayout,
  DESKTOP_DETAIL_GRID,
  sidebarSectionsVisibleWithoutScroll,
} from './detail-layout-contract';

export type {
  DetailValueExchangeLine,
  DetailValueExchangeBlockPlan,
} from './detail-value-exchange-block';

export {
  buildDetailValueExchangeBlock,
  valueExchangeSectionTitleKey,
} from './detail-value-exchange-block';
