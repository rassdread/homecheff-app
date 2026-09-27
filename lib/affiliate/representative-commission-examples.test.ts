import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAffiliateCommissionCatalog,
  selectRepresentativeCommissionExamples,
} from './commission-catalog';

describe('representative affiliate examples', () => {
  it('shows a mixed set from the catalog, not the four lowest and not sorted by size', () => {
    const catalog = buildAffiliateCommissionCatalog();
    const preview = selectRepresentativeCommissionExamples(catalog);
    const cents = (id: string) => catalog.find((row) => row.id === id)?.affiliateCents;
    assert.deepEqual(
      preview.map((row) => row.id),
      ['marketplace-plan-basic', 'growth-business', 'marketplace-buyer', 'studio-studio'],
    );
    assert.deepEqual(
      preview.map((row) => row.affiliateCents),
      [
        cents('marketplace-plan-basic'),
        cents('growth-business'),
        cents('marketplace-buyer'),
        cents('studio-studio'),
      ],
    );
    const amounts = preview.map((row) => row.affiliateCents);
    const sortedDesc = [...amounts].sort((a, b) => b - a);
    assert.notDeepEqual(amounts, sortedDesc);
    assert.ok(amounts[1] > amounts[0]);
    assert.ok(amounts[1] > amounts[3]);
    assert.notEqual(preview.some((row) => row.id === 'studio-creator'), true);
    assert.notEqual(preview.some((row) => row.id === 'delivery-fee'), true);
    assert.notEqual(preview.some((row) => row.id === 'growth-enterprise'), true);
    assert.equal(cents('studio-creator'), 170);
    assert.equal(cents('delivery-fee'), 60);
    assert.equal(cents('marketplace-buyer'), 600);
    assert.equal(preview.find((row) => row.id === 'marketplace-buyer')?.kind, 'transaction');
  });
});
