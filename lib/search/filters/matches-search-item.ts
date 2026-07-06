import type {
  SearchFilterParams,
  SearchableListingRecord,
} from '../contracts/search-contract';
import { matchesSearchListingFilters } from './search-listing-filters';
import { matchesSearchTextQuery } from './search-text';

/** Combined text + structured filter match — single entry for all search surfaces. */
export function matchesSearchItem(
  item: SearchableListingRecord,
  filters: SearchFilterParams,
): boolean {
  if (!matchesSearchListingFilters(item, filters)) return false;
  if (filters.q?.trim() && !matchesSearchTextQuery(item, filters.q)) {
    return false;
  }
  return true;
}
