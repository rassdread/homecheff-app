'use client';

import { useMemo, useState } from 'react';
import { buildAffiliateCommissionCatalog, type CatalogRow } from '@/lib/affiliate/commission-catalog';
import {
  calculatorFocusForFit,
  type NetworkFitId,
} from '@/lib/affiliate/network-fit';
import type { PortfolioFocus } from '@/lib/affiliate/goal-scenarios';

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const CHIPS: { id: NetworkFitId; nl: string; en: string; network?: boolean }[] = [
  { id: 'buyers', nl: 'Ik ken vooral kopers', en: 'I mainly know buyers' },
  { id: 'makers', nl: 'Ik ken makers of verkopers', en: 'I know makers or sellers' },
  { id: 'business', nl: 'Ik ken ondernemers of bedrijven', en: 'I know businesses' },
  { id: 'creators', nl: 'Ik ken creators', en: 'I know creators' },
  { id: 'partners', nl: 'Ik ken mensen met een eigen netwerk', en: 'I know people with their own network', network: true },
  { id: 'mixed', nl: 'Ik ken van alles wat', en: 'I know a bit of everything' },
];

type ResultKind = 'buyers' | 'makers' | 'business' | 'creators' | 'partners' | 'mixed';

function resultKind(ids: NetworkFitId[]): ResultKind | null {
  if (ids.length === 0) return null;
  if (ids.includes('mixed')) return 'mixed';
  const product = ids.filter((id) => id === 'makers' || id === 'business' || id === 'creators');
  if (product.length > 1 || (ids.includes('buyers') && product.length > 0)) return 'mixed';
  if (ids.includes('business')) return 'business';
  if (ids.includes('creators')) return 'creators';
  if (ids.includes('makers')) return 'makers';
  if (ids.includes('buyers')) return 'buyers';
  if (ids.includes('partners')) return 'partners';
  return null;
}

function previewType(row: CatalogRow, en: boolean): string {
  if (row.kind === 'transaction') return en ? 'example, per qualifying transaction' : 'voorbeeld, per kwalificerende transactie';
  if (row.kind === 'purchase') return en ? 'per qualifying purchase' : 'per kwalificerende aankoop';
  return en ? 'per qualifying billing period' : 'per kwalificerende betaalperiode';
}

export default function AffiliateNetworkFit({
  lang,
  showNetwork = true,
  onExplore,
}: {
  lang: 'nl' | 'en';
  showNetwork?: boolean;
  onExplore: (focus: PortfolioFocus | null) => void;
}) {
  const en = lang === 'en';
  const [selected, setSelected] = useState<NetworkFitId[]>([]);
  const catalog = useMemo(() => buildAffiliateCommissionCatalog(), []);
  const byId = useMemo(() => new Map(catalog.map((row) => [row.id, row])), [catalog]);
  const kind = resultKind(selected);

  function toggle(id: NetworkFitId) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function rows(ids: string[]): CatalogRow[] {
    return ids.map((id) => byId.get(id)).filter((row): row is CatalogRow => Boolean(row));
  }

  const previewIds =
    kind === 'buyers'
      ? ['marketplace-buyer']
      : kind === 'makers'
        ? ['marketplace-plan-basic', 'marketplace-plan-pro']
        : kind === 'business'
          ? ['growth-starter', 'growth-pro', 'growth-business']
          : kind === 'creators'
            ? ['studio-creator', 'studio-pro']
            : kind === 'mixed'
              ? ['growth-starter', 'studio-creator', 'marketplace-buyer']
              : [];

  const copy = kind
    ? {
        buyers: {
          body: en
            ? 'Marketplace can be an entry point. Commission can arise on a qualifying order. It does not arise on every purchase by itself.'
            : 'Dan kan de Marketplace een ingang zijn. Commissie kan ontstaan bij een kwalificerende bestelling. Die ontstaat niet vanzelf bij iedere aankoop.',
          cta: en ? 'View the Marketplace examples' : 'Bekijk de Marketplace-voorbeelden',
          focus: null as PortfolioFocus | null,
        },
        makers: {
          body: en
            ? 'Marketplace can be a natural entry point. Think of home cooks, makers, local shops or other sellers. A business subscription and a qualifying order are separate.'
            : 'Dan kan Marketplace een logische ingang zijn. Denk aan thuiskoks, makers, winkels of andere verkopers. Een bedrijfsabonnement en een kwalificerende order zijn twee verschillende dingen.',
          cta: en ? 'See what I could build with Marketplace' : 'Bekijk wat ik met Marketplace kan opbouwen',
          focus: 'marketplace' as PortfolioFocus | null,
        },
        business: {
          body: en
            ? 'Growth can be a good entry point. If you know companies looking for new customers, a qualifying subscription through you can create recurring commission.'
            : 'Dan kan Growth een goede ingang zijn. Ken je bedrijven die nieuwe klanten zoeken? Als een klant via jou een kwalificerend abonnement afsluit, kan daar terugkerende commissie uit ontstaan.',
          cta: en ? 'See what I could build with Growth' : 'Bekijk wat ik met Growth kan opbouwen',
          focus: 'growth' as PortfolioFocus | null,
        },
        creators: {
          body: en
            ? 'Know people who make content, images or video? Studio can fit that network. Commission follows qualifying Studio use, not an assumption that everyone subscribes.'
            : 'Ken je mensen die content, beelden of video’s maken? Dan kan Studio bij jouw netwerk passen. Commissie volgt kwalificerend Studio-gebruik. Niet iedereen neemt vanzelf een abonnement.',
          cta: en ? 'See what I could build with Studio' : 'Bekijk wat ik met Studio kan opbouwen',
          focus: 'studio' as PortfolioFocus | null,
        },
        partners: {
          body: en
            ? 'The partner network is a later step, not the starting point. Most affiliates begin with their own customers.'
            : 'Het partnernetwerk is een volgende stap, niet het startpunt. De meeste affiliates beginnen met hun eigen klanten.',
          cta: en ? 'See how the partner network works' : 'Bekijk hoe het partnernetwerk werkt',
          focus: null as PortfolioFocus | null,
        },
        mixed: {
          body: en
            ? 'Your network can fit more than one HomeCheff service. This is an orientation, not a promise that those contacts will buy.'
            : 'Jouw netwerk past bij meerdere HomeCheff-diensten. Dit is een oriëntatie, geen belofte dat die contacten ook afnemen.',
          cta: en ? 'View my options' : 'Bekijk mijn mogelijkheden',
          focus: 'multi' as PortfolioFocus | null,
        },
      }[kind]
    : null;

  return (
    <section aria-labelledby="affiliate-network-fit">
      <h2 id="affiliate-network-fit" className="text-xl font-semibold text-slate-900">
        {en ? 'Who do you already know?' : 'Wie ken jij?'}
      </h2>
      <p className="mt-2 text-sm font-semibold text-emerald-900">
        {en ? 'Start with the people you already know.' : 'Begin bij wie je al kent.'}
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-700">
        {en
          ? 'Everyone has a different network. Choose what fits you and see where your contacts can connect with HomeCheff.'
          : 'Iedereen heeft een ander netwerk. Kies wat het beste bij jou past en ontdek waar jouw contacten binnen HomeCheff kunnen aansluiten.'}
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
        {en
          ? 'You do not need one kind of network. Almost every network has an entry point in the HomeCheff ecosystem, whether you mainly know consumers, businesses, makers or creators.'
          : 'Je hoeft niet één type netwerk te hebben. Bijna ieder netwerk heeft wel een ingang bij HomeCheff, of je nu vooral consumenten, ondernemers, makers of creators kent.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={en ? 'Your network' : 'Jouw netwerk'}>
        {CHIPS.filter((chip) => showNetwork || !chip.network).map((chip) => {
          const on = selected.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(chip.id)}
              className={
                on
                  ? 'min-h-11 rounded-full border border-emerald-700 bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-950'
                  : 'min-h-11 rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800'
              }
            >
              {en ? chip.en : chip.nl}
            </button>
          );
        })}
      </div>
      {copy ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm leading-relaxed text-slate-700">{copy.body}</p>
          {selected.includes('partners') && kind !== 'partners' && showNetwork ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {en
                ? 'People with their own network are a later step. You can look at that separately. It is not required.'
                : 'Mensen met een eigen netwerk zijn een volgende stap. Dat kun je apart bekijken. Het is niet nodig om te starten.'}
            </p>
          ) : null}
          {previewIds.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {rows(previewIds).map((row) => (
                <li key={row.id} className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{row.product}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{eur(row.affiliateCents)}</p>
                  <p className="text-xs text-slate-600">{previewType(row, en)}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3">
            <button
              type="button"
              className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
              onClick={() => {
                const focus = calculatorFocusForFit(selected);
                onExplore(copy.focus ?? focus);
                const target = kind === 'partners' ? 'affiliate-network' : kind === 'buyers' ? 'commissies' : 'affiliate-portfolio';
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {copy.cta}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
