import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getEntryFlowItemsForGroup,
  getMarketplaceTaxonomyGroupsByCategory,
  getMarketplaceTaxonomyItem,
  getTaxonomyIdsMatchingSearchQuery,
  listingMatchesTaxonomySearchQuery,
} from '@/lib/marketplace/taxonomy-resolve';
import { matchesSearchTextQuery } from '@/lib/search/filters/search-text';
import { TAXONOMY_GROUP_LABELS, TAXONOMY_ITEM_LABELS } from '@/lib/marketplace/taxonomy-labels.data';
import { toCanonicalTaxonomyId } from '@/lib/marketplace/taxonomy-normalize';

const HOUSEHOLD_GROUP = 'grp.practical.household';
const HOUSEHOLD_IDS = [
  'practical.household',
  'practical.cleaning',
  'practical.tidying',
  'practical.laundry',
  'practical.errands',
] as const;

describe('household help taxonomy', () => {
  it('keeps Schoonmaak as the same canonical id under Huishoudelijke hulp', () => {
    const cleaning = getMarketplaceTaxonomyItem('practical.cleaning');
    assert.equal(cleaning?.parentId, HOUSEHOLD_GROUP);
    assert.equal(TAXONOMY_ITEM_LABELS['practical.cleaning'].nl, 'Schoonmaak');
    assert.equal(TAXONOMY_GROUP_LABELS['practical.household'].nl, 'Huishoudelijke hulp');
  });

  it('exposes household items for both offer and request', () => {
    const offer = getEntryFlowItemsForGroup(HOUSEHOLD_GROUP, 'offer').map((item) => item.id);
    const request = getEntryFlowItemsForGroup(HOUSEHOLD_GROUP, 'request').map((item) => item.id);
    for (const id of HOUSEHOLD_IDS) {
      assert.ok(offer.includes(id), `offer missing ${id}`);
      assert.ok(request.includes(id), `request missing ${id}`);
    }
    const groups = getMarketplaceTaxonomyGroupsByCategory('PRACTICAL_SERVICE').map((g) => g.id);
    assert.ok(groups.includes(HOUSEHOLD_GROUP));
    assert.ok(groups.includes('grp.practical.all'));
  });

  it('maps user-facing aliases without renaming practical.cleaning', () => {
    assert.equal(toCanonicalTaxonomyId('schoonmaak'), 'practical.cleaning');
    assert.equal(toCanonicalTaxonomyId('schoonmaker'), 'practical.cleaning');
    assert.equal(toCanonicalTaxonomyId('cleaning'), 'practical.cleaning');
    assert.equal(toCanonicalTaxonomyId('huishoudelijke hulp'), 'practical.household');
    assert.equal(toCanonicalTaxonomyId('opruimen'), 'practical.tidying');
    assert.equal(toCanonicalTaxonomyId('wassen'), 'practical.laundry');
    assert.equal(toCanonicalTaxonomyId('boodschappen'), 'practical.errands');
  });

  it('finds household cluster and cleaning synonyms without requiring title keywords', () => {
    const cleaningIds = getTaxonomyIdsMatchingSearchQuery('schoonmaker');
    assert.ok(cleaningIds.has('practical.cleaning'));
    assert.equal(cleaningIds.has('practical.laundry'), false);

    const householdIds = getTaxonomyIdsMatchingSearchQuery('huishoudelijke hulp');
    for (const id of HOUSEHOLD_IDS) {
      assert.ok(householdIds.has(id), `household query missed ${id}`);
    }

    assert.ok(
      listingMatchesTaxonomySearchQuery(['practical.cleaning'], 'huishoudelijke hulp gezocht'),
    );
    assert.ok(listingMatchesTaxonomySearchQuery(['practical.laundry'], 'strijken'));
    assert.ok(listingMatchesTaxonomySearchQuery(['practical.tidying'], 'opruimen'));
    assert.ok(listingMatchesTaxonomySearchQuery(['practical.household'], 'hulp in huis'));

    const cleaningListing = {
      title: 'Hulp in Vlaardingen',
      specializations: ['practical.cleaning'],
      subcategory: 'practical.cleaning',
      marketplaceCategory: 'PRACTICAL_SERVICE',
      listingIntent: 'OFFER',
    };
    assert.equal(matchesSearchTextQuery(cleaningListing, 'schoonmaak'), true);
    assert.equal(matchesSearchTextQuery(cleaningListing, 'schoonmaakhulp'), true);
    assert.equal(matchesSearchTextQuery(cleaningListing, 'huishoudelijke hulp'), true);
    assert.equal(matchesSearchTextQuery(cleaningListing, 'wassen'), false);
  });
});
