import assert from 'node:assert/strict';
import {
  formatOperationalAddress,
  resolveLocationPanelPresentation,
} from '../lib/proposals/fulfillment-location';

// Empty address parts must not invent a location line.
assert.equal(formatOperationalAddress({}), null);
assert.equal(
  formatOperationalAddress({
    address: 'Verkoperlaan 3',
    postalCode: '3131 BB',
    city: 'Vlaardingen',
    country: 'NL',
  }),
  'Verkoperlaan 3, 3131 BB Vlaardingen, NL',
);

// Counterpart / completed deal without recorded location → meaningful empty state.
assert.equal(
  resolveLocationPanelPresentation({
    state: 'LOCATION_AND_SCHEDULE_PENDING',
    exactAddress: null,
    scheduleDate: null,
    scheduleTimeWindow: null,
    viewerCanComplete: false,
  }),
  'not_recorded',
);

// Owner who can still complete → show actionable panel (not bare colons).
assert.equal(
  resolveLocationPanelPresentation({
    state: 'LOCATION_AND_SCHEDULE_PENDING',
    exactAddress: null,
    scheduleDate: null,
    scheduleTimeWindow: null,
    viewerCanComplete: true,
  }),
  'panel',
);

// Completed location with address → panel.
assert.equal(
  resolveLocationPanelPresentation({
    state: 'COMPLETE',
    exactAddress: 'Straat 1, 1000 AA Amsterdam, NL',
    scheduleDate: '2026-09-29',
    scheduleTimeWindow: '14:00-16:00',
    viewerCanComplete: false,
  }),
  'panel',
);

assert.equal(
  resolveLocationPanelPresentation({
    state: 'LOCATION_NOT_REQUIRED',
    exactAddress: null,
    scheduleDate: null,
    scheduleTimeWindow: null,
    viewerCanComplete: false,
  }),
  'hidden',
);

console.log('fulfillment-location-panel-empty-state: PASS');
