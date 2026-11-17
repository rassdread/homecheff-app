'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CANONICAL_DELIVERY_DAYS } from '@/lib/delivery/delivery-profile-canonical';
import {
  QUICK_DAY_WINDOWS,
  copyDayWindows,
  dayScheduleError,
  decodeDaySchedule,
  encodeDaySchedule,
  type DaySchedule,
  type DayWindow,
} from '@/lib/delivery/day-schedule';

const DAY_LABELS: Record<string, string> = {
  maandag: 'Maandag',
  dinsdag: 'Dinsdag',
  woensdag: 'Woensdag',
  donderdag: 'Donderdag',
  vrijdag: 'Vrijdag',
  zaterdag: 'Zaterdag',
  zondag: 'Zondag',
};

type Props = {
  days: string[];
  slots: string[];
  workStartTime?: string | null;
  workEndTime?: string | null;
  onSlotsChange: (slots: string[]) => void;
};

export function CourierDayScheduleEditor({
  days,
  slots,
  workStartTime,
  workEndTime,
  onSlotsChange,
}: Props) {
  const schedule = decodeDaySchedule(slots, days, workStartTime, workEndTime);
  const [copyTargets, setCopyTargets] = useState<Record<string, string[]>>({});
  const { t } = useTranslation();
  const flow = (key: string, fallback: string) => t(`deliveryFlow.${key}`, { defaultValue: fallback }) || fallback;
  const dayName = (day: string) => flow(`day.${day}`, DAY_LABELS[day] ?? day);
  const scheduleError = (message: string | null) => {
    if (!message) return null;
    const key = message.startsWith('Kies minstens')
      ? 'errWindow'
      : message.startsWith('Vul een geldige')
        ? 'errTime'
        : message.startsWith('De eindtijd')
          ? 'errOrder'
          : message.startsWith('Deze tijdvakken')
            ? 'errOverlap'
            : null;
    return key ? flow(key, message) : message;
  };
  const selected = CANONICAL_DELIVERY_DAYS.filter((day) => days.includes(day));

  const commit = (next: DaySchedule) => {
    onSlotsChange(encodeDaySchedule(days, next));
  };

  const updateDay = (day: string, windows: DayWindow[]) => {
    commit({ ...schedule, [day]: windows });
  };

  if (selected.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        {flow('pickDaysFirst', 'Kies eerst de dagen waarop je werkt. Een uitgezette dag levert geen ophaalmomenten op.')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {selected.map((day) => {
        const windows = schedule[day] ?? [];
        const error = dayScheduleError(windows);
        const targets = copyTargets[day] ?? [];
        return (
          <section key={day} className="rounded-xl border border-gray-200 p-4" data-day={day}>
            <h4 className="font-semibold text-gray-900">{dayName(day)}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_DAY_WINDOWS.map((quick) => (
                <button
                  key={quick.id}
                  type="button"
                  className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm"
                  onClick={() => {
                    const rest = windows.slice(1);
                    updateDay(day, [{ start: quick.start, end: quick.end }, ...rest]);
                  }}
                >
                  {flow(`window.${quick.id}`, quick.label)}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-3">
              {windows.map((window, index) => (
                <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                  <label className="text-sm text-gray-700">
                    {flow('start', 'Begin')}
                    <input
                      type="time"
                      value={window.start}
                      aria-label={`${dayName(day)} ${index + 1} ${flow('start', 'Begin')}`}
                      className="ml-2 rounded-lg border border-gray-300 px-2 py-2"
                      onChange={(event) => {
                        const next = windows.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, start: event.target.value } : item,
                        );
                        updateDay(day, next);
                      }}
                    />
                  </label>
                  <label className="text-sm text-gray-700">
                    {flow('end', 'Einde')}
                    <input
                      type="time"
                      value={window.end}
                      aria-label={`${dayName(day)} ${index + 1} ${flow('end', 'Einde')}`}
                      className="ml-2 rounded-lg border border-gray-300 px-2 py-2"
                      onChange={(event) => {
                        const next = windows.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, end: event.target.value } : item,
                        );
                        updateDay(day, next);
                      }}
                    />
                  </label>
                  {windows.length > 1 ? (
                    <button
                      type="button"
                      className="min-h-11 text-sm text-gray-600 underline"
                      onClick={() => updateDay(day, windows.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      {flow('removeWindow', 'Verwijder tijdvak')}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {windows.length < 2 ? (
              <button
                type="button"
                className="mt-3 min-h-11 text-sm font-medium text-primary-brand"
                onClick={() => updateDay(day, [...windows, { start: '14:00', end: '17:00' }])}
              >
                {flow('addWindow', 'Tweede tijdvak toevoegen')}
              </button>
            ) : null}
            {error ? (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {scheduleError(error)}
              </p>
            ) : null}
            <fieldset className="mt-4 space-y-2">
              <legend className="text-sm font-medium text-gray-800">{flow('copyLegend', 'Kopieer naar andere dagen')}</legend>
              <div className="flex flex-wrap gap-3">
                {selected
                  .filter((other) => other !== day)
                  .map((other) => (
                    <label key={other} className="flex min-h-11 items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={targets.includes(other)}
                        onChange={(event) => {
                          setCopyTargets((prev) => ({
                            ...prev,
                            [day]: event.target.checked
                              ? [...targets, other]
                              : targets.filter((item) => item !== other),
                          }));
                        }}
                      />
                      {dayName(other)}
                    </label>
                  ))}
              </div>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm"
                disabled={targets.length === 0}
                onClick={() => {
                  commit(copyDayWindows(schedule, day, targets));
                  setCopyTargets((prev) => ({ ...prev, [day]: [] }));
                }}
              >
                {flow('copyAction', 'Kopieer naar andere dagen')}
              </button>
            </fieldset>
          </section>
        );
      })}
    </div>
  );
}
