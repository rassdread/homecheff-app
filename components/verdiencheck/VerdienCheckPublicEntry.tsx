import Link from 'next/link';
import { isVerdienCheckPublicCtaEnabled } from '@/lib/verdiencheck/flags';
import {
  sanitizeVerdienCheckEntryPoint,
  type VerdienCheckEntryPoint,
} from '@/lib/verdiencheck/privacy/analytics-guard';
import { getVerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import VerdienCheckQuickInsight from '@/components/verdiencheck/VerdienCheckQuickInsight';

type Variant = 'faq' | 'seller' | 'hub' | 'home';

const VARIANT_ENTRY: Record<Variant, VerdienCheckEntryPoint> = {
  faq: 'faq',
  seller: 'seller',
  hub: 'direct',
  home: 'direct',
};

const COPY: Record<
  Variant,
  { title: string; body: string; cta: string }
> = {
  home: {
    title: 'Wil je iets bijverdienen?',
    body: 'Ontdek in een paar eenvoudige vragen wat dat voor jou betekent.',
    cta: 'Doe de VerdienCheck',
  },
  faq: {
    title: 'Wil je iets bijverdienen?',
    body: 'Ontdek in een paar eenvoudige vragen wat dat voor jou betekent.',
    cta: 'Doe de VerdienCheck',
  },
  seller: {
    title: 'Kan ik gewoon beginnen?',
    body: 'Beantwoord een paar vragen en zie wat voor jou nu belangrijk is.',
    cta: 'Start de snelle check',
  },
  hub: {
    title: 'Wil je iets bijverdienen?',
    body: 'Ontdek in een paar eenvoudige vragen wat dat voor jou betekent.',
    cta: 'Doe de VerdienCheck',
  },
};

/**
 * Public VerdienCheck entry. Renders nothing while production flags are off.
 */
export default function VerdienCheckPublicEntry({
  variant = 'faq',
  entryPoint,
}: {
  variant?: Variant;
  entryPoint?: VerdienCheckEntryPoint;
}) {
  if (!isVerdienCheckPublicCtaEnabled()) return null;
  const copy = COPY[variant];
  const insight = getVerdienCheckCopy('nl');
  const from = sanitizeVerdienCheckEntryPoint(entryPoint ?? VARIANT_ENTRY[variant]);
  return (
    <aside
      data-verdiencheck-public-entry={variant}
      data-verdiencheck-entry={from}
      className="mx-auto mb-6 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 sm:px-6"
    >
      <p className="text-base font-semibold text-emerald-950">{copy.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">{copy.body}</p>
      <VerdienCheckQuickInsight copy={insight} startHref={`/verdiencheck?from=${from}`} />
      <Link
        href={`/verdiencheck?from=${from}`}
        className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
      >
        {copy.cta}
      </Link>
    </aside>
  );
}
