import { assertCourierBookableAt } from './standalone-availability';
import type { ProviderAcceptanceProfile } from './provider-acceptance';
import {
  DELIVERY_MARKET_TIMEZONE, hasDaySpecificSlots, minutesNowInTimeZone, normalizeDeliveryWeekday,
  parseHmToMinutes, scheduledWindowsMinutes, weekdayNlInTimeZone, zonedLocalToUtc,
} from './delivery-time-availability';

const minuteMs = 60_000;
const localDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: DELIVERY_MARKET_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

type BookingWindow = { pickupAt: Date | null; deliverAt: Date | null; estimatedDurationMinutes: number | null };

function endOfBooking(entry: BookingWindow) {
  if (!entry.pickupAt) return null;
  return entry.deliverAt ?? new Date(entry.pickupAt.getTime() + Math.max(1, entry.estimatedDurationMinutes ?? 1) * minuteMs);
}

export function pickupOverlapsBooking(at: Date, routeMinutes: number, bookings: BookingWindow[]) {
  const end = at.getTime() + Math.max(1, routeMinutes) * minuteMs;
  return bookings.some(entry => {
    const occupiedUntil = endOfBooking(entry);
    return entry.pickupAt && occupiedUntil && end > entry.pickupAt.getTime() && at < occupiedUntil;
  });
}

/** A few concrete pickup times from the courier's own roster. Never reserves a slot. */
export function suggestedPickupTimes(
  profile: ProviderAcceptanceProfile, requested: Date, now: Date,
  distanceKm: number, routeMinutes: number, bookings: BookingWindow[],
): string[] {
  if (profile.temporaryOffline) return [];
  const days = (profile.availableDays ?? []).map(normalizeDeliveryWeekday);
  const specific = hasDaySpecificSlots(profile.availableTimeSlots);
  const globalWindows = specific ? [] : scheduledWindowsMinutes(profile);
  const firstDay = localDay.format(new Date(Math.max(now.getTime(), requested.getTime())));
  const date = new Date(firstDay + 'T12:00:00Z');
  const preferred = minutesNowInTimeZone(requested, DELIVERY_MARKET_TIMEZONE);
  const breakEnds: number[] = [];
  if (Array.isArray(profile.breakWindows)) {
    for (const pause of profile.breakWindows) {
      const end = parseHmToMinutes(typeof pause?.end === 'string' ? pause.end : null);
      if (end != null) breakEnds.push(end);
    }
  }
  const resumes = [now, ...bookings.map(endOfBooking)];
  if (profile.vacationEnd) resumes.push(new Date(new Date(profile.vacationEnd).getTime() + 1));
  const options: string[] = [];
  let shownDays = 0;
  for (let i = 0; i < 8 && shownDays < 3; i++, date.setUTCDate(date.getUTCDate() + 1)) {
    const weekday = weekdayNlInTimeZone(date, DELIVERY_MARKET_TIMEZONE);
    if (days.length && !days.includes(weekday)) continue;
    const windows = specific ? scheduledWindowsMinutes(profile, weekday) : [...globalWindows];
    if (!specific && !windows.length && days.length) windows.push({ start: 0, end: 1440 });
    if (!windows.length) continue;
    const day = date.toISOString().slice(0, 10);
    const starts = new Set<number>(specific ? windows.map((window) => window.start) : [preferred, ...breakEnds]);
    if (!specific) {
      for (const window of windows) {
        starts.add(window.start);
        for (let m = Math.ceil(window.start / 60) * 60; m < window.end && m < 1440; m += 60) starts.add(m);
      }
    }
    for (const instant of resumes) {
      if (!instant || !Number.isFinite(instant.getTime())) continue;
      const rounded = new Date(Math.ceil(instant.getTime() / minuteMs) * minuteMs);
      if (localDay.format(rounded) === day) starts.add(minutesNowInTimeZone(rounded, DELIVERY_MARKET_TIMEZONE));
    }
    const times: string[] = [];
    for (const m of [...starts].sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred) || a - b)) {
      if (!windows.some(w => m >= w.start && m < w.end) || m < 0 || m >= 1440) continue;
      const hm = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      const at = zonedLocalToUtc(day + 'T' + hm, DELIVERY_MARKET_TIMEZONE);
      if (!at || at <= now || minutesNowInTimeZone(at, DELIVERY_MARKET_TIMEZONE) !== m) continue;
      if (pickupOverlapsBooking(at, routeMinutes, bookings)) continue;
      if (assertCourierBookableAt(profile, at, distanceKm).ok) times.push(at.toISOString());
      if (times.length === 2) break;
    }
    if (times.length) {
      options.push(...times.sort());
      shownDays++;
    }
  }
  return options;
}
