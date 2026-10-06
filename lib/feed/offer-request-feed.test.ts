import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDiscoveryLegacyVerticalCategory } from '@/lib/discovery/consumer-accessors';
import {
  isMarketplaceRequestItem,
  isMarketplaceSaleItem,
  type MarketplaceSaleInput,
} from '@/lib/feed/marketplace-sale';
import { itemMatchesAcceptedValuesDiscoveryFilter } from '@/lib/marketplace/discovery/accepted-values-discovery';
import { itemMatchesDiscoveryCategorySlug } from '@/lib/marketplace/canonical-model';
import { sellerRoleForCommercialOffer } from '@/lib/seller/seller-role-consistency';

type FeedRow = MarketplaceSaleInput & {
  category?: string | null;
  acceptedSpecializations?: string[] | null;
};

type View = 'sale' | 'gezocht' | 'inspiration';

function shows(item: FeedRow, view: View, category: string): boolean {
  const categoryMatch = itemMatchesDiscoveryCategorySlug(
    item,
    category,
    getDiscoveryLegacyVerticalCategory,
  );
  const sale = isMarketplaceSaleItem(item);
  const request = isMarketplaceRequestItem(item);
  if (view === 'sale') return sale && !request && categoryMatch;
  if (view === 'gezocht') return request && !sale && categoryMatch;
  return !sale && !request && categoryMatch;
}

const foodOffer: FeedRow = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  priceCents: 1200,
  marketplaceCategory: 'CREATE',
  subcategory: 'create.meal',
  specializations: ['create.meal'],
  priceModel: 'FIXED',
};

const foodRequest: FeedRow = {
  ...foodOffer,
  listingIntent: 'REQUEST',
};

const creationOffer: FeedRow = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  priceCents: 2000,
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.video',
  specializations: ['design.video', 'design.photo'],
  priceModel: 'FIXED',
  fulfillmentOptions: {
    digital: false,
    pickup: true,
    delivery: true,
    shipping: true,
  },
};

const creationRequest: FeedRow = {
  feedSource: 'PRODUCT',
  listingIntent: 'REQUEST',
  marketplaceCategory: 'DESIGN',
  subcategory: 'create.art',
  specializations: ['create.art'],
  priceModel: 'ON_REQUEST',
};

const serviceOffer: FeedRow = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  marketplaceCategory: 'ARTISTIC_SERVICE',
  subcategory: 'artistic.nails',
  specializations: ['artistic.nails'],
  priceModel: 'ON_REQUEST',
  priceCents: 0,
};

const serviceRequest: FeedRow = {
  feedSource: 'PRODUCT',
  listingIntent: 'REQUEST',
  marketplaceCategory: 'PRACTICAL_SERVICE',
  subcategory: 'practical.household',
  specializations: ['practical.household', 'practical.laundry'],
  priceModel: 'FIXED',
  fulfillmentOptions: {
    digital: false,
    pickup: false,
    delivery: true,
    shipping: false,
  },
};

const inspiration: FeedRow = {
  feedSource: 'DISH',
  listingIntent: 'OFFER',
  priceCents: 0,
  category: 'DESIGNER',
};

const moneyOffer: FeedRow = {
  ...foodOffer,
  acceptedSpecializations: [],
};

const swapOffer: FeedRow = {
  ...foodOffer,
  acceptedSpecializations: ['create.meal'],
};

describe('offer and request feed composition', () => {
  it('keeps food intent and food category independent', () => {
    assert.equal(shows(foodOffer, 'sale', 'cheff'), true);
    assert.equal(shows(foodOffer, 'gezocht', 'cheff'), false);
    assert.equal(shows(foodOffer, 'sale', 'services'), false);
    assert.equal(shows(foodRequest, 'gezocht', 'cheff'), true);
    assert.equal(shows(foodRequest, 'gezocht', 'all'), true);
    assert.equal(shows(foodRequest, 'sale', 'cheff'), false);
    assert.equal(shows(foodRequest, 'gezocht', 'services'), false);
    assert.equal(shows(foodRequest, 'gezocht', 'designer'), false);
    assert.equal(shows(foodRequest, 'gezocht', 'garden'), false);
  });

  it('keeps a shipped physical creation out of the request view', () => {
    assert.equal(shows(creationOffer, 'sale', 'designer'), true);
    assert.equal(shows(creationOffer, 'sale', 'all'), true);
    assert.equal(shows(creationOffer, 'gezocht', 'designer'), false);
    assert.equal(shows(creationOffer, 'gezocht', 'all'), false);
    assert.equal(shows(creationOffer, 'sale', 'services'), false);
    assert.equal(shows(creationRequest, 'gezocht', 'designer'), true);
    assert.equal(shows(creationRequest, 'sale', 'designer'), false);
    assert.equal(shows(creationRequest, 'gezocht', 'services'), false);
  });

  it('keeps a service offer and a service request on opposite views', () => {
    assert.equal(shows(serviceOffer, 'sale', 'services'), true);
    assert.equal(shows(serviceOffer, 'gezocht', 'services'), false);
    assert.equal(shows(serviceOffer, 'sale', 'designer'), false);
    assert.equal(shows(serviceRequest, 'gezocht', 'services'), true);
    assert.equal(shows(serviceRequest, 'gezocht', 'all'), true);
    assert.equal(shows(serviceRequest, 'sale', 'services'), false);
    assert.equal(shows(serviceRequest, 'gezocht', 'cheff'), false);
    assert.equal(shows(serviceRequest, 'gezocht', 'garden'), false);
    assert.equal(shows(serviceRequest, 'gezocht', 'designer'), false);
    assert.equal(
      sellerRoleForCommercialOffer(
        'REQUEST',
        'CHEFF',
        'PRACTICAL_SERVICE',
        ['practical.household', 'practical.laundry'],
      ),
      null,
    );
  });

  it('keeps inspiration out of offered and wanted views', () => {
    assert.equal(isMarketplaceSaleItem(inspiration), false);
    assert.equal(isMarketplaceRequestItem(inspiration), false);
    assert.equal(shows(inspiration, 'sale', 'designer'), false);
    assert.equal(shows(inspiration, 'gezocht', 'designer'), false);
    assert.equal(shows(inspiration, 'inspiration', 'designer'), true);
  });

  it('does not treat every offer as a swap', () => {
    assert.equal(isMarketplaceSaleItem(moneyOffer), true);
    assert.equal(isMarketplaceSaleItem(swapOffer), true);
    assert.equal(isMarketplaceRequestItem(swapOffer), false);
    assert.equal(
      itemMatchesAcceptedValuesDiscoveryFilter(
        { acceptedSpecializations: moneyOffer.acceptedSpecializations },
        ['create.meal'],
      ),
      false,
    );
    assert.equal(
      itemMatchesAcceptedValuesDiscoveryFilter(
        { acceptedSpecializations: swapOffer.acceptedSpecializations },
        ['create.meal'],
      ),
      true,
    );
    assert.equal(
      itemMatchesAcceptedValuesDiscoveryFilter(
        { acceptedSpecializations: swapOffer.acceptedSpecializations },
        [],
      ),
      true,
    );
  });
});
