/**
 * Canonical time availability for DeliveryProfile.
 *
 * SCHEDULED_AVAILABILITY  = availableDays + slots / work hours (never mutated by Go online)
 * TEMPORARY_ONLINE_OVERRIDE = isOnline && onlineUntil && now < onlineUntil
 *
 * Temporary online overrides TIME only — never area, pricing, or completeness.
 */

import { CANONICAL_DELIVERY_DAYS } from '@/lib/delivery/delivery-profile-canonical';

export const DELIVERY_MARKET_TIMEZONE = 'Europe/Amsterdam';

export type DeliveryTimeAvailabilitySource =
  | 'SCHEDULED_AVAILABILITY'
  | 'TEMPORARY_ONLINE_OVERRIDE'
  | 'OFFLINE';

export type DeliveryScheduleProfile = {
  availableDays?: string[] | null;
  availableTimeSlots?: string[] | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  temporaryOffline?: boolean | null;
  isOnline?: boolean | null;
  lastOnlineAt?: Date | string | null;
  onlineUntil?: Date | string | null;
};

export type DeliveryTimeAvailability = {
  source: DeliveryTimeAvailabilitySource;
  available: boolean;
  overrideActive: boolean;
  scheduledActive: boolean;
  onlineSince: string | null;
  onlineUntil: string | null;
  untilLabel: string | null;
  statusTitleNl: string;
  statusBodyNl: string;
  nextAvailableAt: string | null;
  nextAvailableLabelNl: string | null;
};

const SLOT_HOURS: Record<string, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 23 },
};

const EN_TO_NL: Record<string, string> = {
  monday: 'maandag',
  tuesday: 'dinsdag',
  wednesday: 'woensdag',
  thursday: 'donderdag',
  friday: 'vrijdag',
  saturday: 'zaterdag',
  sunday: 'zondag',
};

export function parseHmToMinutes(hm: string | null | undefined): number | null {
  if (!hm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function normalizeDeliveryWeekday(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if ((CANONICAL_DELIVERY_DAYS as readonly string[]).includes(t)) return t;
  if (EN_TO_NL[t]) return EN_TO_NL[t];
  return null;
}

export function weekdayNlInTimeZone(now: Date, timeZone: string): string {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  })
    .format(now)
    .toLowerCase();
  return EN_TO_NL[day] ?? 'maandag';
}

export function minutesNowInTimeZone(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

export function formatHmInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function ymdInTimeZone(now: Date, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return {
    y: Number(parts.find((p) => p.type === 'year')?.value),
    m: Number(parts.find((p) => p.type === 'month')?.value),
    d: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

function formatSvInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/** Convert a wall-clock local datetime in `timeZone` to a UTC Date. */
export function zonedLocalToUtc(
  localIso: string,
  timeZone: string,
): Date | null {
  const normalized = localIso.trim().replace(' ', 'T');
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(normalized);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const s = Number(m[6] ?? '0');
  if ([y, mo, d, h, mi, s].some((n) => !Number.isFinite(n))) return null;
  const naiveUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  const naive = new Date(naiveUtc);
  const formatted = formatSvInTimeZone(naive, timeZone).replace(' ', 'T');
  const asUtc = Date.parse(`${formatted}Z`);
  if (!Number.isFinite(asUtc)) return null;
  const diff = asUtc - naiveUtc;
  return new Date(naiveUtc - diff);
}

export function endOfDayUtc(now: Date, timeZone: string): Date {
  const { y, m, d } = ymdInTimeZone(now, timeZone);
  const until = zonedLocalToUtc(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T23:59:00`,
    timeZone,
  );
  return until ?? new Date(now.getTime() + 60 * 60 * 1000);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function scheduledWindowsMinutes(profile: DeliveryScheduleProfile): Array<{
  start: number;
  end: number;
}> {
  const windows: Array<{ start: number; end: number }> = [];
  const workStart = parseHmToMinutes(profile.workStartTime);
  const workEnd = parseHmToMinutes(profile.workEndTime);
  if (workStart != null && workEnd != null && workEnd > workStart) {
    windows.push({ start: workStart, end: workEnd });
  }
  const slots = profile.availableTimeSlots ?? [];
  for (const slot of slots) {
    const key = slot.trim().toLowerCase();
    const mapped = SLOT_HOURS[key];
    if (mapped) {
      windows.push({ start: mapped.start * 60, end: mapped.end * 60 });
      continue;
    }
    if (slot.includes('-')) {
      const [a, b] = slot.split('-');
      const start = parseHmToMinutes(a) ?? Number.parseInt(a, 10) * 60;
      const end = parseHmToMinutes(b) ?? Number.parseInt(b, 10) * 60;
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        windows.push({ start, end });
      }
    }
  }
  return windows;
}

export function isWithinScheduledAvailability(
  profile: DeliveryScheduleProfile,
  now: Date,
  timeZone: string = DELIVERY_MARKET_TIMEZONE,
): { active: boolean; untilMinutes: number | null } {
  if (profile.temporaryOffline) return { active: false, untilMinutes: null };
  const days = (profile.availableDays ?? [])
    .map((d) => normalizeDeliveryWeekday(String(d)))
    .filter((d): d is string => Boolean(d));
  const today = weekdayNlInTimeZone(now, timeZone);
  if (days.length > 0 && !days.includes(today)) {
    return { active: false, untilMinutes: null };
  }
  const minutes = minutesNowInTimeZone(now, timeZone);
  const windows = scheduledWindowsMinutes(profile);
  if (windows.length === 0) {
    if (days.length > 0) return { active: true, untilMinutes: 23 * 60 + 59 };
    return { active: false, untilMinutes: null };
  }
  const hit = windows.find((w) => minutes >= w.start && minutes < w.end);
  if (!hit) return { active: false, untilMinutes: null };
  return { active: true, untilMinutes: hit.end };
}

export function isTemporaryOnlineOverrideActive(
  profile: DeliveryScheduleProfile,
  now: Date = new Date(),
): boolean {
  if (profile.temporaryOffline) return false;
  if (profile.isOnline !== true) return false;
  const until = toDate(profile.onlineUntil);
  if (!until) return false;
  return now.getTime() < until.getTime();
}

export function scheduledUntilDate(
  now: Date,
  untilMinutes: number,
  timeZone: string,
): Date {
  const { y, m, d } = ymdInTimeZone(now, timeZone);
  const hh = Math.floor(untilMinutes / 60);
  const mm = untilMinutes % 60;
  return (
    zonedLocalToUtc(
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`,
      timeZone,
    ) ?? new Date(now.getTime() + 60 * 60 * 1000)
  );
}

export function nextScheduledAt(
  profile: DeliveryScheduleProfile,
  now: Date,
  timeZone: string = DELIVERY_MARKET_TIMEZONE,
): Date | null {
  for (let addDays = 0; addDays <= 7; addDays++) {
    const probe = new Date(now.getTime() + addDays * 86400000);
    const day = weekdayNlInTimeZone(probe, timeZone);
    const days = (profile.availableDays ?? [])
      .map((d) => normalizeDeliveryWeekday(String(d)))
      .filter((d): d is string => Boolean(d));
    if (days.length > 0 && !days.includes(day)) continue;
    const windows = scheduledWindowsMinutes(profile);
    const minutes = addDays === 0 ? minutesNowInTimeZone(now, timeZone) : 0;
    const start =
      windows.length === 0
        ? 9 * 60
        : windows.map((w) => w.start).sort((a, b) => a - b).find((s) => addDays > 0 || s > minutes);
    if (start == null) continue;
    const { y, m, d } = ymdInTimeZone(probe, timeZone);
    const hh = Math.floor(start / 60);
    const mm = start % 60;
    const at = zonedLocalToUtc(
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`,
      timeZone,
    );
    if (at && at.getTime() > now.getTime()) return at;
  }
  return null;
}

export function resolveDeliveryTimeAvailability(
  profile: DeliveryScheduleProfile,
  now: Date = new Date(),
  timeZone: string = DELIVERY_MARKET_TIMEZONE,
): DeliveryTimeAvailability {
  const scheduled = isWithinScheduledAvailability(profile, now, timeZone);
  const override = isTemporaryOnlineOverrideActive(profile, now);
  const until = toDate(profile.onlineUntil);
  const since = toDate(profile.lastOnlineAt);

  if (override && until) {
    const untilLabel = formatHmInTimeZone(until, timeZone);
    return {
      source: 'TEMPORARY_ONLINE_OVERRIDE',
      available: true,
      overrideActive: true,
      scheduledActive: scheduled.active,
      onlineSince: since?.toISOString() ?? null,
      onlineUntil: until.toISOString(),
      untilLabel,
      statusTitleNl: 'ONLINE',
      statusBodyNl: `Beschikbaar tot ${untilLabel}`,
      nextAvailableAt: null,
      nextAvailableLabelNl: null,
    };
  }

  if (scheduled.active && scheduled.untilMinutes != null) {
    const untilDate = scheduledUntilDate(now, scheduled.untilMinutes, timeZone);
    const untilLabel = formatHmInTimeZone(untilDate, timeZone);
    return {
      source: 'SCHEDULED_AVAILABILITY',
      available: true,
      overrideActive: false,
      scheduledActive: true,
      onlineSince: since?.toISOString() ?? null,
      onlineUntil: null,
      untilLabel,
      statusTitleNl: 'ONLINE',
      statusBodyNl: `Volgens je rooster beschikbaar tot ${untilLabel}`,
      nextAvailableAt: null,
      nextAvailableLabelNl: null,
    };
  }

  const next = nextScheduledAt(profile, now, timeZone);
  let nextLabel: string | null = null;
  if (next) {
    const todayYmd = ymdInTimeZone(now, timeZone);
    const nextYmd = ymdInTimeZone(next, timeZone);
    const hm = formatHmInTimeZone(next, timeZone);
    const sameDay =
      todayYmd.y === nextYmd.y && todayYmd.m === nextYmd.m && todayYmd.d === nextYmd.d;
    nextLabel = sameDay
      ? `vandaag ${hm}`
      : `${weekdayNlInTimeZone(next, timeZone)} ${hm}`;
  }

  return {
    source: 'OFFLINE',
    available: false,
    overrideActive: false,
    scheduledActive: false,
    onlineSince: since?.toISOString() ?? null,
    onlineUntil: until && until.getTime() > now.getTime() ? until.toISOString() : null,
    untilLabel: null,
    statusTitleNl: 'OFFLINE',
    statusBodyNl: nextLabel
      ? `Volgende beschikbaarheid: ${nextLabel}`
      : 'Je bent nu niet beschikbaar voor bezorgopdrachten.',
    nextAvailableAt: next?.toISOString() ?? null,
    nextAvailableLabelNl: nextLabel,
  };
}

export type OnlineDurationPreset = '30m' | '1h' | '2h' | '4h' | 'end_of_day' | 'custom';

const PRESET_MS: Record<Exclude<OnlineDurationPreset, 'end_of_day' | 'custom'>, number> = {
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

export function resolveOnlineUntil(input: {
  preset: OnlineDurationPreset;
  customUntil?: string | null;
  timeZone?: string;
  now?: Date;
  from?: Date | null;
}): { ok: true; until: Date } | { ok: false; error: string; code: string } {
  const now = input.now ?? new Date();
  const timeZone = input.timeZone || DELIVERY_MARKET_TIMEZONE;
  const base =
    input.from && input.from.getTime() > now.getTime() ? input.from : now;

  if (input.preset === 'end_of_day') {
    const until = endOfDayUtc(now, timeZone);
    if (until.getTime() <= now.getTime()) {
      return {
        ok: false,
        error: 'Het einde van vandaag is al verstreken. Kies een andere duur.',
        code: 'END_IN_PAST',
      };
    }
    return { ok: true, until };
  }

  if (input.preset === 'custom') {
    if (!input.customUntil?.trim()) {
      return { ok: false, error: 'Kies een geldige eindtijd.', code: 'INVALID_UNTIL' };
    }
    const until = /^\d{4}-\d{2}-\d{2}T/.test(input.customUntil)
      ? zonedLocalToUtc(input.customUntil, timeZone)
      : toDate(input.customUntil);
    if (!until) {
      return { ok: false, error: 'Kies een geldige eindtijd.', code: 'INVALID_UNTIL' };
    }
    if (until.getTime() <= now.getTime()) {
      return {
        ok: false,
        error: 'De eindtijd mag niet in het verleden liggen.',
        code: 'END_IN_PAST',
      };
    }
    return { ok: true, until };
  }

  const ms = PRESET_MS[input.preset];
  if (!ms) {
    return { ok: false, error: 'Kies hoe lang je online wilt blijven.', code: 'INVALID_PRESET' };
  }
  return { ok: true, until: new Date(base.getTime() + ms) };
}
