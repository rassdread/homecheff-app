'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/hooks/useTranslation';
import { getVerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import type { VerdienCheckEntryPoint } from '@/lib/verdiencheck/privacy/analytics-guard';

const HUB_INFO = {
  nl: {
    whatTitle: 'Wat doet VerdienCheck?',
    whatBody:
      'VerdienCheck laat zien wat je bij extra inkomsten naar schatting werkelijk overhoudt, rekening houdend met relevante kosten, belasting, Zvw en toeslagen.',
    afterExample: 'Daarna berekent VerdienCheck wat dit voor jouw situatie betekent.',
    infoLabel: 'Wat doet VerdienCheck?',
    closeLabel: 'Sluiten',
  },
  en: {
    whatTitle: 'What does VerdienCheck do?',
    whatBody:
      'VerdienCheck shows what you would actually keep from extra income, taking relevant costs, tax, Zvw and allowances into account.',
    afterExample: 'Then VerdienCheck calculates what this means for your situation.',
    infoLabel: 'What does VerdienCheck do?',
    closeLabel: 'Close',
  },
} as const;

export default function VerdienCheckHubCompactEntry({
  from,
  cta,
}: {
  from: VerdienCheckEntryPoint;
  cta: string;
}) {
  const { language, t } = useTranslation();
  const copy = getVerdienCheckCopy(language === 'en' ? 'en' : 'nl');
  const info = language === 'en' ? HUB_INFO.en : HUB_INFO.nl;
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <aside
      data-verdiencheck-public-entry="hub"
      data-verdiencheck-entry={from}
      data-verdiencheck-hub-compact=""
      className="bg-emerald-50/80"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center">
          <p className="text-sm font-semibold text-emerald-950">VerdienCheck</p>
          <button
            type="button"
            data-verdiencheck-hub-info-trigger=""
            aria-label={info.infoLabel}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-emerald-800 hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <span aria-hidden="true" className="text-base leading-none">
              ⓘ
            </span>
          </button>
        </div>
        <Link
          href={`/verdiencheck?from=${from}`}
          data-verdiencheck-hub-cta=""
          className="inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {cta}
        </Link>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledById={titleId}
        lockScroll={false}
        overlayClassName="fixed inset-0 z-[160] bg-black/40 flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        overlayProps={{
          'data-verdiencheck-hub-info-overlay': '1',
          'data-verdiencheck-hub-info-align': 'center',
        }}
      >
        <div
          data-verdiencheck-hub-info=""
          className="flex max-h-[min(85dvh,28rem)] w-full max-w-[22rem] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold text-gray-900">
              {info.whatTitle}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            >
              {t('buttons.close') || info.closeLabel}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <p className="text-sm leading-relaxed text-gray-700">{info.whatBody}</p>
            <div
              data-verdiencheck-hub-info-example=""
              className="space-y-1.5 text-sm tabular-nums"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
                {copy.resultExampleCaption}
              </p>
              <div className="flex justify-between gap-3 text-stone-800">
                <span>{copy.youSellLabel}</span>
                <span className="font-medium">{copy.exampleRevenueAmount}</span>
              </div>
              <div className="flex justify-between gap-3 text-stone-800">
                <span>{copy.helperCostsLabel}</span>
                <span className="font-medium">{copy.exampleCostsAmount}</span>
              </div>
              <div className="border-t border-stone-200 pt-1.5 flex justify-between gap-3 font-semibold text-stone-900">
                <span>{copy.resultBeforeTaxLabel}</span>
                <span>{copy.exampleResultAmount}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{info.afterExample}</p>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
