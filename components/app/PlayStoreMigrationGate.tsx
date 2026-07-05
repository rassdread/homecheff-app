'use client';

import { Smartphone, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';
import { isPlayOpenTestingUrlConfigured } from '@/lib/app-distribution';

/**
 * Non-blocking Play Open Testing migration prompt for legacy sideload installs.
 * Play Store installs see nothing — updates are managed by Google Play.
 */
export default function PlayStoreMigrationGate() {
  const { t } = useTranslation();
  const {
    scopeActive,
    showPlayMigration,
    playStoreUrl,
    openPlayStore,
    dismissPlayMigration,
  } = useAppUpdateStatus();

  if (!scopeActive || !showPlayMigration) return null;

  const hasPlayUrl = isPlayOpenTestingUrlConfigured(playStoreUrl);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-[215] flex justify-center px-4 md:bottom-6"
      role="region"
      aria-label={t('playMigration.ariaLabel')}
    >
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-xl shadow-emerald-900/10">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <Smartphone className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold leading-snug text-gray-900">
                {t('playMigration.title')}
              </h2>
              <button
                type="button"
                onClick={dismissPlayMigration}
                className="-mr-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 touch-manipulation"
                aria-label={t('playMigration.later')}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{t('playMigration.body')}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              {hasPlayUrl ? (
                <button
                  type="button"
                  onClick={() => void openPlayStore()}
                  className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] touch-manipulation"
                >
                  {t('playMigration.ctaOpenPlay')}
                </button>
              ) : (
                <p className="text-xs text-amber-800">{t('playMigration.playUrlMissing')}</p>
              )}
              <button
                type="button"
                onClick={dismissPlayMigration}
                className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 touch-manipulation sm:shrink-0"
              >
                {t('playMigration.later')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
