import type { MarketplaceListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { SearchQueryIntentHint } from './contracts/search-contract';

const REQUEST_PATTERNS =
  /\b(gezocht|zoekt|zoeken|hulp(vraag)?|help|wie kan|who can|iemand die|nodig|needed|vraag)\b/i;

const WORKSHOP_PATTERNS =
  /\b(workshop|workshops|cursus|cursussen|les|lessen|cooking class|kookcursus)\b/i;

const COACHING_PATTERNS = /\b(coaching|coach|mentor|begeleiding|tutor)\b/i;

const TASK_PATTERNS =
  /\b(klus(je|jes)?|task|handyman|klusjesman|tuinman|oppas|verhuiz)\b/i;

const SERVICE_PATTERNS =
  /\b(dienst(en)?|service|webdesign|website|fotograaf|photographer|tattoo)\b/i;

/**
 * Infer ListingKind hints from free-text query — filtering assist only, not ranking.
 */
export function inferSearchQueryIntent(q: string): SearchQueryIntentHint {
  const trimmed = q.trim();
  if (!trimmed) {
    return { listingKindHints: [], suggestsRequest: false };
  }

  const hints: MarketplaceListingKind[] = [];

  if (REQUEST_PATTERNS.test(trimmed)) hints.push('REQUEST');
  if (WORKSHOP_PATTERNS.test(trimmed)) hints.push('WORKSHOP');
  if (COACHING_PATTERNS.test(trimmed)) hints.push('COACHING');
  if (TASK_PATTERNS.test(trimmed)) hints.push('TASK');
  if (SERVICE_PATTERNS.test(trimmed)) hints.push('SERVICE');

  return {
    listingKindHints: [...new Set(hints)],
    suggestsRequest: REQUEST_PATTERNS.test(trimmed),
  };
}
