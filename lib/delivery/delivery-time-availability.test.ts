import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DELIVERY_MARKET_TIMEZONE,
  endOfDayUtc,
  isTemporaryOnlineOverrideActive,
  resolveDeliveryTimeAvailability,
  resolveOnlineUntil,
  zonedLocalToUtc,
} from '@/lib/delivery/delivery-time-availability';
import {
  noticesForOnlineGate,
  aggregateRequirementNotice,
  isGenericProfileWarning,
} from '@/lib/account/profile-requirement-notice';

const schedule = {
  availableDays: ['maandag'],
  availableTimeSlots: ['morning'],
  workStartTime: '09:00',
  workEndTime: '17:00',
  temporaryOffline: false,
};

describe('delivery temporary online vs scheduled availability', () => {
  it('does not treat sticky isOnline without until as override', () => {
    assert.equal(
      isTemporaryOnlineOverrideActive({
        isOnline: true,
        onlineUntil: null,
        temporaryOffline: false,
      }),
      false,
    );
  });

  it('activates TEMPORARY_ONLINE_OVERRIDE outside the roster', () => {
    const now = zonedLocalToUtc('2026-09-15T20:00:00', DELIVERY_MARKET_TIMEZONE)!; // Tuesday evening
    const until = new Date(now.getTime() + 30 * 60 * 1000);
    const r = resolveDeliveryTimeAvailability(
      {
        ...schedule,
        availableDays: ['maandag'],
        isOnline: true,
        onlineUntil: until,
      },
      now,
    );
    assert.equal(r.source, 'TEMPORARY_ONLINE_OVERRIDE');
    assert.equal(r.available, true);
    assert.equal(r.overrideActive, true);
    assert.equal(r.scheduledActive, false);
    assert.match(r.statusBodyNl, /Beschikbaar tot/);
  });

  it('expires override when now >= onlineUntil without needing the dashboard', () => {
    const now = zonedLocalToUtc('2026-09-15T20:30:00', DELIVERY_MARKET_TIMEZONE)!;
    const until = zonedLocalToUtc('2026-09-15T20:00:00', DELIVERY_MARKET_TIMEZONE)!;
    const r = resolveDeliveryTimeAvailability(
      {
        ...schedule,
        availableDays: ['maandag'],
        isOnline: true,
        onlineUntil: until,
      },
      now,
    );
    assert.equal(r.overrideActive, false);
    assert.equal(r.available, false);
    assert.equal(r.source, 'OFFLINE');
  });

  it('keeps scheduled availability when override is off', () => {
    const now = zonedLocalToUtc('2026-09-14T11:00:00', DELIVERY_MARKET_TIMEZONE)!; // Monday
    const r = resolveDeliveryTimeAvailability(
      {
        ...schedule,
        isOnline: false,
        onlineUntil: null,
      },
      now,
    );
    assert.equal(r.source, 'SCHEDULED_AVAILABILITY');
    assert.equal(r.available, true);
    assert.match(r.statusBodyNl, /Volgens je rooster beschikbaar tot/);
  });

  it('resolves duration presets from now and extend-from-until', () => {
    const now = new Date('2026-09-15T12:00:00.000Z');
    const m30 = resolveOnlineUntil({ preset: '30m', now });
    assert.equal(m30.ok, true);
    if (m30.ok) assert.equal(m30.until.getTime(), now.getTime() + 30 * 60 * 1000);

    const h1 = resolveOnlineUntil({ preset: '1h', now });
    assert.equal(h1.ok, true);
    if (h1.ok) assert.equal(h1.until.getTime(), now.getTime() + 60 * 60 * 1000);

    const h2 = resolveOnlineUntil({ preset: '2h', now });
    assert.equal(h2.ok, true);
    if (h2.ok) assert.equal(h2.until.getTime(), now.getTime() + 2 * 60 * 60 * 1000);

    const h4 = resolveOnlineUntil({ preset: '4h', now });
    assert.equal(h4.ok, true);
    if (h4.ok) assert.equal(h4.until.getTime(), now.getTime() + 4 * 60 * 60 * 1000);

    const currentUntil = new Date(now.getTime() + 20 * 60 * 1000);
    const extended = resolveOnlineUntil({
      preset: '1h',
      now,
      from: currentUntil,
    });
    assert.equal(extended.ok, true);
    if (extended.ok) {
      assert.equal(extended.until.getTime(), currentUntil.getTime() + 60 * 60 * 1000);
    }
  });

  it('rejects custom end times in the past and invalid values', () => {
    const now = zonedLocalToUtc('2026-09-15T12:00:00', DELIVERY_MARKET_TIMEZONE)!;
    const past = resolveOnlineUntil({
      preset: 'custom',
      customUntil: '2026-09-15T11:00',
      timeZone: DELIVERY_MARKET_TIMEZONE,
      now,
    });
    assert.equal(past.ok, false);
    if (!past.ok) assert.equal(past.code, 'END_IN_PAST');

    const invalid = resolveOnlineUntil({
      preset: 'custom',
      customUntil: '',
      now,
    });
    assert.equal(invalid.ok, false);

    const future = resolveOnlineUntil({
      preset: 'custom',
      customUntil: '2026-09-15T15:30',
      timeZone: DELIVERY_MARKET_TIMEZONE,
      now,
    });
    assert.equal(future.ok, true);
    if (future.ok) {
      const expected = zonedLocalToUtc('2026-09-15T15:30:00', DELIVERY_MARKET_TIMEZONE)!;
      assert.equal(future.until.getTime(), expected.getTime());
    }
  });

  it('end of day is market-timezone 23:59', () => {
    const now = zonedLocalToUtc('2026-09-15T12:00:00', DELIVERY_MARKET_TIMEZONE)!;
    const eod = endOfDayUtc(now, DELIVERY_MARKET_TIMEZONE);
    const expected = zonedLocalToUtc('2026-09-15T23:59:00', DELIVERY_MARKET_TIMEZONE)!;
    assert.equal(eod.getTime(), expected.getTime());
  });

  it('online gate uses exact missing reasons, not generic copy', () => {
    const notice = aggregateRequirementNotice(noticesForOnlineGate(['pricing']));
    assert.ok(notice);
    assert.equal(
      notice?.titleNl,
      'Vul eerst je bezorgtarieven in voordat je online kunt gaan.',
    );
    assert.equal(notice?.ctaLabelNl, 'Bezorgtarieven instellen');
    assert.equal(isGenericProfileWarning(notice?.titleNl), false);
  });
});
