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

  const handleMoreInfo = () => {
    window.location.href = '/privacy';
  };

  if (mode === 'hidden') return null;

  return (
    <div
      data-wx-cookie-banner=""
      data-wx-cookie-compact="1"
      className="pointer-events-none fixed inset-x-0 z-[35] flex justify-center px-3 max-lg:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-5 lg:justify-end lg:px-5"
    >
      <div
        data-wx-cookie-compact="1"
        className="pointer-events-auto w-full max-w-[22rem] rounded-xl border border-emerald-100/90 bg-white/95 p-3 shadow-[0_8px_28px_-12px_rgba(16,185,129,0.35),0_4px_14px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md sm:max-w-sm sm:p-3.5"
      >
        <p className="text-sm font-semibold text-gray-900 tracking-tight">
          {mode === 'marketing' ? t('cookieBanner.marketingTitle') : t('cookieBanner.title')}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-600 sm:text-xs sm:leading-relaxed">
          {mode === 'marketing' ? t('cookieBanner.marketingNote') : t('cookieBanner.cookieNoteShort')}
        </p>

        {mode === 'full' ? (
          <label className="mt-2 flex items-start gap-2 text-[11px] leading-snug text-gray-700 sm:text-xs">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
              checked={marketingChecked}
              onChange={(event) => setMarketingChecked(event.target.checked)}
            />
            <span>{t('cookieBanner.marketingOptIn')}</span>
          </label>
        ) : null}

        <div className="mt-2.5 flex gap-2">
          {mode === 'marketing' ? (
            <>
              <button
                onClick={handleDeclineMarketing}
                type="button"
                className="flex-1 min-h-[40px] rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 sm:text-sm"
              >
                {t('cookieBanner.marketingDecline')}
              </button>
              <button
                onClick={handleGrantMarketing}
                type="button"
                className="flex-1 min-h-[40px] rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 sm:text-sm"
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
            className="flex-1 min-h-[40px] rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 sm:text-sm"
          >
            {t('cookieBanner.onlyNecessary')}
          </button>
          <button
            onClick={handleAcceptAll}
            type="button"
            className="flex-1 min-h-[40px] rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 sm:text-sm"
          >
            {t('cookieBanner.acceptAll')}
          </button>
            </>
          ) : null}
        </div>

        <p className="mt-2 text-center text-[11px] text-gray-500">
          <button
            type="button"
            onClick={handleMoreInfo}
            className="text-emerald-700 hover:underline"
          >
            {t('cookieBanner.moreInfo')}
          </button>
          {' · '}
          <a href="/privacy" className="text-emerald-700 hover:underline">
            {t('register.privacyPage.title')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyNotice;
