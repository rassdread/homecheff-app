export type {
  SearchFilterParams,
  SearchResultClassification,
  SearchResultEntityType,
  SearchableListingRecord,
  SearchQueryIntentHint,
} from './contracts/search-contract';

export { SEARCH_LISTING_KINDS } from './contracts/search-contract';

export { inferSearchQueryIntent } from './infer-query-intent';

export {
  classifySearchResult,
  attachSearchClassification,
  attachSearchClassificationToRecord,
} from './classify-result';

export {
  matchesSearchTextQuery,
} from './filters/search-text';

export {
  matchesSearchListingFilters,
  isSearchableMarketplaceListing,
  parseListingKindParam,
  parseSearchFilterParams,
} from './filters/search-listing-filters';

export { matchesSearchItem } from './filters/matches-search-item';

export {
  buildProductTextSearchWhere,
  buildDishTextSearchWhere,
  buildListingTextSearchWhere,
} from './filters/build-product-search-where';

/** Profile filters — re-export canonical ListingKind profile matching. */
export {
  matchesProfileAanbodFilter,
} from '@/lib/marketplace/listing-kind/profile-filter';
