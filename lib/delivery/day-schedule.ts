/**
 * Per-day courier windows stored on the existing DeliveryProfile fields.
 * A day-specific slot is `maandag@09:00-12:00`. Legacy profiles keep global
 * names (`morning`) and one workStart/workEnd pair; those still expand onto
 * every selected day until the courier edits a single day.
 */

import { CANONICAL_DELIVERY_DAYS } from '@/lib/delivery/delivery-profile-canonical';
import {
  hasDaySpecificSlots,
  parseHmToMinutes,
  scheduledWindowsMinutes,
} from '@/lib/delivery/delivery-time-availability';

export type DayWindow = { start: string; end: string };
export type DaySchedule = Record<string, DayWindow[]>;

export const QUICK_DAY_WINDOWS: Array<DayWindow & { id: string; label: string }> = [
  { id: 'morning', label: 'Ochtend', start: '09:00', end: '12:00' },
  { id: 'afternoon', label: 'Middag', start: '12:00', end: '17:00' },
  { id: 'evening', label: 'Avond', start: '17:00', end: '21:00' },
];

const DAY_SLOT =
  /^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)@(\d{2}:\d{2})-(\d{2}:\d{2})$/;

function minutesToHm(minutes: number): string {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function copyWindows(windows: DayWindow[]): DayWindow[] {
  return windows.map((window) => ({ start: window.start, end: window.end }));
}

export function emptyDaySchedule(): DaySchedule {
  return Object.fromEntries(CANONICAL_DELIVERY_DAYS.map((day) => [day, []]));
}

export function encodeDaySchedule(days: string[], schedule: DaySchedule): string[] {
  const selected = new Set(days);
  const slots: string[] = [];
  for (const day of CANONICAL_DELIVERY_DAYS) {
    if (!selected.has(day)) continue;
    for (const window of schedule[day] ?? []) {
      const start = parseHmToMinutes(window.start);
      const end = parseHmToMinutes(window.end);
      if (start == null || end == null || end <= start) continue;
      slots.push(`${day}@${minutesToHm(start)}-${minutesToHm(end)}`);
    }
  }
  return slots;
}

export function decodeDaySchedule(
  slots: string[] | null | undefined,
  days: string[] | null | undefined,
  workStartTime?: string | null,
  workEndTime?: string | null,
): DaySchedule {
  const schedule = emptyDaySchedule();
  const raw = slots ?? [];
  if (hasDaySpecificSlots(raw)) {
    for (const slot of raw) {
      const match = DAY_SLOT.exec(slot.trim().toLowerCase());
      if (!match) continue;
      schedule[match[1]]!.push({ start: match[2]!, end: match[3]! });
    }
    return schedule;
  }
  const shared = scheduledWindowsMinutes({
    availableTimeSlots: raw,
    workStartTime,
    workEndTime,
  }).map((window) => ({
    start: minutesToHm(window.start),
    end: minutesToHm(window.end),
  }));
  for (const day of days ?? []) {
    if (!schedule[day]) continue;
    schedule[day] = copyWindows(shared);
  }
  return schedule;
}

export function dayScheduleError(windows: DayWindow[] | undefined): string | null {
  const list = windows ?? [];
  if (list.length === 0) return 'Kies minstens één tijdvak.';
  const parsed = list.map((window) => ({
    start: parseHmToMinutes(window.start),
    end: parseHmToMinutes(window.end),
  }));
  if (parsed.some((window) => window.start == null || window.end == null)) {
    return 'Vul een geldige begin- en eindtijd in.';
  }
  if (parsed.some((window) => window.end! <= window.start!)) {
    return 'De eindtijd moet na de begintijd liggen.';
  }
  const ordered = [...parsed].sort((a, b) => a.start! - b.start!);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index]!.start! < ordered[index - 1]!.end!) {
      return 'Deze tijdvakken overlappen.';
    }
  }
  return null;
}

export function scheduleReady(days: string[], slots: string[]): boolean {
  if (days.length === 0) return false;
  const schedule = decodeDaySchedule(slots, days);
  return days.every((day) => dayScheduleError(schedule[day]) == null);
}

/** Copy one day's windows onto explicitly chosen days. Other days stay as they are. */
export function copyDayWindows(
  schedule: DaySchedule,
  fromDay: string,
  toDays: string[],
): DaySchedule {
  const next: DaySchedule = {};
  for (const day of CANONICAL_DELIVERY_DAYS) {
    next[day] = copyWindows(schedule[day] ?? []);
  }
  const source = copyWindows(schedule[fromDay] ?? []);
  for (const day of toDays) {
    if (day === fromDay || !next[day]) continue;
    next[day] = copyWindows(source);
  }
  return next;
}
