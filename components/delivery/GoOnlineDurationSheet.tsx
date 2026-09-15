'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnlineDurationPreset } from '@/lib/delivery/delivery-time-availability';

export type GoOnlineNotice = {
  titleNl: string;
  bodyNl?: string | null;
  ctaLabelNl?: string | null;
  targetRoute?: string | null;
} | null;

type Props = {
  open: boolean;
  mode: 'online' | 'extend';
  busy?: boolean;
  error?: string | null;
  notice?: GoOnlineNotice;
  currentUntil?: string | null;
  currentUntilLabel?: string | null;
  onClose: () => void;
  onConfirm: (input: {
    preset: OnlineDurationPreset;
    customUntil: string | null;
    timeZone: string;
  }) => void;
};

const ONLINE_OPTIONS: Array<{
  preset: OnlineDurationPreset;
  label: string;
}> = [
  { preset: '30m', label: '30 minuten' },
  { preset: '1h', label: '1 uur' },
  { preset: '2h', label: '2 uur' },
  { preset: '4h', label: '4 uur' },
  { preset: 'end_of_day', label: 'Tot einde van vandaag' },
  { preset: 'custom', label: 'Zelf eindtijd kiezen' },
];

const EXTEND_OPTIONS: Array<{
  preset: OnlineDurationPreset;
  label: string;
}> = [
  { preset: '30m', label: '+30 minuten' },
  { preset: '1h', label: '+1 uur' },
  { preset: '2h', label: '+2 uur' },
  { preset: '4h', label: '+4 uur' },
  { preset: 'end_of_day', label: 'Tot einde van vandaag' },
  { preset: 'custom', label: 'Zelf eindtijd kiezen' },
];

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function GoOnlineDurationSheet({
  open,
  mode,
  busy = false,
  error = null,
  notice = null,
  currentUntil = null,
  currentUntilLabel = null,
  onClose,
  onConfirm,
}: Props) {
  const [preset, setPreset] = useState<OnlineDurationPreset>('1h');
  const [customUntil, setCustomUntil] = useState('');
  const timeZone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam'
      : 'Europe/Amsterdam';

  const minLocal = useMemo(() => toDateTimeLocalValue(new Date()), [open]);
  const maxLocal = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + 2);
    return toDateTimeLocalValue(max);
  }, [open]);

  if (!open) return null;

  const options = mode === 'extend' ? EXTEND_OPTIONS : ONLINE_OPTIONS;
  const title =
    mode === 'extend' ? 'Hoe lang wil je extra online blijven?' : 'Hoe lang wil je online blijven?';
  const cta = mode === 'extend' ? 'Verlengen' : 'Ga online';
  const fromUntil = currentUntil ? new Date(currentUntil) : null;
  const fromInFuture = fromUntil && fromUntil.getTime() > Date.now();

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center lg:items-center p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="go-online-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Sluiten"
        onClick={onClose}
        disabled={busy}
      />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-t-2xl lg:rounded-2xl bg-white shadow-2xl border border-gray-100',
          'max-h-[min(92vh,640px)] overflow-y-auto p-5 sm:p-6 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:pb-6',
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          onClick={onClose}
          aria-label="Sluiten"
          disabled={busy}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="go-online-title" className="text-xl font-bold text-gray-900 pr-10">
          {title}
        </h2>

        {notice ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">{notice.titleNl}</p>
            {notice.bodyNl ? (
              <p className="mt-1 whitespace-pre-line text-amber-900">{notice.bodyNl}</p>
            ) : null}
            {notice.targetRoute && notice.ctaLabelNl ? (
              <a
                href={notice.targetRoute}
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
              >
                {notice.ctaLabelNl}
              </a>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Je bent tijdelijk beschikbaar voor bezorgopdrachten, ook wanneer dit buiten je
              normale bezorgtijden valt. Je vaste rooster blijft ongewijzigd.
            </p>

            {mode === 'extend' ? (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {fromInFuture && currentUntilLabel
                  ? `Verlenging wordt berekend vanaf ${currentUntilLabel} (je huidige eindtijd).`
                  : 'Verlenging wordt berekend vanaf nu.'}
              </p>
            ) : null}

            <fieldset className="mt-5 space-y-2" disabled={busy}>
              <legend className="sr-only">{title}</legend>
              {options.map((option) => (
                <label
                  key={option.preset}
                  className={cn(
                    'flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
                    preset === option.preset
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
                  )}
                >
                  <input
                    type="radio"
                    name="online-duration"
                    className="h-4 w-4 accent-emerald-600"
                    checked={preset === option.preset}
                    onChange={() => setPreset(option.preset)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>

            {preset === 'custom' ? (
              <div className="mt-4">
                <label htmlFor="online-custom-until" className="text-sm font-medium text-gray-800">
                  Eindtijd
                </label>
                <input
                  id="online-custom-until"
                  type="datetime-local"
                  min={minLocal}
                  max={maxLocal}
                  value={customUntil}
                  onChange={(e) => setCustomUntil(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm"
                  disabled={busy}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tijd in jouw lokale tijdzone ({timeZone}).
                </p>
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
                onClick={onClose}
                disabled={busy}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                onClick={() =>
                  onConfirm({
                    preset,
                    customUntil: preset === 'custom' ? customUntil : null,
                    timeZone,
                  })
                }
                disabled={busy || (preset === 'custom' && !customUntil)}
              >
                {busy ? 'Bezig…' : cta}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
