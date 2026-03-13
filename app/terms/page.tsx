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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Algemene bepalingen</h2>
              <p className="text-gray-700 mb-4">
                Deze algemene voorwaarden zijn van toepassing op alle diensten die HomeCheff B.V. (hierna: &quot;HomeCheff&quot;, &quot;wij&quot;, &quot;ons&quot;) levert via het platform homecheff.eu en gerelateerde diensten.
              </p>
              <p className="text-gray-700 mb-4">
                Door gebruik te maken van onze diensten, gaat u akkoord met deze voorwaarden. Wij behouden ons het recht voor om deze voorwaarden te wijzigen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definities</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Platform:</strong> Het HomeCheff platform en alle gerelateerde diensten</li>
                <li><strong>Gebruiker:</strong> Iedereen die gebruik maakt van het platform</li>
                <li><strong>Verkoper:</strong> Gebruiker die producten aanbiedt via het platform</li>
                <li><strong>Koper:</strong> Gebruiker die producten koopt via het platform</li>
                <li><strong>Transactie:</strong> Overeenkomst tussen koper en verkoper via het platform</li>
                <li><strong>Producten:</strong> Gerechten, groenten, handgemaakte items en andere aanbiedingen</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Gebruik van het platform</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Algemene verplichtingen</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>U bent verantwoordelijk voor de juistheid van uw gegevens</li>
                <li>U mag geen illegale of schadelijke content plaatsen</li>
                <li>U respecteert de rechten van andere gebruikers</li>
                <li>U gebruikt het platform alleen voor legale doeleinden</li>
                <li>U mag geen valse of misleidende informatie verstrekken</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account verplichtingen</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>U bent verantwoordelijk voor de beveiliging van uw account</li>
                <li>U mag uw account niet delen met anderen</li>
                <li>U moet uw gegevens actueel houden</li>
                <li>U bent verantwoordelijk voor alle activiteiten onder uw account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Verkoop en transacties</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Verkoopverplichtingen</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Verkopers zijn zelf verantwoordelijk voor belastingaangifte</li>
                <li>Producten moeten voldoen aan Nederlandse wetgeving</li>
                <li>HomeCheff is een platform, geen partij in transacties</li>
                <li>Verkopers zijn verantwoordelijk voor productkwaliteit en veiligheid</li>
                <li>Alle producten moeten accuraat worden beschreven</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Belastingverantwoordelijkheid</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 text-xl">⚠️</span>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Belangrijke waarschuwing</h4>
                    <p className="text-sm text-amber-700">
                      Verkopers zijn zelf verantwoordelijk voor het aangeven van inkomsten bij de belastingdienst.
                      Er is geen minimumbedrag — alle inkomsten moeten worden opgegeven.
                    </p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Transactieverwerking</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Betalingen worden verwerkt via Stripe</li>
                <li>Platformkosten worden in rekening gebracht</li>
                <li>Uitbetalingen vinden plaats volgens afgesproken voorwaarden</li>
                <li>HomeCheff bemiddelt bij geschillen</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy en gegevensbescherming</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Wij verwerken gegevens volgens de AVG/GDPR</li>
                <li>Gebruikers hebben rechten op toegang, rectificatie en verwijdering</li>
                <li>Gegevens worden veilig opgeslagen en beschermd</li>
                <li>Marketingcommunicatie alleen met toestemming</li>
                <li>Zie ons <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">{t('termsPage.privacyLinkText')}</Link> voor details</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Aansprakelijkheid en garanties</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Platform aansprakelijkheid</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>HomeCheff is een platform, geen partij in transacties</li>
                <li>Wij zijn niet aansprakelijk voor productkwaliteit</li>
                <li>Wij bemiddelen bij geschillen maar zijn niet verantwoordelijk</li>
                <li>Platform wordt geleverd &quot;as is&quot; zonder garanties</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Gebruiker aansprakelijkheid</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Gebruikers zijn verantwoordelijk voor hun eigen handelingen</li>
                <li>Verkopers zijn aansprakelijk voor hun producten</li>
                <li>Gebruikers dragen de kosten van geschillen</li>
                <li>Schade door misbruik wordt verhaald op de gebruiker</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Geschillen en rechtspraak</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Geschillen worden eerst via bemiddeling opgelost</li>
                <li>Nederlands recht is van toepassing</li>
                <li>Geschillen worden voorgelegd aan de bevoegde rechter in Nederland</li>
                <li>Consumenten kunnen gebruik maken van het Europees Online Geschillenplatform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Wijzigingen en opzegging</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Wijzigingen voorwaarden</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Wij kunnen deze voorwaarden wijzigen</li>
                <li>Wijzigingen worden 30 dagen van tevoren aangekondigd</li>
                <li>Gebruik na wijziging betekent acceptatie</li>
                <li>Belangrijke wijzigingen worden per e-mail gecommuniceerd</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Opzegging diensten</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Gebruikers kunnen hun account opzeggen</li>
                <li>Abonnementen kunnen worden opgezegd met 30 dagen opzegtermijn</li>
                <li>Wij kunnen accounts opzeggen bij schending van voorwaarden</li>
                <li>Gegevens worden 1 jaar bewaard na opzegging</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('termsPage.contactTitle')}</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 mb-4">{t('termsPage.contactIntro')}</p>
                <p className="text-gray-700 mb-2"><strong>{t('overOns.companyName')}</strong></p>
                <p className="text-gray-700 mb-2"><strong>E-mail:</strong> info@homecheff.eu</p>
                <p className="text-gray-700"><strong>Adres:</strong> {t('overOns.companyAddress')}</p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                {t('termsPage.footerNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
