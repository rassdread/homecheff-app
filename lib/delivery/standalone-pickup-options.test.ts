import assert from 'node:assert/strict';
import test from 'node:test';
import { pickupOverlapsBooking, suggestedPickupTimes } from './standalone-pickup-options';
import { assertCourierBookableAt } from './standalone-availability';
import type { ProviderAcceptanceProfile } from './provider-acceptance';

const courier: ProviderAcceptanceProfile = {
  id: 'fixture', dateOfBirth: '1990-01-01', age: 31, isActive: true, isVerified: true, maxDistance: 25,
  availableDays: ['dinsdag'], workStartTime: '09:15', workEndTime: '12:00',
  breakWindows: [{ start: '09:00', end: '09:40' }],
};
const now = new Date('2026-11-15T10:00:00Z');
const requested = new Date('2026-11-16T08:00:00Z');
const booking = { pickupAt: new Date('2026-11-17T09:00:00Z'), deliverAt: null, estimatedDurationMinutes: 45 };

test('suggests times inside actual shifts, after breaks and reservations, for the same route', () => {
  const slots = suggestedPickupTimes(courier, requested, now, 15, 30, [booking]);
  assert.equal(slots[0], '2026-11-17T09:45:00.000Z');
  for (const slot of slots) {
    const at = new Date(slot);
    assert.ok(assertCourierBookableAt(courier, at, 15).ok);
    assert.equal(pickupOverlapsBooking(at, 30, [booking]), false);
  }
  assert.deepEqual(suggestedPickupTimes(courier, requested, now, 26, 30, []), []);
});

test('offers an earlier hour on the requested day if still in the future', () => {
  const afterShift = new Date('2026-11-17T19:25:00Z');
  const slots = suggestedPickupTimes(courier, afterShift, now, 2, 5, []);
  assert.ok(slots.some(slot => slot.startsWith('2026-11-17')));
  assert.ok(slots.some(slot => slot.startsWith('2026-11-24')));
  assert.ok(suggestedPickupTimes(courier, afterShift, afterShift, 2, 5, []).every(slot => new Date(slot) > afterShift));
});

test('handles vacation, temporary offline and missing rosters', () => {
  const vacation = { ...courier, vacationStart: now, vacationEnd: new Date('2026-11-30T00:00:00Z') };
  for (const profile of [vacation, { ...courier, temporaryOffline: true }, { ...courier, availableDays: [], workStartTime: null, workEndTime: null }]) {
    assert.deepEqual(suggestedPickupTimes(profile, requested, now, 3, 30, []), []);
  }
});

test('only offers real wall-clock times on the Amsterdam spring clock change', () => {
  const sunday = { ...courier, availableDays: ['zondag'], workStartTime: '02:00', workEndTime: '03:00', breakWindows: [] };
  const before = new Date('2026-03-28T12:00:00Z');
  const slots = suggestedPickupTimes(sunday, before, before, 3, 30, []);
  assert.deepEqual(slots, []); // The only Sunday in these eight dates has no 02:00 hour.
});

test('offers each stored window on the chosen days and skips a day that is off', () => {
  const split = {
    ...courier,
    availableDays: ['maandag', 'donderdag'],
    availableTimeSlots: ['maandag@09:00-12:00', 'maandag@14:00-17:00', 'donderdag@14:00-18:30'],
    workStartTime: null,
    workEndTime: null,
    breakWindows: [],
  };
  const monday = new Date('2026-09-14T06:00:00Z');
  const slots = suggestedPickupTimes(split, monday, monday, 2, 5, []);
  const labels = slots.map((slot) =>
    new Intl.DateTimeFormat('nl-NL', {
      timeZone: 'Europe/Amsterdam',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(slot)),
  );
  assert.ok(labels.some((label) => label.includes('09:00') && label.toLowerCase().includes('ma')));
  assert.ok(labels.some((label) => label.includes('14:00') && label.toLowerCase().includes('ma')));
  assert.ok(labels.some((label) => label.includes('14:00') && label.toLowerCase().includes('do')));
  assert.equal(labels.some((label) => label.toLowerCase().includes('di')), false);
});
