'use client';

import { useTranslation } from '@/hooks/useTranslation';

import { ExternalLink, BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

interface GoogleAnalyticsEmbedProps {
  measurementId?: string;
  streamId?: string; // Optional: GA4 Stream ID (13277240797)
}

/**
 * Component to show Google Analytics quick access in admin dashboard
 * Provides direct links to GA4 reports
 */
export default function GoogleAnalyticsEmbed({ measurementId, streamId }: GoogleAnalyticsEmbedProps) {
  const { t } = useTranslation();
  const GA_MEASUREMENT_ID = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const GA_STREAM_ID = streamId || '13277240797'; // From your GA4 stream details

  if (!GA_MEASUREMENT_ID) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">{t('admin.googleAnalyticsNotConfigured')}</p>
          <p className="text-sm text-gray-400">
            {t('admin.googleAnalyticsConfigHint')}
          </p>
        </div>
      </div>
    );
  }

  const gaBaseUrl = `https://analytics.google.com/analytics/web/#/p${GA_STREAM_ID}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Google Analytics Dashboard
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {GA_MEASUREMENT_ID}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {t('admin.googleAnalyticsDirectAccess')}
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <a
          href={`${gaBaseUrl}/reports/home`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 group-hover:text-emerald-700">
              Overview Dashboard
            </p>
            <p className="text-xs text-gray-500">{t('admin.googleAnalyticsTotalOverview')}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
        </a>

        <a
          href={`${gaBaseUrl}/reports/realtime`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 group-hover:text-emerald-700">
              Realtime Users
            </p>
            <p className="text-xs text-gray-500">{t('admin.googleAnalyticsLiveUsers')}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
        </a>

        <a
          href={`${gaBaseUrl}/reports/explorer`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 group-hover:text-emerald-700">
              Custom Reports
            </p>
            <p className="text-xs text-gray-500">{t('admin.googleAnalyticsDetailedAnalyses')}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
        </a>

        <a
          href={`${gaBaseUrl}/reports/user-acquisition`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
            <Eye className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 group-hover:text-emerald-700">
              User Acquisition
            </p>
            <p className="text-xs text-gray-500">{t('admin.googleAnalyticsUserTypes')}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
        </a>
      </div>

      {/* Direct Link */}
      <div className="pt-4 border-t border-gray-200">
        <a
          href={`${gaBaseUrl}/reports/home`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {t('admin.openFullGoogleAnalytics')}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          {t('admin.googleAnalyticsLoginRequired')}
        </p>
      </div>
    </div>
  );
}

