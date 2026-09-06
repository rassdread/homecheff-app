import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OPPORTUNITY_DESTINATIONS,
  absoluteOpportunityUrl,
} from './ecosystem-opportunities';
import { listingPathFromAbsolute } from './resolve-marketplace-share-url';

describe('ecosystem opportunity destinations', () => {
  it('deep-links Delivery individual and company separately', () => {
    assert.equal(
      OPPORTUNITY_DESTINATIONS.delivery_individual.href,
      '/delivery/signup',
    );
    assert.equal(
      OPPORTUNITY_DESTINATIONS.delivery_company.href,
      '/delivery/company/signup',
    );
  });

  it('hub canonical route is werken-bij', () => {
    assert.equal(OPPORTUNITY_DESTINATIONS.hub.href, '/werken-bij');
  });

  it('normalizes absolute opportunity URLs for share ensure', () => {
    assert.equal(
      listingPathFromAbsolute('https://homecheff.eu/delivery/signup?x=1'),
      '/delivery/signup',
    );
    assert.equal(
      listingPathFromAbsolute('https://studio.homecheff.eu/signup'),
      'https://studio.homecheff.eu/signup',
    );
    assert.equal(
      absoluteOpportunityUrl('/werken-bij'),
      'https://homecheff.eu/werken-bij',
    );
  });
});
