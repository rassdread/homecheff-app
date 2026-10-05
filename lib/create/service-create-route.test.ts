import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CANONICAL_SERVICE_CREATE_ROUTE } from './marketplace-entry-nav';
import { parseMarketplaceEntryFromSearchParams } from '@/lib/marketplace/entry-prefill';
import { getOfferAccordionGroups } from '@/lib/marketplace/taxonomy-accordion';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { sellerRoleForCommercialOffer } from '@/lib/seller/seller-role-consistency';

describe('canonical service creation route', () => {
  it('opens the existing offer form on the service type step', () => {
    const url = new URL(CANONICAL_SERVICE_CREATE_ROUTE, 'https://homecheff.eu');
    assert.equal(url.pathname, '/sell/new');
    assert.notEqual(url.pathname, '/sell');
    const prefill = parseMarketplaceEntryFromSearchParams(url.searchParams);
    assert.equal(prefill.listingIntent, 'OFFER');
    assert.equal(prefill.marketplaceCategory, 'PRACTICAL_SERVICE');
    assert.equal(prefill.specializations, undefined);
    const groups = getOfferAccordionGroups('PRACTICAL_SERVICE').map((group) => group.id);
    assert.ok(groups.includes('grp.practical.household'));
    assert.ok(groups.includes('grp.knowledge.all'));
    assert.ok(groups.includes('grp.artistic.music'));
    assert.equal(getMarketplaceTaxonomyItem('design.website')?.parentId, 'grp.design.web');
    assert.ok(groups.includes('grp.design.web'));
    assert.ok(groups.includes('grp.design.media'));
    assert.ok(groups.includes('grp.design.brand'));
    assert.equal(groups.includes('grp.create.craft'), false);
  });

  it('keeps published service, request, design-service, and physical-creation capabilities', () => {
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'PRACTICAL_SERVICE'),
      'service',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'KNOWLEDGE'),
      'service',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'ARTISTIC_SERVICE'),
      'service',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'DESIGN', ['design.website']),
      'service',
    );
    assert.equal(
      sellerRoleForCommercialOffer('REQUEST', 'CHEFF', 'PRACTICAL_SERVICE'),
      null,
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'DESIGNER', 'CREATE', ['create.art']),
      'designer',
    );
    assert.equal(
      sellerRoleForCommercialOffer('OFFER', 'CHEFF', 'CREATE', ['create.jewelry']),
      'designer',
    );
  });
});
