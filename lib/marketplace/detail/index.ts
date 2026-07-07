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
  DETAIL_EXCHANGE_SUGGESTIONS_SLOT,
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
  buildDesiredExchangesForDetail,
} from './detail-value-exchange-block';

export type {
  DetailUiSectionId,
  DetailUiSectionPlan,
} from './detail-ui-section-order';

export {
  DETAIL_UI_SECTION_IDS,
  buildDetailUiSectionPlan,
  isDetailUiSectionVisible,
} from './detail-ui-section-order';

export type {
  AcceptedValueSubcategoryLine,
  AcceptedValueCategoryGroup,
  DetailAcceptedValuesPresentation,
} from './detail-accepted-values-presentation';

export { buildDetailAcceptedValuesPresentation } from './detail-accepted-values-presentation';

export type {
  DetailConditionLineKind,
  DetailConditionLine,
} from './detail-conditions-block';

export {
  buildDetailConditionsBlock,
  detailConditionsHasContent,
} from './detail-conditions-block';

export type { ResolvedDetailPageActions } from './resolve-detail-actions';
export { resolveDetailPageActions } from './resolve-detail-actions';
