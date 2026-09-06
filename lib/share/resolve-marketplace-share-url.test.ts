import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendPersonalRef,
  resolveShareMode,
  shareUrlHasPersonalRef,
  shareUrlIsCompanyTracking,
} from './resolve-marketplace-share-url';

describe('resolveShareMode precedence', () => {
  const org = [
    {
      organizationId: 'org1',
      companyName: 'Rotterdam Growth',
      role: 'MARKETER',
      status: 'ACTIVE',
    },
  ];

  it('company preference wins over personal affiliate', () => {
    const mode = resolveShareMode({
      memberships: org,
      preferenceMode: 'company',
      preferenceOrganizationId: 'org1',
      hasPersonalAffiliate: true,
    });
    assert.deepEqual(mode, { kind: 'company', organizationId: 'org1' });
  });

  it('personal preference uses personal when available', () => {
    const mode = resolveShareMode({
      memberships: org,
      preferenceMode: 'personal',
      preferenceOrganizationId: null,
      hasPersonalAffiliate: true,
    });
    assert.deepEqual(mode, { kind: 'personal' });
  });

  it('dual-role without preference requires choose', () => {
    const mode = resolveShareMode({
      memberships: org,
      preferenceMode: null,
      preferenceOrganizationId: null,
      hasPersonalAffiliate: true,
    });
    assert.deepEqual(mode, { kind: 'choose' });
  });

  it('company-only without preference uses company', () => {
    const mode = resolveShareMode({
      memberships: org,
      preferenceMode: null,
      preferenceOrganizationId: null,
      hasPersonalAffiliate: false,
    });
    assert.deepEqual(mode, { kind: 'company', organizationId: 'org1' });
  });

  it('no affiliate context is plain', () => {
    const mode = resolveShareMode({
      memberships: [],
      preferenceMode: null,
      preferenceOrganizationId: null,
      hasPersonalAffiliate: false,
    });
    assert.deepEqual(mode, { kind: 'plain' });
  });
});

describe('share URL dual-attribution guards', () => {
  it('appendPersonalRef adds REF code once', () => {
    const url = appendPersonalRef(
      'https://homecheff.eu/product/cake-hcid-1',
      'REF7647BF21907E',
    );
    assert.match(url, /ref=REF7647BF21907E/);
    assert.equal(shareUrlHasPersonalRef(url), true);
  });

  it('detects company tracking path without personal REF', () => {
    const url = 'https://growth.homecheff.eu/a/rotterdam-abc123';
    assert.equal(shareUrlIsCompanyTracking(url), true);
    assert.equal(shareUrlHasPersonalRef(url), false);
  });
});
