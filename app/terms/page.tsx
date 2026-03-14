'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  const { t, language } = useTranslation();
  const locale = language === 'en' ? 'en-GB' : 'nl-NL';
  const lastUpdated = new Date().toLocaleDateString(locale);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header - HomeCheff stijl (emerald) */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-4 mb-4">
              <FileText className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold">{t('termsPage.title')}</h1>
                <p className="text-emerald-100 mt-2">{t('termsPage.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <p className="text-gray-600 mb-8">
              <strong>{t('termsPage.lastUpdated')}:</strong> {lastUpdated}<br />
              <strong>{t('termsPage.version')}:</strong> 1.0
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s1Title')}</h2>
              <p className="text-gray-700 mb-4">{t('termsPage.s1P1')}</p>
              <p className="text-gray-700 mb-4">{t('termsPage.s1P2')}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s2Title')}</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>{t('termsPage.s2Platform')}</strong></li>
                <li><strong>{t('termsPage.s2User')}</strong></li>
                <li><strong>{t('termsPage.s2Seller')}</strong></li>
                <li><strong>{t('termsPage.s2Buyer')}</strong></li>
                <li><strong>{t('termsPage.s2Transaction')}</strong></li>
                <li><strong>{t('termsPage.s2Products')}</strong></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s3Title')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s3_1Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s3_1L1')}</li>
                <li>{t('termsPage.s3_1L2')}</li>
                <li>{t('termsPage.s3_1L3')}</li>
                <li>{t('termsPage.s3_1L4')}</li>
                <li>{t('termsPage.s3_1L5')}</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s3_2Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s3_2L1')}</li>
                <li>{t('termsPage.s3_2L2')}</li>
                <li>{t('termsPage.s3_2L3')}</li>
                <li>{t('termsPage.s3_2L4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s4Title')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s4_1Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s4_1L1')}</li>
                <li>{t('termsPage.s4_1L2')}</li>
                <li>{t('termsPage.s4_1L3')}</li>
                <li>{t('termsPage.s4_1L4')}</li>
                <li>{t('termsPage.s4_1L5')}</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s4_2Heading')}</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 text-xl">⚠️</span>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">{t('termsPage.s4_2Title')}</h4>
                    <p className="text-sm text-amber-700">{t('termsPage.s4_2P')}</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s4_3Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s4_3L1')}</li>
                <li>{t('termsPage.s4_3L2')}</li>
                <li>{t('termsPage.s4_3L3')}</li>
                <li>{t('termsPage.s4_3L4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s5Title')}</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s5L1')}</li>
                <li>{t('termsPage.s5L2')}</li>
                <li>{t('termsPage.s5L3')}</li>
                <li>{t('termsPage.s5L4')}</li>
                <li>— <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">{t('termsPage.privacyLinkText')}</Link></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s6Title')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s6_1Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s6_1L1')}</li>
                <li>{t('termsPage.s6_1L2')}</li>
                <li>{t('termsPage.s6_1L3')}</li>
                <li>{t('termsPage.s6_1L4')}</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s6_2Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s6_2L1')}</li>
                <li>{t('termsPage.s6_2L2')}</li>
                <li>{t('termsPage.s6_2L3')}</li>
                <li>{t('termsPage.s6_2L4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s7Title')}</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>{t('termsPage.s7L1')}</li>
                <li>{t('termsPage.s7L2')}</li>
                <li>{t('termsPage.s7L3')}</li>
                <li>{t('termsPage.s7L4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.s8Title')}</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s8_1Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s8_1L1')}</li>
                <li>{t('termsPage.s8_1L2')}</li>
                <li>{t('termsPage.s8_1L3')}</li>
                <li>{t('termsPage.s8_1L4')}</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('termsPage.s8_2Title')}</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>{t('termsPage.s8_2L1')}</li>
                <li>{t('termsPage.s8_2L2')}</li>
                <li>{t('termsPage.s8_2L3')}</li>
                <li>{t('termsPage.s8_2L4')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.contactTitle')}</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 mb-4">{t('termsPage.contactIntro')}</p>
                <p className="text-gray-700 mb-2"><strong>{t('overOns.companyName')}</strong></p>
                <p className="text-gray-700 mb-2"><strong>{t('termsPage.contactEmail')}:</strong> info@homecheff.eu</p>
                <p className="text-gray-700"><strong>{t('termsPage.contactAddress')}:</strong> {t('overOns.companyAddress')}</p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8 space-y-4">
              <p className="text-sm text-gray-500 text-center">{t('termsPage.footerNote')}</p>
              <p className="text-xs text-amber-700 text-center italic">{t('termsPage.legalDisclaimer')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
