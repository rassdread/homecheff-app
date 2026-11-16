import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { homeClickShouldLeaveDeliveryView } from './home-feed-entry';
import { bottomNavBarVisibleClass } from '../layout/bottomNavVisibility';

describe('home returns from the delivery panel in one click', () => {
  it('treats an open delivery panel on / as not yet home', () => {
    assert.equal(homeClickShouldLeaveDeliveryView('/', '?bezorging=1'), true);
    assert.equal(homeClickShouldLeaveDeliveryView('/', '?bezorging=1#homecheff-feed'), true);
    assert.equal(homeClickShouldLeaveDeliveryView('/', ''), false);
    assert.equal(homeClickShouldLeaveDeliveryView('/messages', '?bezorging=1'), false);
    assert.equal(homeClickShouldLeaveDeliveryView('/bezorging/aanvragen', ''), false);
  });

  it('keeps the web tab bar below the desktop header, including landscape', () => {
    assert.equal(bottomNavBarVisibleClass(false, true, 390), 'max-xl:block xl:hidden');
    assert.equal(bottomNavBarVisibleClass(false, true, 1100), 'max-xl:block xl:hidden');
    assert.equal(bottomNavBarVisibleClass(false, true, 1440), 'hidden');
    assert.equal(bottomNavBarVisibleClass(false, false, 390), 'max-xl:block xl:hidden');
    assert.equal(bottomNavBarVisibleClass(true, true, 390), 'hidden');
  });

  it('closes the delivery panel from the existing home controls', () => {
    const root = new URL('../../', import.meta.url);
    const bottom = readFileSync(new URL('components/navigation/BottomNavigation.tsx', root), 'utf8');
    const nav = readFileSync(new URL('components/NavBar.tsx', root), 'utf8');
    assert.match(bottom, /homeClickShouldLeaveDeliveryView/);
    assert.match(bottom, /markDeliveryRequestClosed\(\)/);
    assert.equal(nav.split('homeClickShouldLeaveDeliveryView').length - 1, 3);
  });
});
