import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPrimaryDashboardPath } from './primary-dashboard';
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
});
