import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseProductDeliveryModes,
  resolveDynamicDeliveryVisibility,
} from './dynamic-delivery-options';

describe('parseProductDeliveryModes', () => {
  it('defaults to pickup', () => {
    assert.deepEqual([...parseProductDeliveryModes(null)], ['PICKUP']);
  });

  it('expands BOTH and comma lists', () => {
    assert.ok(parseProductDeliveryModes('BOTH').has('DELIVERY'));
    assert.ok(parseProductDeliveryModes('PICKUP,SHIPPING').has('SHIPPING'));
  });
});

describe('resolveDynamicDeliveryVisibility', () => {
  const base = {
    namedProviderSelectionEnabled: true,
    parcelCarrierConfigured: true,
    hasCoordinates: false,
    courierMatch: { kind: 'idle' as const },
    preserveLocalProviderSelection: false,
  };

  it('hides methods the product did not enable', () => {
    const v = resolveDynamicDeliveryVisibility({
      ...base,
      lines: [{ deliveryMode: 'PICKUP', sellerCanDeliver: false }],
    });
    assert.deepEqual(v.visibleOptionIds, ['pickup']);
    assert.equal(v.showNoCourierInfo, false);
  });

  it('requires sellerCanDeliver for seller delivery', () => {
    const without = resolveDynamicDeliveryVisibility({
      ...base,
      lines: [{ deliveryMode: 'DELIVERY', sellerCanDeliver: false }],
    });
    assert.ok(!without.visibleOptionIds.includes('local_delivery'));
    assert.ok(without.visibleOptionIds.includes('local_provider'));

    const withSeller = resolveDynamicDeliveryVisibility({
      ...base,
      lines: [{ deliveryMode: 'DELIVERY', sellerCanDeliver: true }],
    });
    assert.ok(withSeller.visibleOptionIds.includes('local_delivery'));
  });

  it('uses intersection across cart lines', () => {
    const v = resolveDynamicDeliveryVisibility({
      ...base,
      lines: [
        { deliveryMode: 'PICKUP,DELIVERY', sellerCanDeliver: true },
        { deliveryMode: 'SHIPPING', sellerCanDeliver: false },
      ],
    });
    assert.deepEqual(v.visibleOptionIds, []);
    assert.equal(v.mixedCapabilityNote, true);
  });

  it('keeps HomeCheff entry before address; info after empty match', () => {
    const before = resolveDynamicDeliveryVisibility({
      ...base,
      hasCoordinates: false,
      lines: [{ deliveryMode: 'DELIVERY', sellerCanDeliver: false }],
    });
    assert.ok(before.visibleOptionIds.includes('local_provider'));
    assert.equal(before.showNoCourierInfo, false);

    const afterEmpty = resolveDynamicDeliveryVisibility({
      ...base,
      hasCoordinates: true,
      courierMatch: { kind: 'list', count: 0 },
      lines: [{ deliveryMode: 'DELIVERY', sellerCanDeliver: false }],
    });
    assert.ok(!afterEmpty.visibleOptionIds.includes('local_provider'));
    assert.equal(afterEmpty.showNoCourierInfo, true);
  });

  it('preserves accepted booking selection without a match list', () => {
    const v = resolveDynamicDeliveryVisibility({
      ...base,
      hasCoordinates: true,
      courierMatch: { kind: 'list', count: 0 },
      preserveLocalProviderSelection: true,
      lines: [{ deliveryMode: 'DELIVERY', sellerCanDeliver: true }],
    });
    assert.ok(v.visibleOptionIds.includes('local_provider'));
    assert.equal(v.showNoCourierInfo, false);
  });

  it('shows shipping only when every line ships and carrier is configured', () => {
    const off = resolveDynamicDeliveryVisibility({
      ...base,
      parcelCarrierConfigured: false,
      lines: [{ deliveryMode: 'SHIPPING' }],
    });
    assert.ok(!off.visibleOptionIds.includes('shipping'));

    const on = resolveDynamicDeliveryVisibility({
      ...base,
      parcelCarrierConfigured: true,
      lines: [{ deliveryMode: 'SHIPPING' }],
    });
    assert.deepEqual(on.visibleOptionIds, ['shipping']);
  });

  it('blocks local provider when community delivery is active', () => {
    const v = resolveDynamicDeliveryVisibility({
      ...base,
      blockLocalProviderForCommunityDelivery: true,
      lines: [{ deliveryMode: 'DELIVERY', sellerCanDeliver: true }],
    });
    assert.ok(!v.visibleOptionIds.includes('local_provider'));
  });
});
