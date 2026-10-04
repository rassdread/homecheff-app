import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { needsProfileOnboardingFromFlags } from '@/lib/auth/post-auth-redirect';
import {
  isPrimaryDashboardPath,
  resolvePrimaryDashboardHrefFromUser,
} from './primary-dashboard';
import { MY_HOMECHEFF_HUB_PATH } from './my-homecheff-hub';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('bottom nav five-item contract', () => {
  it('authenticated bar has Home, Berichten, Toevoegen, Dashboard, Profiel', () => {
    const src = readFileSync(join(root, 'components/navigation/BottomNavigation.tsx'), 'utf8');
    assert.match(src, /data-hc-bottom-nav-item="home"/);
    assert.match(src, /data-hc-bottom-nav-item="messages"/);
    assert.match(src, /data-hc-bottom-nav-item="create"/);
    assert.match(src, /data-hc-bottom-nav-item="dashboard"/);
    assert.match(src, /data-hc-bottom-nav-item="profile"/);
    assert.match(src, /href="\/profile"/);
    assert.doesNotMatch(src, /bottomNav\.reputationTab/);
    assert.equal((src.match(/data-hc-bottom-nav-item="dashboard"/g) || []).length, 2);
    assert.equal((src.match(/data-hc-bottom-nav-item="home"/g) || []).length, 1);
  });

  it('marks specialist dashboards as the Dashboard tab', () => {
    assert.equal(isPrimaryDashboardPath('/mijn-homecheff', MY_HOMECHEFF_HUB_PATH), true);
    assert.equal(isPrimaryDashboardPath('/delivery/dashboard', MY_HOMECHEFF_HUB_PATH), true);
    assert.equal(isPrimaryDashboardPath('/affiliate/dashboard', MY_HOMECHEFF_HUB_PATH), true);
    assert.equal(isPrimaryDashboardPath('/verkoper/dashboard', MY_HOMECHEFF_HUB_PATH), true);
    assert.equal(isPrimaryDashboardPath('/profile', MY_HOMECHEFF_HUB_PATH), false);
    assert.equal(isPrimaryDashboardPath('/', MY_HOMECHEFF_HUB_PATH), false);
    assert.equal(isPrimaryDashboardPath('/messages', MY_HOMECHEFF_HUB_PATH), false);
  });

  it('routes Dashboard by role without a new page', () => {
    const cases: Array<{ id: string; user: Record<string, unknown>; href: string }> = [
      {
        id: 'BUYER_ONLY',
        user: { role: 'USER', sellerRoles: [] },
        href: MY_HOMECHEFF_HUB_PATH,
      },
      {
        id: 'NEW_ACCOUNT_NO_ROLES',
        user: { role: 'USER', sellerRoles: [], hasAffiliate: false, hasDeliveryProfile: false },
        href: MY_HOMECHEFF_HUB_PATH,
      },
      {
        id: 'NEW_SELLER_ZERO_LISTINGS',
        user: { role: 'SELLER', sellerRoles: ['CHEF'] },
        href: '/operations/vandaag',
      },
      {
        id: 'ACTIVE_SELLER',
        user: { role: 'SELLER', sellerRoles: ['CHEF'] },
        href: '/operations/vandaag',
      },
      {
        id: 'SERVICE_PROVIDER',
        user: { role: 'SELLER', sellerRoles: ['DESIGNER'] },
        href: '/operations/vandaag',
      },
      {
        id: 'AFFILIATE_ONLY',
        user: { role: 'USER', sellerRoles: [], hasAffiliate: true },
        href: '/operations/vandaag',
      },
      {
        id: 'DELIVERY_ONLY',
        user: { role: 'DELIVERY', sellerRoles: [], hasDeliveryProfile: true },
        href: '/operations/vandaag',
      },
      {
        id: 'SELLER_PLUS_AFFILIATE',
        user: { role: 'SELLER', sellerRoles: ['CHEF'], hasAffiliate: true },
        href: '/operations/vandaag',
      },
      {
        id: 'SELLER_PLUS_DELIVERY',
        user: {
          role: 'SELLER',
          sellerRoles: ['CHEF'],
          hasDeliveryProfile: true,
        },
        href: '/operations/vandaag',
      },
      {
        id: 'MULTI_ROLE',
        user: {
          role: 'SELLER',
          sellerRoles: ['CHEF'],
          hasAffiliate: true,
          hasDeliveryProfile: true,
        },
        href: '/operations/vandaag',
      },
    ];
    for (const row of cases) {
      assert.equal(
        resolvePrimaryDashboardHrefFromUser(row.user),
        row.href,
        row.id,
      );
    }
    assert.equal(
      isPrimaryDashboardPath('/operations/vandaag', '/operations/vandaag'),
      true,
    );
    assert.equal(
      isPrimaryDashboardPath('/mijn-homecheff', MY_HOMECHEFF_HUB_PATH),
      true,
    );
  });

  it('incomplete profile still opens the profile gate before any dashboard', () => {
    assert.equal(
      needsProfileOnboardingFromFlags({
        hasTempUsername: false,
        onboardingCompleted: false,
      }),
      true,
    );
    const gate = readFileSync(join(root, 'components/auth/AuthCompletionGate.tsx'), 'utf8');
    assert.match(gate, /replaceOnce\('\/onboarding\/complete-profile'\)/);
    const register = readFileSync(join(root, 'app/api/register/route.ts'), 'utf8');
    assert.match(register, /\/operations\/vandaag\?welcome=true&newUser=true/);
    const perf = readFileSync(join(root, 'app/verkoper/dashboard/page-client.tsx'), 'utf8');
    assert.match(perf, /seller\.performanceTitle/);
    assert.doesNotMatch(perf, /breadcrumbLabel=\{t\('operations\.tabs\.today'\)\}/);
  });

  it('dashboard tab uses an overview icon, not a money glyph', () => {
    const src = readFileSync(join(root, 'components/navigation/BottomNavigation.tsx'), 'utf8');
    assert.match(src, /LayoutGrid/);
    assert.equal(src.includes('💰'), false);
  });
});
