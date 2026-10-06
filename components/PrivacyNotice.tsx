'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { clearPendingMetaEvents } from '@/lib/meta/browser';
import { ANALYTICS_CONSENT_KEY, MARKETING_CONSENT_KEY } from '@/lib/meta/commerce';

/**
 * Compact privacy notice. One banner, two choices:
 * analytics consent stays on privacy-notice-accepted;
 * Meta advertising consent is a separate hc-marketing-consent value.
 * Existing analytics consent is never upgraded to marketing consent.
 */
const PrivacyNotice: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'hidden' | 'full' | 'marketing'>('hidden');
  const [marketingChecked, setMarketingChecked] = useState(false);

  useEffect(() => {
    const analytics = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    const marketing = localStorage.getItem(MARKETING_CONSENT_KEY);
    if (!analytics) {
      setMode('full');
      return;
    }
    if (marketing !== 'granted' && marketing !== 'denied') {
      setMode('marketing');
      return;
    }
    setMode('hidden');
  }, []);

  const publish = () => {
    window.dispatchEvent(new Event('hc-consent-changed'));
    setMode('hidden');
  };

  const handleAcceptAll = () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'true');
    if (marketingChecked) {
      localStorage.setItem(MARKETING_CONSENT_KEY, 'granted');
    } else {
      localStorage.setItem(MARKETING_CONSENT_KEY, 'denied');
      clearPendingMetaEvents();
    }
    publish();
  };

  const handleOnlyNecessary = () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'necessary');
    localStorage.setItem(MARKETING_CONSENT_KEY, 'denied');
    clearPendingMetaEvents();
    publish();
  };

  const handleGrantMarketing = () => {
    localStorage.setItem(MARKETING_CONSENT_KEY, 'granted');
    publish();
  };

  const handleDeclineMarketing = () => {
    localStorage.setItem(MARKETING_CONSENT_KEY, 'denied');
    clearPendingMetaEvents();
    publish();
  };

  if (mode === 'hidden') return null;

  return (
    <div
      data-wx-cookie-banner=""
      data-wx-cookie-compact="1"
      className="pointer-events-none fixed inset-x-0 z-[80] max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-0"
    >
      <div
        data-wx-cookie-compact="1"
        className="pointer-events-auto w-full border-t border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-3 py-1.5 shadow-[var(--hc-shadow-1)] sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-2">
          <p className="shrink-0 text-xs font-semibold text-[var(--hc-text)]">
            {mode === 'marketing' ? t('cookieBanner.marketingTitle') : t('cookieBanner.title')}
          </p>
          <p className="min-w-0 flex-1 truncate text-[11px] text-[var(--hc-text-secondary)]">
            {mode === 'marketing' ? t('cookieBanner.marketingNote') : t('cookieBanner.cookieNoteShort')}
          </p>
          <a href="/privacy" className="shrink-0 text-[11px] text-[var(--hc-blue)] hover:underline">
            {t('register.privacyPage.title')}
          </a>
        </div>

        <div className="mt-1 flex items-center gap-2">
        {mode === 'full' ? (
          <label className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-[var(--hc-text)]">
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--hc-green)] focus:ring-[var(--hc-focus)]"
              checked={marketingChecked}
              onChange={(event) => setMarketingChecked(event.target.checked)}
            />
            <span className="truncate" title={t('cookieBanner.marketingOptIn')}>{t('cookieBanner.marketingOptIn')}</span>
          </label>
        ) : null}

        <div className="flex shrink-0 gap-2">
          {mode === 'marketing' ? (
            <>
              <button
                onClick={handleDeclineMarketing}
                type="button"
                className="min-h-[40px] rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
              >
                {t('cookieBanner.marketingDecline')}
              </button>
              <button
                onClick={handleGrantMarketing}
                type="button"
                className="hc-btn-primary min-h-[40px] !px-2.5 !py-1 text-xs font-semibold"
              >
                {t('cookieBanner.marketingAllow')}
              </button>
            </>
          ) : null}
          {mode === 'full' ? (
            <>
          <button
            onClick={handleOnlyNecessary}
            type="button"
            className="min-h-[40px] rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
          >
            {t('cookieBanner.onlyNecessary')}
          </button>
          <button
            onClick={handleAcceptAll}
            type="button"
            className="hc-btn-primary min-h-[40px] !px-2.5 !py-1 text-xs font-semibold"
          >
            {t('cookieBanner.acceptAll')}
          </button>
            </>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;
