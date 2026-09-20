import Link from 'next/link';
import { isVerdienCheckPublicCtaEnabled } from '@/lib/verdiencheck/flags';

type Variant = 'faq' | 'seller' | 'hub' | 'home';

const COPY: Record<
  Variant,
  { title: string; body: string; cta: string }
> = {
  home: {
    title: 'Wil je iets verkopen maar weet je niet wat dat betekent voor belasting, toeslagen of regels?',
    body: 'Je hoeft niet eerst alles over ondernemen te weten. Begin met wat je kunt. Bekijk vooraf wat voor jou belangrijk is.',
    cta: 'Doe de VerdienCheck',
  },
  faq: {
    title: 'Onzeker over belasting, toeslagen of regels?',
    body: 'HomeCheff helpt je de volgende stap te zien. Geen algemene drempel, geen belastingadvies.',
    cta: 'Doe de VerdienCheck',
  },
  seller: {
    title: 'Begin met wat je kunt',
    body: 'Je hoeft niet eerst alles over ondernemen te weten. Bekijk vooraf wat voor jouw verkoop relevant is.',
    cta: 'Doe de VerdienCheck',
  },
  hub: {
    title: 'Eerst kijken wat voor jou speelt?',
    body: 'HomeCheff helpt je bij de volgende stap: belasting, toeslagen of voedselregels — alleen wat bij jouw situatie past.',
    cta: 'Doe de VerdienCheck',
  },
};

/**
 * Public VerdienCheck entry. Renders nothing while production flags are off.
 */
export default function VerdienCheckPublicEntry({
  variant = 'faq',
}: {
  variant?: Variant;
}) {
  if (!isVerdienCheckPublicCtaEnabled()) return null;
  const copy = COPY[variant];
  return (
    <aside
      data-verdiencheck-public-entry={variant}
      className="mx-auto mb-6 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 sm:px-6"
    >
      <p className="text-base font-semibold text-emerald-950">{copy.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">{copy.body}</p>
      <Link
        href="/verdiencheck"
        className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
      >
        {copy.cta}
      </Link>
    </aside>
  );
}
