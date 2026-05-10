'use client';

import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';

/** Subtle strip when optional update was dismissed in-session (Android native only). */
export default function AndroidBetaOptionalUpdateReminder({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { scopeActive, showOptionalReminder, triggerApkDownload } = useAppUpdateStatus();

  if (!scopeActive || !showOptionalReminder) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-sm font-medium text-emerald-950">{t('appUpdateGate.updateAvailableShort')}</p>
      <button
        type="button"
        onClick={() => void triggerApkDownload()}
        className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] touch-manipulation sm:text-sm"
      >
        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
        {t('appUpdateGate.ctaDownload')}
      </button>
    </div>
  );
}
