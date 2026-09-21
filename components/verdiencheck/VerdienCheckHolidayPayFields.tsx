'use client';

import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import type { WizardState } from '@/lib/verdiencheck/wizard/schema';
import { STATUTORY_HOLIDAY_PAY_PERCENT, parseHolidayPercent } from '@/lib/verdiencheck/wizard/holiday-pay';

export default function VerdienCheckHolidayPayFields(props: {
  copy: VerdienCheckCopy;
  included: WizardState['holidayPayIncluded'];
  percentMode: WizardState['holidayPayPercentMode'];
  customPercent: string;
  onIncluded: (value: NonNullable<WizardState['holidayPayIncluded']>) => void;
  onPercentMode: (value: NonNullable<WizardState['holidayPayPercentMode']>) => void;
  onCustomPercent: (value: string) => void;
}) {
  const { copy } = props;
  return (
    <div className="space-y-3" data-verdiencheck-holiday-pay="">
      <p className="text-base font-medium text-gray-900">{copy.holidayPayQuestion}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {(
          [
            ['YES', copy.holidayPayYes],
            ['NO', copy.holidayPayNo],
            ['UNKNOWN', copy.holidayPayUnknown],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={props.included === value}
            onClick={() => props.onIncluded(value)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
              props.included === value
                ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                : 'border-gray-200 bg-white text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {props.included === 'NO' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">{copy.holidayPayHowMuch}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              aria-pressed={props.percentMode !== 'CUSTOM'}
              onClick={() => props.onPercentMode('STATUTORY_8')}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
                props.percentMode !== 'CUSTOM'
                  ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                  : 'border-gray-200 bg-white text-gray-800'
              }`}
            >
              {copy.holidayPayStatutory8}
            </button>
            <button
              type="button"
              aria-pressed={props.percentMode === 'CUSTOM'}
              onClick={() => props.onPercentMode('CUSTOM')}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm ${
                props.percentMode === 'CUSTOM'
                  ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
                  : 'border-gray-200 bg-white text-gray-800'
              }`}
            >
              {copy.holidayPayCustomPercent}
            </button>
          </div>
          {props.percentMode === 'CUSTOM' ? (
            <label className="block max-w-[12rem]">
              <span className="sr-only">{copy.holidayPayPercentLabel}</span>
              <input
                inputMode="decimal"
                value={props.customPercent}
                onChange={(e) => props.onCustomPercent(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-gray-200 px-3 py-2"
                placeholder={`${STATUTORY_HOLIDAY_PAY_PERCENT}`}
                aria-label={copy.holidayPayPercentLabel}
              />
            </label>
          ) : null}
          {props.percentMode === 'CUSTOM' &&
          props.customPercent.trim() !== '' &&
          parseHolidayPercent(props.customPercent) == null ? (
            <p role="alert" className="text-sm text-red-700">
              {copy.holidayPayPercentInvalid}
            </p>
          ) : null}
        </div>
      ) : null}
      {props.included === 'UNKNOWN' || props.included == null ? (
        <p className="text-sm leading-relaxed text-stone-600">{copy.holidayPayUnknownExplain}</p>
      ) : null}
    </div>
  );
}
