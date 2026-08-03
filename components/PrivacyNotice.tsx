'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * WX 1C.1.2 — Compact first-impression privacy notice.
 * Keeps Accept all / Only necessary / Privacy links (compliance).
 * Lighter visual weight so HomeCheff remains recognisable behind it.
 */
const PrivacyNotice: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('privacy-notice-accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('privacy-notice-accepted', 'true');
    setIsVisible(false);
  };

  const handleOnlyNecessary = () => {
    localStorage.setItem('privacy-notice-accepted', 'necessary');
    setIsVisible(false);
  };

  const handleMoreInfo = () => {
    window.location.href = '/privacy';
  };

  if (!isVisible) return null;

  return (
    <div
      data-wx-cookie-banner=""
      data-wx-cookie-compact="1"
      className="pointer-events-none fixed inset-x-0 z-[35] flex justify-center px-3 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-5 lg:justify-end lg:px-5"
    >
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-emerald-100/90 bg-white/95 p-3.5 shadow-[0_8px_28px_-12px_rgba(16,185,129,0.35),0_4px_14px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-4">
        <p className="text-sm font-semibold text-gray-900 tracking-tight">
          {t('cookieBanner.title')}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          {t('cookieBanner.cookieNoteShort')}
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleOnlyNecessary}
            type="button"
            className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 sm:text-sm"
          >
            {t('cookieBanner.onlyNecessary')}
          </button>
          <button
            onClick={handleAcceptAll}
            type="button"
            className="flex-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 sm:text-sm"
          >
            {t('cookieBanner.acceptAll')}
          </button>
        </div>

        <p className="mt-2.5 text-center text-[11px] text-gray-500">
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
