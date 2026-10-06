import React from 'react';
import Link from 'next/link';
import {
  affiliateRewardsForPlans,
  businessPlanFaq,
  businessPlanJsonLd,
  commissionOffsetSalesCents,
  formatPlanEuros,
  publicPlanFacts,
  type PublicLang,
} from '@/lib/business/plan-presentation';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';

const NAMES = { basic: 'Basic', pro: 'Pro', premium: 'Premium' } as const;

export default function BusinessPlanPublicFacts({
  lang,
  variant = 'plans',
}: {
  lang: PublicLang;
  variant?: 'plans' | 'affiliate';
}) {
  const en = lang === 'en';
  const facts = publicPlanFacts(lang);
  const faq = businessPlanFaq(lang);
  const rewards = affiliateRewardsForPlans();
  const basicOffset = commissionOffsetSalesCents('basic');
  const individual = getBusinessVisibilityProfile('individual');
  const basic = getBusinessVisibilityProfile('basic');

  return (
    <section data-hc-business-plans="" style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1rem 1rem' }}>
      {variant === 'plans' ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessPlanJsonLd(lang)) }}
        />
      ) : null}
      <style>{`
        .hc-plan-grid { display: grid; gap: 0.75rem; grid-template-columns: 1fr; }
        @media (min-width: 768px) { .hc-plan-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .hc-plan-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .hc-plan-card, .hc-plan-note, .hc-plan-faq { min-width: 0; overflow-wrap: anywhere; }
        .hc-plan-card { border: 1px solid #e7e5e4; border-radius: 1rem; background: #FFFBF5; padding: 0.9rem; color: #243044; }
        .hc-plan-note, .hc-plan-faq { margin-top: 1.25rem; }
        .hc-plan-faq details { border-top: 1px solid #e7e5e4; padding: 0.7rem 0; }
        .hc-plan-cta { display: inline-flex; align-items: center; min-height: 2.75rem; margin-top: 0.75rem; padding: 0 0.9rem; border-radius: 0.75rem; background: #3C5A78; color: #fff; text-decoration: none; font-weight: 650; }
      `}</style>
      {variant === 'plans' ? (
        <>
          <h1 style={{ fontSize: '1.75rem', lineHeight: 1.2, margin: '0 0 0.5rem', color: '#243044' }}>
            {en ? 'HomeCheff for business' : 'HomeCheff voor bedrijven'}
          </h1>
          <p style={{ margin: '0 0 1rem', maxWidth: '42rem', lineHeight: 1.5, color: '#44403c' }}>
            {en
              ? 'List for free as an individual, or choose a monthly business plan with a lower platform fee. A paid plan can also be included in a separate sponsored recommendation when the offer is relevant. It does not buy a higher place in ordinary Marketplace results.'
              : 'Plaats gratis als particulier, of kies een maandelijks bedrijfsabonnement met een lagere platformfee. Een betaald plan kan daarnaast meedoen aan een aparte gesponsorde aanbeveling, als het aanbod relevant is. Het koopt geen hogere plek in de gewone Marketplace-resultaten.'}
          </p>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem', color: '#243044' }}>
            {en ? 'What the business gets, and what you earn' : 'Wat het bedrijf krijgt, en wat jij verdient'}
          </h2>
          <p style={{ margin: '0 0 1rem', maxWidth: '42rem', lineHeight: 1.5, color: '#44403c' }}>
            {en
              ? 'The referred business receives the plan below. Your reward is a share of the monthly fee on each paid invoice, not a cut of their sales, and not a guaranteed income.'
              : 'Het aangebrachte bedrijf krijgt het plan hieronder. Jouw beloning is een aandeel van de maandfee bij elke betaalde factuur, geen deel van hun verkopen, en geen gegarandeerd inkomen.'}
          </p>
        </>
      )}
      <div className="hc-plan-grid">
        {facts.map((fact) => {
          const reward = rewards.find((row) => row.plan === fact.id);
          return (
            <article key={fact.id} className="hc-plan-card">
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.35rem' }}>{fact.name}</h2>
              <p style={{ margin: 0, fontWeight: 700 }}>{fact.priceLabel}</p>
              <p style={{ margin: '0.35rem 0 0' }}>
                {en ? 'Platform fee' : 'Platformfee'}: {fact.commissionPercent}%
              </p>
              <p style={{ margin: '0.5rem 0 0', lineHeight: 1.45 }}>{fact.sponsored}</p>
              <p style={{ margin: '0.5rem 0 0', lineHeight: 1.45 }}>{fact.who}</p>
              {reward ? (
                <p style={{ margin: '0.5rem 0 0', lineHeight: 1.45 }}>
                  {en ? 'Direct affiliate, per paid invoice' : 'Directe affiliate, per betaalde factuur'}:{' '}
                  {formatPlanEuros(reward.directCents)}.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <div className="hc-plan-note" style={{ lineHeight: 1.5, color: '#44403c' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#243044' }}>
          {en ? 'Sponsored visibility' : 'Gesponsorde zichtbaarheid'}
        </h2>
        <p>
          {en
            ? 'Basic can be chosen for a relevant sponsored recommendation. Pro has more distribution opportunities than Basic. Premium has the highest distribution priority. None of this is a promised number of views. If nobody is looking for that offer, nothing is inserted.'
            : 'Basic kan worden gekozen voor een relevante gesponsorde aanbeveling. Pro heeft meer distributiekansen dan Basic. Premium heeft de hoogste distributieprioriteit. Geen van deze plannen belooft een aantal vertoningen. Zoekt niemand naar dat aanbod, dan wordt er niets tussengevoegd.'}
        </p>
        {basicOffset ? (
          <p>
            {en
              ? `Basic is ${formatPlanEuros(basic.monthlyPriceCents)} per month at ${basic.feePercent}% instead of ${individual.feePercent}%. That monthly amount matches the fee difference on about ${formatPlanEuros(basicOffset)} of HomeCheff checkout sales. This is not a forecast of profit or customers. This page does not add a separate VAT figure; the catalog stores the plan price only.`
              : `Basic kost ${formatPlanEuros(basic.monthlyPriceCents)} per maand bij ${basic.feePercent}% in plaats van ${individual.feePercent}%. Dat maandbedrag is even groot als het feeverschil op ongeveer ${formatPlanEuros(basicOffset)} afrekenomzet via HomeCheff. Dit is geen voorspelling van winst of klanten. Deze pagina zet er geen apart btw-bedrag bij. Het overzicht bewaart de planprijs.`}
          </p>
        ) : null}
        {variant === 'plans' ? (
          <p>
            <Link href="/affiliate" className="hc-plan-cta">
              {en ? 'Explain this as an affiliate' : 'Leg dit uit als affiliate'}
            </Link>
          </p>
        ) : (
          <p>
            <Link href="/sell" className="hc-plan-cta">
              {en ? 'View the business plans' : 'Bekijk de bedrijfsabonnementen'}
            </Link>
          </p>
        )}
        {variant === 'affiliate' ? (
          <ul>
            {rewards.map((row) => (
              <li key={row.plan}>
                {NAMES[row.plan]}: {en ? 'business pays' : 'bedrijf betaalt'} {formatPlanEuros(row.priceCents)}. {' '}
                {en ? 'Direct affiliate' : 'Directe affiliate'} {formatPlanEuros(row.directCents)}. {' '}
                {en ? 'Partner' : 'Partner'} {formatPlanEuros(row.partnerCents)}. MAIN {formatPlanEuros(row.mainCents)}.
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {variant === 'plans' ? (
        <div className="hc-plan-faq">
          <h2 style={{ fontSize: '1.15rem', color: '#243044' }}>{en ? 'Questions' : 'Vragen'}</h2>
          {faq.map((item) => (
            <details key={item.question}>
              <summary style={{ cursor: 'pointer', fontWeight: 650 }}>{item.question}</summary>
              <p style={{ margin: '0.4rem 0 0', lineHeight: 1.5 }}>{item.answer}</p>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
