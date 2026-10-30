import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getVisibleSettingsTabs } from './settings-hub';

describe('settings hub tabs', () => {
  it('shows payments to a buyer who is not a seller yet', () => {
    const tabs = getVisibleSettingsTabs({ role: 'USER', sellerRoles: [] });
    assert.equal(tabs.includes('payments'), true);
    assert.equal(tabs.includes('locations'), false);
    assert.ok(tabs.indexOf('payments') < tabs.indexOf('privacy'));
  });

  it('shows sales locations for a seller profile without a seller role', () => {
    const tabs = getVisibleSettingsTabs({
      role: 'USER',
      sellerRoles: [],
      hasSellerProfile: true,
    });
    assert.equal(tabs.includes('locations'), true);
    assert.ok(tabs.indexOf('locations') < tabs.indexOf('payments'));
  });
});
