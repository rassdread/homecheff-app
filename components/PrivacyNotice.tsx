'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Database, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const PrivacyNotice: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('privacy-notice-accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy-notice-accepted', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    window.location.href = '/privacy';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('cookieBanner.title')}
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>{t('cookieBanner.point1')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>{t('cookieBanner.point2')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>{t('cookieBanner.point3')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 mb-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-emerald-800">
              {t('cookieBanner.cookieNote')}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            {t('cookieBanner.accept')}
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {t('cookieBanner.moreInfo')}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          <a href="/privacy" className="text-emerald-600 hover:underline">
            {t('register.privacyPage.title')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyNotice;
