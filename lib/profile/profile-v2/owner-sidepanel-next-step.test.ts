import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeRecommendedNextStep,
  emptyWorkspaceCounts,
  noticeForProfileTab,
} from './owner-sidepanel-data';
import type { ProfileV2Stats, ProfileV2User } from './types';

const user = {
  sellerRoles: ['chef'],
  interests: [],
} as unknown as ProfileV2User;

const stats = (products: number, dishes: number): ProfileV2Stats => ({
  items: products + dishes,
  dishes,
  products,
  followers: 0,
  following: 0,
  favorites: 0,
  orders: 0,
});

describe('profile next step', () => {
  it('does not treat a missing stats payload as zero listings', () => {
    const step = computeRecommendedNextStep(user, null, emptyWorkspaceCounts());
    assert.equal(step.id, 'pending');
  });

  it('asks for a first listing only after the count is known to be zero', () => {
    const step = computeRecommendedNextStep(user, stats(0, 0), emptyWorkspaceCounts());
    assert.equal(step.id, 'firstAanbod');
  });

  it('moves past the first listing when products already exist', () => {
    const step = computeRecommendedNextStep(user, stats(1, 0), emptyWorkspaceCounts());
    assert.equal(step.id, 'firstInspiratie');
  });

  it('keeps a needed action on its own tab and leaves other tabs clear', () => {
    const aanbod = computeRecommendedNextStep(user, stats(0, 0), emptyWorkspaceCounts());
    assert.equal(noticeForProfileTab('overview', aanbod), null);
    assert.equal(noticeForProfileTab('aanbod', aanbod)?.id, 'firstAanbod');
    assert.equal(noticeForProfileTab('inspiratie', aanbod), null);
    const inspiratie = computeRecommendedNextStep(user, stats(1, 0), emptyWorkspaceCounts());
    assert.equal(noticeForProfileTab('inspiratie', inspiratie)?.id, 'firstInspiratie');
    assert.equal(noticeForProfileTab('community', inspiratie), null);
  });
});
