/**
 * One schedule for package, transport and marketplace delivery.
 * A job occupies load + drive + unload. Travel to the next job counts.
 * Missing minutes stay missing. They are never stored as zero.
 * A straight-line duration is an estimate. Only a vehicle-matched route
 * duration can make automatic confirmation possible.
 */

export type TravelSource = 'google' | 'straight_line' | 'unknown';

export type ScheduleVehicle = 'BIKE' | 'EBIKE' | 'SCOOTER' | 'CAR' | 'VAN' | 'WALK';

const ESTIMATE_SPEED_KMH: Record<ScheduleVehicle, number> = {
  WALK: 5,
  BIKE: 15,
  EBIKE: 20,
  SCOOTER: 30,
  CAR: 50,
  VAN: 45,
};

export function routeModeForVehicle(vehicle: string | null | undefined): {
  googleMode: 'driving' | 'walking' | 'bicycling' | null;
  /** Google has no separate ebike or scooter mode, so those routes are not vehicle-matched. */
  matchesVehicle: boolean;
} {
  if (vehicle === 'WALK') return { googleMode: 'walking', matchesVehicle: true };
  if (vehicle === 'BIKE') return { googleMode: 'bicycling', matchesVehicle: true };
  if (vehicle === 'EBIKE') return { googleMode: 'bicycling', matchesVehicle: false };
  if (vehicle === 'CAR' || vehicle === 'VAN' || vehicle === 'ESTATE' || vehicle === 'BOX_TRUCK' || vehicle === 'TRAILER') {
    return { googleMode: 'driving', matchesVehicle: true };
  }
  if (vehicle === 'SCOOTER') return { googleMode: 'driving', matchesVehicle: false };
  return { googleMode: null, matchesVehicle: false };
}

/** Straight-line estimate only. Never a confirmed driving time. */
export function estimateTravelMinutes(distanceKm: number, vehicle: string | null | undefined): number | null {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  const speed = ESTIMATE_SPEED_KMH[vehicle as ScheduleVehicle];
  if (!speed) return null;
  return Math.ceil((distanceKm / speed) * 60);
}

export type ReservationInput = {
  start: Date | null;
  /** Courier-stated preparation. Null when it was not explicitly confirmed for this job. */
  loadMinutes: number | null;
  driveMinutes: number | null;
  driveSource: TravelSource;
  driveMatchesVehicle: boolean;
  /** There is no stored unload default. Null means the courier has not confirmed it. */
  unloadMinutes: number | null;
};

export type ReservationPlan = {
  complete: boolean;
  missing: Array<'start' | 'load' | 'drive' | 'unload'>;
  driveIsEstimate: boolean;
  start: Date | null;
  end: Date | null;
  occupiedMinutes: number | null;
};

function finiteMinutes(value: number | null): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function planReservation(input: ReservationInput): ReservationPlan {
  const missing: ReservationPlan['missing'] = [];
  if (!input.start || Number.isNaN(input.start.getTime())) missing.push('start');
  if (!finiteMinutes(input.loadMinutes)) missing.push('load');
  if (!finiteMinutes(input.driveMinutes)) missing.push('drive');
  if (!finiteMinutes(input.unloadMinutes)) missing.push('unload');
  const driveIsEstimate = input.driveSource !== 'google' || !input.driveMatchesVehicle;
  if (missing.length > 0) {
    return {
      complete: false,
      missing,
      driveIsEstimate,
      start: input.start,
      end: null,
      occupiedMinutes: null,
    };
  }
  const occupiedMinutes = (input.loadMinutes ?? 0) + (input.driveMinutes ?? 0) + (input.unloadMinutes ?? 0);
  const end = new Date(input.start!.getTime() + occupiedMinutes * 60_000);
  return {
    complete: true,
    missing: [],
    driveIsEstimate,
    start: input.start,
    end,
    occupiedMinutes,
  };
}

export type ScheduledNeighbor = {
  id: string;
  origin: 'PACKAGE' | 'TRANSPORT' | 'MARKETPLACE' | 'UNKNOWN';
  start: Date | null;
  end: Date | null;
  /** Minutes from this neighbor's dropoff to the candidate pickup. Null when the route is unknown. */
  travelToCandidateMinutes: number | null;
  /** Minutes from the candidate dropoff to this neighbor's pickup. */
  travelFromCandidateMinutes: number | null;
  travelSource: TravelSource;
  travelMatchesVehicle: boolean;
};

export type ScheduleConflict = {
  neighborId: string;
  code: 'WINDOW_OVERLAP' | 'TRAVEL_TOO_SHORT' | 'CONNECTION_UNKNOWN';
  proven: boolean;
  neededMinutes?: number;
  gapMinutes?: number;
};

function gapMinutes(earlierEnd: Date, laterStart: Date): number {
  return Math.floor((laterStart.getTime() - earlierEnd.getTime()) / 60_000);
}

export function assessSchedule(plan: ReservationPlan, neighbors: ScheduledNeighbor[]): {
  conflicts: ScheduleConflict[];
  autoReady: boolean;
} {
  const conflicts: ScheduleConflict[] = [];
  if (!plan.complete || !plan.start || !plan.end) {
    return { conflicts, autoReady: false };
  }
  for (const neighbor of neighbors) {
    if (!neighbor.start || !neighbor.end) {
      conflicts.push({ neighborId: neighbor.id, code: 'CONNECTION_UNKNOWN', proven: false });
      continue;
    }
    const overlaps = plan.start < neighbor.end && plan.end > neighbor.start;
    if (overlaps) {
      conflicts.push({ neighborId: neighbor.id, code: 'WINDOW_OVERLAP', proven: true });
      continue;
    }
    const candidateIsLater = plan.start >= neighbor.end;
    const travel = candidateIsLater ? neighbor.travelToCandidateMinutes : neighbor.travelFromCandidateMinutes;
    const earlierEnd = candidateIsLater ? neighbor.end : plan.end;
    const laterStart = candidateIsLater ? plan.start : neighbor.start;
    const gap = gapMinutes(earlierEnd, laterStart);
    if (travel == null) {
      conflicts.push({ neighborId: neighbor.id, code: 'CONNECTION_UNKNOWN', proven: false });
      continue;
    }
    const provenTravel = neighbor.travelSource === 'google' && neighbor.travelMatchesVehicle;
    if (gap < travel) {
      conflicts.push({
        neighborId: neighbor.id,
        code: 'TRAVEL_TOO_SHORT',
        proven: provenTravel,
        neededMinutes: travel,
        gapMinutes: gap,
      });
    }
  }
  const blocking = conflicts.some((conflict) => conflict.proven || conflict.code === 'TRAVEL_TOO_SHORT');
  const unknown = conflicts.some((conflict) => conflict.code === 'CONNECTION_UNKNOWN');
  return {
    conflicts,
    autoReady: plan.complete && !plan.driveIsEstimate && !blocking && !unknown,
  };
}

/** Wall-clock time in Europe/Amsterdam. Returns null when that clock time does not exist. */
export function amsterdamWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date | null {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const matches = (instant: Date) => {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map((part) => [part.type, part.value]));
    return (
      Number(parts.year) === year &&
      Number(parts.month) === month &&
      Number(parts.day) === day &&
      Number(parts.hour) === hour &&
      Number(parts.minute) === minute
    );
  };
  const guess = Date.UTC(year, month - 1, day, hour - 1, minute);
  for (let offset = -3; offset <= 3; offset += 1) {
    const instant = new Date(guess + offset * 60 * 60_000);
    if (matches(instant)) return instant;
  }
  return null;
}
