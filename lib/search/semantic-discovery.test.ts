import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listingSemanticFamily } from '@/lib/marketplace/commercial-capability';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { listingMatchesTaxonomySearchQuery } from '@/lib/marketplace/taxonomy-resolve';
import { itemMatchesDiscoveryCategorySlug } from '@/lib/marketplace/canonical-model';
import { getDiscoveryLegacyVerticalCategory } from '@/lib/discovery/consumer-accessors';
import { isMarketplaceServiceItem } from '@/lib/feed/marketplace-sale';
import { buildProductTextSearchWhere } from '@/lib/search/filters/build-product-search-where';
import {
  combineProductSearchFilters,
  semanticProductWhereForDiscoverySlug,
} from '@/lib/search/filters/semantic-category-where';
import {
  createFeedCompositionState,
  resetFeedCompositionState,
} from '@/lib/feed/feed-composition-state';
import { matchesSearchTextQuery } from '@/lib/search/filters/search-text';

type Row = {
  title?: string;
  description?: string;
  category?: string | null;
  marketplaceCategory?: string | null;
  subcategory?: string | null;
  specializations?: string[];
  listingIntent?: string | null;
  listingKind?: string | null;
  feedSource?: string;
  priceCents?: number;
  orderMethod?: string | null;
  priceModel?: string | null;
  fulfillmentOptions?: {
    digital?: boolean | null;
    pickup?: boolean | null;
    delivery?: boolean | null;
    shipping?: boolean | null;
  } | null;
};

function family(row: Row) {
  return listingSemanticFamily({
    marketplaceCategory: row.marketplaceCategory,
    productCategory: row.category,
    specializations: row.specializations,
    subcategory: row.subcategory,
    priceModel: row.priceModel,
    fulfillmentOptions: row.fulfillmentOptions,
  });
}

function matchesQuery(row: Row, q: string) {
  return matchesSearchTextQuery(
    {
      title: row.title ?? '',
      description: row.description ?? '',
      subcategory: row.subcategory,
      specializations: row.specializations,
      marketplaceCategory: row.marketplaceCategory,
      category: row.category,
      listingIntent: row.listingIntent,
    },
    q,
  );
}

function inCategory(row: Row, slug: string) {
  return itemMatchesDiscoveryCategorySlug(
    {
      ...row,
      priceCents: row.priceCents ?? 1000,
      feedSource: row.feedSource ?? 'PRODUCT',
      orderMethod: row.orderMethod ?? 'HOMECHEFF_PAYMENT',
    },
    slug,
    getDiscoveryLegacyVerticalCategory,
  );
}

const food: Row = {
  title: 'Appeltaart',
  description: 'service voor een feest',
  category: 'CHEFF',
  marketplaceCategory: 'CREATE',
  subcategory: 'create.cake',
};

const garden: Row = {
  title: 'Tomaten',
  category: 'GROWN',
  marketplaceCategory: 'GROW',
  subcategory: 'grow.plants',
};

const jewelry: Row = {
  title: 'design ketting',
  category: 'DESIGNER',
  marketplaceCategory: 'CREATE',
  subcategory: 'create.jewelry',
};

const website: Row = {
  title: 'Online aanwezigheid',
  description: 'geen taart',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.website',
};

const practical: Row = {
  title: 'Hulp in huis',
  category: 'CHEFF',
  marketplaceCategory: 'PRACTICAL_SERVICE',
  subcategory: 'practical.cleaning',
};

const knowledge: Row = {
  title: 'Loopbaan',
  category: 'CHEFF',
  marketplaceCategory: 'KNOWLEDGE',
  subcategory: 'knowledge.coaching',
};

const artistic: Row = {
  title: 'Nagels',
  category: 'DESIGNER',
  marketplaceCategory: 'ARTISTIC_SERVICE',
  subcategory: 'artistic.nails',
};

const photo: Row = {
  title: 'Portret',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.photo',
};

const video: Row = {
  title: 'Clip',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.video',
};

const logo: Row = {
  title: 'Merk',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.logo',
};

const app: Row = {
  title: 'Mobiel product',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.app',
};

const furniture: Row = {
  title: 'Eiken blad',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'meubels',
};

const artPrint: Row = {
  title: 'Afdruk',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'create.art',
};

const interior: Row = {
  title: 'Woonadvies',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.other',
};

const graphic: Row = {
  title: 'Huisstijl',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  specializations: ['design.illustration'],
};

const legacyPhoto: Row = {
  title: 'Op locatie',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'fotografie',
};

const bareDesign: Row = {
  title: 'Tafel',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
};

const beadTree: Row = {
  title: 'Turquoise boompje van kralen',
  description: 'Handgemaakt boompje van kralen in een schaaltje',
  category: 'DESIGNER',
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

const photoShoot: Row = {
  title: 'Portret op locatie',
  category: 'DESIGNER',
  marketplaceCategory: 'DESIGN',
  subcategory: 'design.photo',
  specializations: ['design.photo'],
  priceModel: 'ON_REQUEST',
  fulfillmentOptions: {
    digital: false,
    pickup: false,
    delivery: false,
    shipping: false,
  },
};

describe('listing semantic family', () => {
  it('classifies structured listings, not the storage bucket', () => {
    assert.equal(family(food), 'food');
    assert.equal(family(garden), 'garden');
    assert.equal(family(jewelry), 'creation');
    assert.equal(family(website), 'service');
    assert.equal(family(practical), 'service');
    assert.equal(family(knowledge), 'service');
    assert.equal(family(artistic), 'service');
    assert.equal(family(photo), 'service');
    assert.equal(family(video), 'service');
    assert.equal(family(logo), 'service');
    assert.equal(family(app), 'service');
    assert.equal(family(furniture), 'creation');
    assert.equal(family(artPrint), 'creation');
    assert.equal(family(interior), 'service');
    assert.equal(family(graphic), 'service');
    assert.equal(family(legacyPhoto), 'service');
    assert.equal(family(bareDesign), 'creation');
    assert.equal(family(beadTree), 'creation');
    assert.equal(family(photoShoot), 'service');
    assert.equal(inCategory(beadTree, 'designer'), true);
    assert.equal(inCategory(beadTree, 'services'), false);
    assert.equal(inCategory(photoShoot, 'services'), true);
    assert.equal(inCategory(photoShoot, 'designer'), false);
  });

  it('lets a design service taxonomy beat legacy DESIGNER storage', () => {
    const storedAsDesigner: Row = {
      title: 'Online aanwezigheid',
      category: 'DESIGNER',
      marketplaceCategory: null,
      specializations: ['design.website'],
    };
    assert.equal(family(storedAsDesigner), 'service');
    assert.equal(inCategory(storedAsDesigner, 'services'), true);
    assert.equal(inCategory(storedAsDesigner, 'designer'), false);
    assert.equal(
      deriveListingKind({
        marketplaceCategory: 'DESIGN',
        category: 'DESIGNER',
        specializations: ['design.website'],
        listingIntent: 'OFFER',
      }).listingKind,
      'SERVICE',
    );
    assert.equal(
      deriveListingKind({
        marketplaceCategory: 'DESIGN',
        category: 'DESIGNER',
        listingIntent: 'OFFER',
      }).listingKind,
      'PRODUCT',
    );
  });

  it('does not read seller roles or accepted values', () => {
    assert.equal(
      listingSemanticFamily({
        marketplaceCategory: 'DESIGN',
        productCategory: 'DESIGNER',
        specializations: ['design.website'],
        subcategory: 'design.website',
      }),
      'service',
    );
  });

  it('keeps a service request as a request for the sale filter', () => {
    const request: Row = {
      ...website,
      listingIntent: 'REQUEST',
      priceCents: 0,
    };
    assert.equal(family(request), 'service');
    assert.equal(inCategory(request, 'services'), false);
  });

  it('does not treat an inspiration dish as a commercial service', () => {
    const guide = {
      title: 'website maken',
      description: 'service',
      category: 'CHEFF',
      feedSource: 'DISH',
      priceCents: 0,
    };
    assert.equal(isMarketplaceServiceItem(guide), false);
  });
});

describe('search terms', () => {
  it('matches taxonomy labels without using the legacy category', () => {
    assert.equal(matchesQuery({ ...food, title: 'Zondag' }, 'taart'), true);
    assert.equal(matchesQuery({ ...garden, title: 'Groen' }, 'plant'), true);
    assert.equal(matchesQuery({ ...jewelry, title: 'Ketting' }, 'sieraad'), true);
    assert.equal(matchesQuery({ ...jewelry, title: 'Ketting' }, 'sieraden'), true);
    assert.equal(matchesQuery({ ...website, title: 'Online aanwezigheid' }, 'website'), true);
    assert.equal(matchesQuery({ ...website, title: 'Online aanwezigheid' }, 'website maken'), true);
    assert.equal(matchesQuery({ ...app, title: 'Mobiel product' }, 'app'), true);
    assert.equal(matchesQuery({ ...logo, title: 'Merk' }, 'logo'), true);
    assert.equal(matchesQuery({ ...photo, title: 'Portret' }, 'fotografie'), true);
    assert.equal(matchesQuery({ ...photo, title: 'Portret' }, 'fotograaf'), true);
    assert.equal(matchesQuery({ ...video, title: 'Clip' }, 'video'), true);
    assert.equal(matchesQuery({ ...knowledge, title: 'Loopbaan' }, 'advies'), true);
    assert.equal(matchesQuery(furniture, 'meubel'), true);
    assert.equal(matchesQuery(artPrint, 'kunstwerk'), true);
    assert.equal(matchesQuery(interior, 'interieurontwerp'), true);
    assert.equal(matchesQuery(graphic, 'grafisch'), true);
    assert.equal(matchesQuery(legacyPhoto, 'fotografie'), true);
  });

  it('treats Website and surrounding spaces the same', () => {
    const where = buildProductTextSearchWhere(' Website ');
    const title = (where.OR ?? []).find((part) => 'title' in part) as {
      title?: { contains?: string };
    };
    assert.equal(title.title?.contains, 'Website');
    assert.equal(matchesQuery(website, ' Website '), true);
    assert.equal(matchesQuery(website, 'website'), true);
  });

  it('does not turn the word app into an apple listing', () => {
    assert.equal(
      listingMatchesTaxonomySearchQuery(['grow.apple'], 'app'),
      false,
    );
    assert.equal(listingMatchesTaxonomySearchQuery(['design.app'], 'app'), true);
  });
});

describe('category and query composition', () => {
  it('keeps an explicit category authoritative', () => {
    assert.equal(inCategory(website, 'services'), true);
    assert.equal(inCategory(app, 'services'), true);
    assert.equal(inCategory(logo, 'services'), true);
    assert.equal(inCategory(photo, 'services'), true);
    assert.equal(inCategory(knowledge, 'services'), true);
    assert.equal(inCategory(food, 'cheff'), true);
    assert.equal(inCategory(garden, 'garden'), true);
    assert.equal(inCategory(jewelry, 'designer'), true);
    assert.equal(inCategory(furniture, 'designer'), true);
    assert.equal(inCategory(furniture, 'services'), false);
    assert.equal(inCategory(artPrint, 'designer'), true);
    assert.equal(inCategory(artPrint, 'services'), false);
    assert.equal(inCategory(bareDesign, 'designer'), true);
    assert.equal(inCategory(bareDesign, 'services'), false);
    assert.equal(inCategory(interior, 'services'), true);
    assert.equal(inCategory(interior, 'designer'), false);
    assert.equal(inCategory(graphic, 'services'), true);
    assert.equal(inCategory(graphic, 'designer'), false);
    assert.equal(inCategory(legacyPhoto, 'services'), true);
    assert.equal(inCategory(legacyPhoto, 'designer'), false);
    assert.equal(inCategory(website, 'services') && matchesQuery(website, 'website'), true);
    assert.equal(inCategory(logo, 'services') && matchesQuery(logo, 'logo'), true);
    assert.equal(inCategory(video, 'services') && matchesQuery(video, 'video'), true);
    assert.equal(inCategory(website, 'cheff'), false);
    assert.equal(inCategory(website, 'designer'), false);
    assert.equal(inCategory(practical, 'cheff'), false);
    assert.equal(inCategory(artistic, 'designer'), false);
    assert.equal(inCategory(food, 'services'), false);
    assert.equal(inCategory(jewelry, 'services'), false);
  });

  it('does not let a text hit bypass the category', () => {
    assert.equal(matchesQuery(website, 'website'), true);
    assert.equal(inCategory(website, 'cheff') && matchesQuery(website, 'website'), false);
    assert.equal(inCategory(website, 'designer') && matchesQuery(website, 'website'), false);
    assert.equal(inCategory(food, 'cheff') && matchesQuery(food, 'taart'), true);
  });
});

describe('server category filter', () => {
  it('does not select services by Product.category CHEFF or DESIGNER', () => {
    const services = semanticProductWhereForDiscoverySlug('services');
    const encoded = JSON.stringify(services);
    assert.equal(encoded.includes('"category":"CHEFF"'), false);
    assert.equal(encoded.includes('"category":"DESIGNER"'), false);
    assert.equal(encoded.includes('"marketplaceCategory":"DESIGN"'), false);
    assert.equal(encoded.includes('PRACTICAL_SERVICE'), true);
    assert.equal(encoded.includes('design.'), true);
    assert.equal(encoded.includes('fotografie'), true);
    const creations = JSON.stringify(semanticProductWhereForDiscoverySlug('designer'));
    assert.equal(creations.includes('"marketplaceCategory":"DESIGN"'), true);
    assert.equal(creations.includes('meubels'), true);
    assert.equal(encoded.includes('design.website'), true);
    assert.equal(encoded.includes('"path":["digital"]'), true);
  });

  it('keeps text search and category as separate AND clauses', () => {
    const combined = combineProductSearchFilters([
      buildProductTextSearchWhere('website'),
      semanticProductWhereForDiscoverySlug('diensten'),
    ]);
    assert.ok(Array.isArray(combined.AND));
    assert.equal(combined.AND?.length, 2);
  });

  it('food filter excludes the service marketplace categories', () => {
    const foodWhere = JSON.stringify(semanticProductWhereForDiscoverySlug('cheff'));
    assert.equal(foodWhere.includes('PRACTICAL_SERVICE'), true);
    assert.equal(foodWhere.includes('CREATE'), true);
  });
});

describe('pagination cursor reset', () => {
  it('drops the previous skip when the query or category key changes', () => {
    const started = createFeedCompositionState('q=website&vertical=services&skip=0');
    const advanced = { ...started, marketplaceSkip: 40, broadenedSkip: 20 };
    const next = resetFeedCompositionState(advanced, 'q=taart&vertical=cheff&skip=0');
    assert.equal(next.marketplaceSkip, 0);
    assert.equal(next.broadenedSkip, 0);
    assert.notEqual(next.requestKey, advanced.requestKey);
    const geo = resetFeedCompositionState(advanced, 'scope=national&radius=0');
    assert.equal(geo.marketplaceSkip, 0);
  });
});
