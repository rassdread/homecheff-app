import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  amsterdamWallClockToUtc,
  assessSchedule,
  estimateTravelMinutes,
  planReservation,
  routeModeForVehicle,
  type ScheduledNeighbor,
} from '@/lib/delivery/delivery-schedule';

const start = new Date('2026-06-02T08:00:00.000Z');

function neighbor(partial: Partial<ScheduledNeighbor> & Pick<ScheduledNeighbor, 'id' | 'start' | 'end'>): ScheduledNeighbor {
  return {
    origin: 'PACKAGE',
    travelToCandidateMinutes: 20,
    travelFromCandidateMinutes: 20,
    travelSource: 'google',
    travelMatchesVehicle: true,
    ...partial,
  };
}

describe('delivery schedule', () => {
  it('allows two jobs on the same day when the gap covers the drive', () => {
    const first = planReservation({
      start,
      loadMinutes: 10,
      driveMinutes: 15,
      driveSource: 'google',
      driveMatchesVehicle: true,
      unloadMinutes: 5,
    });
    const secondStart = new Date(first.end!.getTime() + 20 * 60_000);
    const second = planReservation({
      start: secondStart,
      loadMinutes: 10,
      driveMinutes: 15,
      driveSource: 'google',
      driveMatchesVehicle: true,
      unloadMinutes: 5,
    });
    const decision = assessSchedule(second, [neighbor({ id: 'first', start: first.start, end: first.end, origin: 'MARKETPLACE' })]);
    assert.equal(first.complete && second.complete, true);
    assert.equal(decision.conflicts.length, 0);
    assert.equal(decision.autoReady, true);
    assert.equal(second.start!.toISOString().slice(0, 10), first.start!.toISOString().slice(0, 10));
  });

  it('blocks an overlapping window from another route', () => {
    const plan = planReservation({
      start,
      loadMinutes: 10,
      driveMinutes: 30,
      driveSource: 'google',
      driveMatchesVehicle: true,
      unloadMinutes: 10,
    });
    const decision = assessSchedule(plan, [
      neighbor({
        id: 'transport',
        origin: 'TRANSPORT',
        start: new Date(start.getTime() + 15 * 60_000),
        end: new Date(start.getTime() + 40 * 60_000),
      }),
    ]);
    assert.equal(decision.conflicts[0]?.code, 'WINDOW_OVERLAP');
    assert.equal(decision.conflicts[0]?.proven, true);
    assert.equal(decision.autoReady, false);
  });

  it('blocks a gap that is shorter than the travel to the next job', () => {
    const plan = planReservation({
      start: new Date(start.getTime() + 40 * 60_000),
      loadMinutes: 5,
      driveMinutes: 10,
      driveSource: 'google',
      driveMatchesVehicle: true,
      unloadMinutes: 5,
    });
    const decision = assessSchedule(plan, [
      neighbor({
        id: 'previous',
        start,
        end: new Date(start.getTime() + 30 * 60_000),
        travelToCandidateMinutes: 20,
      }),
    ]);
    assert.equal(decision.conflicts[0]?.code, 'TRAVEL_TOO_SHORT');
    assert.equal(decision.conflicts[0]?.gapMinutes, 10);
    assert.equal(decision.autoReady, false);
  });

  it('does not turn a missing duration into zero minutes or an automatic booking', () => {
    const plan = planReservation({
      start,
      loadMinutes: 10,
      driveMinutes: null,
      driveSource: 'unknown',
      driveMatchesVehicle: false,
      unloadMinutes: null,
    });
    assert.equal(plan.complete, false);
    assert.deepEqual(plan.missing, ['drive', 'unload']);
    assert.equal(plan.occupiedMinutes, null);
    assert.equal(assessSchedule(plan, []).autoReady, false);
  });

  it('uses a vehicle-matched route and keeps a straight-line time as an estimate', () => {
    assert.deepEqual(routeModeForVehicle('BIKE'), { googleMode: 'bicycling', matchesVehicle: true });
    assert.equal(routeModeForVehicle('SCOOTER').matchesVehicle, false);
    assert.equal(routeModeForVehicle('VAN').googleMode, 'driving');
    assert.equal(estimateTravelMinutes(15, 'BIKE'), 60);
    assert.equal(estimateTravelMinutes(15, 'CAR'), 18);
    const estimate = planReservation({
      start,
      loadMinutes: 0,
      driveMinutes: estimateTravelMinutes(15, 'BIKE'),
      driveSource: 'straight_line',
      driveMatchesVehicle: true,
      unloadMinutes: 0,
    });
    assert.equal(estimate.driveIsEstimate, true);
    assert.equal(assessSchedule(estimate, []).autoReady, false);
  });

  it('keeps an unknown neighbouring end visible instead of inventing one', () => {
    const plan = planReservation({
      start: new Date(start.getTime() + 3 * 60 * 60_000),
      loadMinutes: 5,
      driveMinutes: 10,
      driveSource: 'google',
      driveMatchesVehicle: true,
      unloadMinutes: 5,
    });
    const decision = assessSchedule(plan, [
      neighbor({ id: 'open', origin: 'PACKAGE', start, end: null, travelToCandidateMinutes: null, travelSource: 'unknown' }),
    ]);
    assert.equal(decision.conflicts[0]?.code, 'CONNECTION_UNKNOWN');
    assert.equal(decision.autoReady, false);
  });

  it('measures a spring-forward morning in Amsterdam instants, not wall-clock subtraction', () => {
    const missing = amsterdamWallClockToUtc(2026, 3, 29, 2, 30);
    const before = amsterdamWallClockToUtc(2026, 3, 29, 1, 30);
    const after = amsterdamWallClockToUtc(2026, 3, 29, 3, 30);
    assert.equal(missing, null);
    assert.ok(before && after);
    assert.equal(after!.getTime() - before!.getTime(), 60 * 60_000);
    const winterBefore = amsterdamWallClockToUtc(2026, 10, 25, 1, 30);
    const winterAfter = amsterdamWallClockToUtc(2026, 10, 25, 3, 30);
    assert.ok(winterBefore && winterAfter);
    assert.equal(winterAfter!.getTime() - winterBefore!.getTime(), 3 * 60 * 60_000);
  });
});
