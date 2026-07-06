'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  open: boolean;
  onDismiss: () => void;
};

export default function HcpWelcomeSheet({ open, onDismiss }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const finish = async () => {
    setBusy(true);
    try {
      await fetch('/api/gamification/onboarding/dismiss', { method: 'POST', credentials: 'include' });
      onDismiss();
    } catch {
      onDismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center lg:items-center p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hcp-welcome-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t('hcpWelcome.closeBackdrop')}
        onClick={() => void finish()}
      />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-t-2xl lg:rounded-2xl bg-white shadow-2xl border border-gray-100',
          'max-h-[min(88vh,560px)] overflow-y-auto p-5 sm:p-6 max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:pb-6'
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          onClick={() => void finish()}
          aria-label={t('hcpWelcome.closeButton')}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 id="hcp-welcome-title" className="text-xl font-bold text-gray-900 pr-10">
          {t('hcpWelcome.title')}
        </h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{t('hcpWelcome.intro')}</p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            className="w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => void finish()}
            disabled={busy}
          >
            {t('hcpWelcome.skip')}
          </button>
          <button
            type="button"
            className="w-full sm:w-auto rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            onClick={() => void finish()}
            disabled={busy}
          >
            {t('hcpWelcome.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}
