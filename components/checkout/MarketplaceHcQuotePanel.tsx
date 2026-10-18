'use client';

type Props = {
  quote: {
    totalAvailableHc: number;
    eligibleHc: number;
    orderAmountCents?: number;
    maxHcApplicable?: number;
    remainingEurCents?: number;
    marketplaceHcEnabled?: boolean;
    hcPaymentActionable?: boolean;
    userMessageNl?: string;
    userMessageEn?: string;
    reasonCode?: string;
  } | null;
  loading?: boolean;
  locale?: 'nl' | 'en';
};

function fmtHc(n: number) {
  return n.toLocaleString('nl-NL');
}

function fmtEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

/**
 * Read-only HC block for HomeCheff checkout — no actionable payment toggle this phase.
 */
export function MarketplaceHcQuotePanel({ quote, loading, locale = 'nl' }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500 mb-4">
        {locale === 'nl' ? 'HC-tegoed laden…' : 'Loading HC balance…'}
      </div>
    );
  }

  if (!quote) return null;

  const featureOff = !quote.marketplaceHcEnabled;
  const noEligible = quote.marketplaceHcEnabled && quote.eligibleHc === 0 && quote.totalAvailableHc > 0;
  const hasEligible = quote.marketplaceHcEnabled && quote.eligibleHc > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{locale === 'nl' ? 'HC-tegoed' : 'HC balance'}</span>
        <span className="font-semibold text-gray-900">{fmtHc(quote.totalAvailableHc)} HC</span>
      </div>

      {(noEligible || hasEligible) && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {locale === 'nl' ? 'Bruikbaar voor deze bestelling' : 'Usable for this order'}
          </span>
          <span className="font-semibold text-gray-900">{fmtHc(quote.eligibleHc)} HC</span>
        </div>
      )}

      {featureOff && (
        <p className="text-xs text-gray-600">
          {quote.userMessageNl ?? (locale === 'nl'
            ? 'HC betalen op HomeCheff is nog niet beschikbaar.'
            : 'Paying with HC on HomeCheff is not available yet.')}
        </p>
      )}

      {noEligible && (
        <p className="text-xs text-amber-700">
          {locale === 'nl'
            ? 'Je ziet je totale HC-tegoed, maar dit is niet bruikbaar voor deze bestelling.'
            : 'You see your total HC, but it cannot fund this order.'}
        </p>
      )}

      {hasEligible && quote.maxHcApplicable != null && quote.remainingEurCents != null && quote.remainingEurCents > 0 && (
        <p className="text-xs text-gray-500">
          {locale === 'nl' ? 'Voorbeeld (nog niet actief): ' : 'Preview (not active): '}
          {fmtHc(quote.maxHcApplicable ?? 0)} HC + {fmtEur(quote.remainingEurCents)}
        </p>
      )}
    </div>
  );
}
