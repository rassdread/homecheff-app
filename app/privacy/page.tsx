'use client';

import { Shield, Lock, Eye, Database, Users, FileText } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function PrivacyPage() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-4 mb-4">
              <Shield className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold">{t('privacyPage.title')}</h1>
                <p className="text-blue-100 mt-2">
                  {t('privacyPage.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <div className="prose prose-lg max-w-none">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <Lock className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    {t('privacyPage.safeDataStorage')}
                  </h3>
                  <p className="text-green-700">
                    {t('privacyPage.safeDataStorageDesc')}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <Eye className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    {t('privacyPage.noDataSharing')}
                  </h3>
                  <p className="text-blue-700">
                    {t('privacyPage.noDataSharingDesc')}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <Database className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="text-xl font-semibold text-purple-900 mb-2">
                    {t('privacyPage.fullControl')}
                  </h3>
                  <p className="text-purple-700">
                    {t('privacyPage.fullControlDesc')}
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <Users className="w-8 h-8 text-orange-600 mb-4" />
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">
                    {t('privacyPage.transparency')}
                  </h3>
                  <p className="text-orange-700">
                    {t('privacyPage.transparencyDesc')}
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('privacyPage.whatWeCollect')}
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('privacyPage.essentialData')}
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>{t('privacyPage.essentialDataEmail')}</strong></li>
                  <li>• <strong>{t('privacyPage.essentialDataName')}</strong></li>
                  <li>• <strong>{t('privacyPage.essentialDataPassword')}</strong></li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('privacyPage.optionalData')}
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>{t('privacyPage.optionalDataPhoto')}</strong></li>
                  <li>• <strong>{t('privacyPage.optionalDataLocation')}</strong></li>
                  <li>• <strong>{t('privacyPage.optionalDataPhone')}</strong></li>
                  <li>• <strong>{t('privacyPage.optionalDataAddress')}</strong></li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('privacyPage.howWeProtect')}
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('privacyPage.encryption')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.encryptionDesc')}
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('privacyPage.secureServers')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.secureServersDesc')}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('privacyPage.accessControl')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.accessControlDesc')}
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('privacyPage.yourRights')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('privacyPage.rightToAccess')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.rightToAccessDesc')}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('privacyPage.rightToCorrection')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.rightToCorrectionDesc')}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('privacyPage.rightToDeletion')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.rightToDeletionDesc')}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t('privacyPage.rightToPortability')}
                  </h3>
                  <p className="text-gray-700">
                    {t('privacyPage.rightToPortabilityDesc')}
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('privacyPage.cookiesAndTracking')}
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  {t('privacyPage.minimalCookieUse')}
                </h3>
                <p className="text-yellow-800 mb-4">
                  {t('privacyPage.minimalCookieUseDesc')}
                </p>
                <ul className="space-y-2 text-yellow-800">
                  <li>• <strong>{t('privacyPage.sessionCookies')}</strong></li>
                  <li>• <strong>{t('privacyPage.preferenceCookies')}</strong></li>
                  <li>• <strong>{t('privacyPage.securityCookies')}</strong></li>
                </ul>
                <p className="text-yellow-800 mt-4">
                  <strong>{t('privacyPage.noTrackingCookies')}</strong>
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('privacyPage.contact')}
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  {t('privacyPage.contactDesc')}
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>📧 {t('privacyPage.contactEmail')} <a href={`mailto:${t('privacyPage.contactEmailValue')}`} className="text-blue-600 hover:underline">{t('privacyPage.contactEmailValue')}</a></p>
                  <p>📧 {t('privacyPage.contactSupportEmail')} <a href={`mailto:${t('privacyPage.contactSupportEmailValue')}`} className="text-blue-600 hover:underline">{t('privacyPage.contactSupportEmailValue')}</a></p>
                  <p>📧 {t('privacyPage.contactInfoEmail')} <a href={`mailto:${t('privacyPage.contactInfoEmailValue')}`} className="text-blue-600 hover:underline">{t('privacyPage.contactInfoEmailValue')}</a></p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {t('privacyPage.lastUpdated')} {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}