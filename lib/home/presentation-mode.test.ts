import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveFeedWorkspaceVisibleLayout } from '@/lib/adaptive-workspace-react/resolve-feed-workspace-visible-layout';
import { MY_HOMECHEFF_HUB_PATH } from '@/lib/navigation/my-homecheff-hub';
import {
  applyPresentationToLayoutPlan,
  dashboardTargetForPresentation,
  defaultPresentationMode,
  resolvePresentationMode,
  userCanAccessWorkspace,
  userCanUseWorkspace,
  userHasActiveWorkspaceRoles,
  type HomePresentationMode,
} from '@/lib/home/presentation-mode';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import {
  buildWorkspaceQuickActions,
  buildWorkspaceStartChoices,
  workspaceLeftLinkIds,
} from '@/lib/home/workspace-rail-model';

type StateId =
  | 'ANONYMOUS'
  | 'BUYER_ONLY'
  | 'NEW_ACCOUNT'
  | 'NEW_SELLER_ZERO_LISTINGS'
  | 'ACTIVE_PRODUCT_SELLER'
  | 'ACTIVE_FOOD_SELLER'
  | 'ACTIVE_SERVICE_PROVIDER'
  | 'AFFILIATE_ONLY'
  | 'DELIVERY_ONLY'
  | 'SELLER_PLUS_AFFILIATE'
  | 'SELLER_PLUS_DELIVERY'
  | 'MULTI_ROLE'
  | 'INCOMPLETE_PROFILE';

type Fixture = {
  id: StateId;
  ctx: SettingsHubContext | null;
  user: Record<string, unknown> | null;
  incompleteProfile?: boolean;
  defaultMode: HomePresentationMode;
  workspaceAvailable: boolean;
  manualSwitch: boolean;
  dashboard: string;
  left: string[];
  right: 'none' | 'attention';
};

const buyer: SettingsHubContext = { role: 'USER', sellerRoles: [] };
const seller: SettingsHubContext = {
  role: 'SELLER',
  sellerRoles: ['chef'],
};

const fixtures: Fixture[] = [
  {
    id: 'ANONYMOUS',
    ctx: null,
    user: null,
    defaultMode: 'marketplace',
    workspaceAvailable: false,
    manualSwitch: false,
    dashboard: MY_HOMECHEFF_HUB_PATH,
    left: [],
    right: 'none',
  },
  {
    id: 'BUYER_ONLY',
    ctx: buyer,
    user: { role: 'USER', sellerRoles: [] },
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: MY_HOMECHEFF_HUB_PATH,
    left: [],
    right: 'none',
  },
  {
    id: 'NEW_ACCOUNT',
    ctx: { role: 'USER', sellerRoles: [] },
    user: { role: 'USER', sellerRoles: [] },
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: MY_HOMECHEFF_HUB_PATH,
    left: [],
    right: 'none',
  },
  {
    id: 'NEW_SELLER_ZERO_LISTINGS',
    ctx: seller,
    user: { role: 'SELLER', sellerRoles: ['chef'] },
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'ACTIVE_PRODUCT_SELLER',
    ctx: { role: 'SELLER', sellerRoles: ['designer'] },
    user: { role: 'SELLER', sellerRoles: ['designer'] },
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'ACTIVE_FOOD_SELLER',
    ctx: { role: 'SELLER', sellerRoles: ['chef'] },
    user: { role: 'SELLER', sellerRoles: ['chef'] },
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'ACTIVE_SERVICE_PROVIDER',
    ctx: { role: 'SELLER', sellerRoles: ['designer'] },
    user: { role: 'SELLER', sellerRoles: ['designer'] },
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'AFFILIATE_ONLY',
    ctx: { role: 'USER', sellerRoles: [], hasAffiliate: true },
    user: { role: 'USER', sellerRoles: [], hasAffiliate: true },
    defaultMode: 'workspace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'affiliate-qr',
      'affiliate-signups',
      'affiliate-promo',
      'affiliate-partners',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'DELIVERY_ONLY',
    ctx: { role: 'DELIVERY', sellerRoles: [], hasDeliveryProfile: true },
    user: { role: 'DELIVERY', sellerRoles: [], hasDeliveryProfile: true },
    defaultMode: 'workspace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'deliveries',
      'availability',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'SELLER_PLUS_AFFILIATE',
    ctx: { role: 'SELLER', sellerRoles: ['chef'], hasAffiliate: true },
    user: { role: 'SELLER', sellerRoles: ['chef'], hasAffiliate: true },
    defaultMode: 'workspace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'affiliate-qr',
      'affiliate-signups',
      'affiliate-promo',
      'affiliate-partners',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'SELLER_PLUS_DELIVERY',
    ctx: {
      role: 'SELLER',
      sellerRoles: ['garden'],
      hasDeliveryProfile: true,
    },
    user: {
      role: 'SELLER',
      sellerRoles: ['garden'],
      hasDeliveryProfile: true,
    },
    defaultMode: 'workspace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'deliveries',
      'availability',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'MULTI_ROLE',
    ctx: {
      role: 'SELLER',
      sellerRoles: ['chef'],
      hasAffiliate: true,
      hasDeliveryProfile: true,
    },
    user: {
      role: 'SELLER',
      sellerRoles: ['chef'],
      hasAffiliate: true,
      hasDeliveryProfile: true,
    },
    defaultMode: 'workspace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/operations/vandaag',
    left: [
      'today',
      'messages',
      'my-offer',
      'new-offer',
      'orders',
      'appointments',
      'affiliate-qr',
      'affiliate-signups',
      'affiliate-promo',
      'affiliate-partners',
      'deliveries',
      'availability',
      'performance',
      'earnings',
    ],
    right: 'attention',
  },
  {
    id: 'INCOMPLETE_PROFILE',
    ctx: { role: 'USER', sellerRoles: [] },
    user: { role: 'USER', sellerRoles: [] },
    incompleteProfile: true,
    defaultMode: 'marketplace',
    workspaceAvailable: true,
    manualSwitch: true,
    dashboard: '/onboarding/complete-profile',
    left: [],
    right: 'none',
  },
];

describe('home presentation mode', () => {
  for (const fixture of fixtures) {
    it(`${fixture.id} default, switch, and rails`, () => {
      assert.equal(userCanAccessWorkspace(fixture.ctx), fixture.workspaceAvailable);
      assert.equal(userCanUseWorkspace(fixture.ctx), fixture.workspaceAvailable);
      assert.equal(
        userHasActiveWorkspaceRoles(fixture.ctx),
        fixture.left.length > 0,
      );
      assert.equal(defaultPresentationMode(fixture.ctx), fixture.defaultMode);
      assert.equal(
        resolvePresentationMode(fixture.ctx, null),
        fixture.defaultMode,
      );
      assert.equal(fixture.manualSwitch, fixture.workspaceAvailable);
      assert.deepEqual(workspaceLeftLinkIds(fixture.ctx), fixture.left);
      assert.equal(
        fixture.right,
        userHasActiveWorkspaceRoles(fixture.ctx) ? 'attention' : 'none',
      );
      assert.equal(
        dashboardTargetForPresentation({
          user: fixture.user,
          incompleteProfile: fixture.incompleteProfile,
        }),
        fixture.dashboard,
      );
    });
  }

  it('seller-only stays in Marketplace until the user chooses Workspace', () => {
    assert.equal(defaultPresentationMode(seller), 'marketplace');
    assert.equal(resolvePresentationMode(seller, 'workspace'), 'workspace');
    assert.equal(resolvePresentationMode(seller, 'marketplace'), 'marketplace');
  });

  it('a saved Workspace choice wins for an authenticated user and is ignored when anonymous', () => {
    assert.equal(resolvePresentationMode(buyer, 'workspace'), 'workspace');
    assert.equal(resolvePresentationMode(buyer, 'marketplace'), 'marketplace');
    assert.equal(resolvePresentationMode(null, 'workspace'), 'marketplace');
  });

  it('a buyer can open Workspace without receiving role tools', () => {
    assert.equal(userCanAccessWorkspace(buyer), true);
    assert.equal(userHasActiveWorkspaceRoles(buyer), false);
    assert.deepEqual(workspaceLeftLinkIds(buyer), []);
    assert.deepEqual(buildWorkspaceQuickActions(buyer), []);
    assert.deepEqual(
      buildWorkspaceStartChoices().map((choice) => choice.id),
      ['sell', 'service', 'affiliate', 'delivery'],
    );
    assert.deepEqual(
      buildWorkspaceStartChoices().map((choice) => choice.href),
      ['/onboarding/seller', '/sell', '/affiliate', '/delivery/start'],
    );
  });

  it('quick actions stay role-specific and do not duplicate', () => {
    const service = buildWorkspaceQuickActions({
      role: 'SELLER',
      sellerRoles: ['designer'],
    }).map((item) => item.id);
    assert.deepEqual(service, ['offer-service']);
    const multi = buildWorkspaceQuickActions(
      fixtures.find((f) => f.id === 'MULTI_ROLE')!.ctx,
    ).map((item) => item.id);
    assert.deepEqual(multi, ['new-offer', 'promote', 'delivery-now']);
    assert.equal(new Set(multi).size, multi.length);
  });

  it('marketplace hides both rails and widens the feed at 1440', () => {
    const widthPlan = resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: 1440,
      usableHeightPx: 900,
    });
    assert.equal(widthPlan.showStartPanel, true);
    assert.equal(widthPlan.showEndPanel, true);
    const marketplace = applyPresentationToLayoutPlan(widthPlan, 'marketplace');
    assert.equal(marketplace.showStartPanel, false);
    assert.equal(marketplace.showEndPanel, false);
    assert.equal(marketplace.supportingPanelCount, 0);
    assert.ok(marketplace.feedColumnMaxWidthPx >= 1100);
    const workspace = applyPresentationToLayoutPlan(widthPlan, 'workspace');
    assert.equal(workspace.showStartPanel, true);
    assert.equal(workspace.showEndPanel, true);
  });

  it('phones never get workspace rails, including landscape', () => {
    const phone = resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: 700,
      usableHeightPx: 400,
    });
    assert.equal(phone.showStartPanel, true);
    const workspace = applyPresentationToLayoutPlan(phone, 'workspace');
    assert.equal(workspace.showStartPanel, false);
    assert.equal(workspace.showEndPanel, false);
    const portrait = applyPresentationToLayoutPlan(
      resolveFeedWorkspaceVisibleLayout({
        usableWidthPx: 375,
        usableHeightPx: 812,
      }),
      'marketplace',
    );
    assert.equal(portrait.showStartPanel, false);
    assert.ok(portrait.feedColumnMaxWidthPx <= 375);
  });

  it('tablet workspace keeps one rail and does not open the attention rail yet', () => {
    const tablet = applyPresentationToLayoutPlan(
      resolveFeedWorkspaceVisibleLayout({
        usableWidthPx: 768,
        usableHeightPx: 1024,
      }),
      'workspace',
    );
    assert.equal(tablet.showStartPanel, true);
    assert.equal(tablet.showEndPanel, false);
    const desktop = applyPresentationToLayoutPlan(
      resolveFeedWorkspaceVisibleLayout({
        usableWidthPx: 1024,
        usableHeightPx: 768,
      }),
      'workspace',
    );
    assert.equal(desktop.showStartPanel, true);
    assert.equal(desktop.showEndPanel, true);
  });

  it('multi-role links are unique', () => {
    const ids = workspaceLeftLinkIds(fixtures.find((f) => f.id === 'MULTI_ROLE')!.ctx);
    assert.equal(new Set(ids).size, ids.length);
  });
});
