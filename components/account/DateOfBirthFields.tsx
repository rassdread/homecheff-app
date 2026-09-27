'use client';

import { useMemo } from 'react';

export type DateOfBirthParts = {
  day: string;
  month: string;
  year: string;
};

export function emptyDateOfBirthParts(): DateOfBirthParts {
  return { day: '', month: '', year: '' };
}

export function partsFromIso(iso: string | null | undefined): DateOfBirthParts {
  if (!iso) return emptyDateOfBirthParts();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return emptyDateOfBirthParts();
  return { year: m[1], month: m[2], day: m[3] };
}

export function isoFromParts(parts: DateOfBirthParts): string | null {
  const d = parts.day.replace(/\D/g, '');
  const m = parts.month.replace(/\D/g, '');
  const y = parts.year.replace(/\D/g, '');
  if (!d || !m || y.length !== 4) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function slashFromParts(parts: DateOfBirthParts): string {
  const d = parts.day.replace(/\D/g, '');
  const m = parts.month.replace(/\D/g, '');
  const y = parts.year.replace(/\D/g, '');
  if (!d && !m && !y) return '';
  return `${d}/${m}/${y}`;
}

type Props = {
  value: DateOfBirthParts;
  onChange: (next: DateOfBirthParts) => void;
  disabled?: boolean;
  error?: string | null;
  idPrefix?: string;
  yearPlaceholder?: string;
};

export default function DateOfBirthFields({
  value,
  onChange,
  disabled,
  error,
  idPrefix = 'dob',
  yearPlaceholder = 'JJJJ',
}: Props) {
  const describedBy = error ? `${idPrefix}-error` : undefined;
  const inputs = useMemo(
    () =>
      [
        { key: 'day' as const, label: 'DD', maxLength: 2, placeholder: 'DD' },
        { key: 'month' as const, label: 'MM', maxLength: 2, placeholder: 'MM' },
        { key: 'year' as const, label: yearPlaceholder, maxLength: 4, placeholder: yearPlaceholder },
      ] as const,
    [yearPlaceholder],
  );

  return (
    <div>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {inputs.map((input, index) => (
          <div key={input.key} className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-0">
              <label htmlFor={`${idPrefix}-${input.key}`} className="sr-only">
                {input.label}
              </label>
              <input
                id={`${idPrefix}-${input.key}`}
                inputMode="numeric"
                autoComplete={input.key === 'year' ? 'bday-year' : input.key === 'month' ? 'bday-month' : 'bday-day'}
                maxLength={input.maxLength}
                placeholder={input.placeholder}
                disabled={disabled}
                value={value[input.key]}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, '').slice(0, input.maxLength);
                  onChange({ ...value, [input.key]: next });
                }}
                className="w-[4.5rem] sm:w-20 rounded-xl border border-gray-300 px-3 py-3 text-center text-base tabular-nums focus:border-transparent focus:ring-2 focus:ring-primary-brand disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            {index < inputs.length - 1 ? (
              <span className="text-lg font-semibold text-gray-400" aria-hidden>
                /
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {error ? (
        <p id={`${idPrefix}-error`} className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
