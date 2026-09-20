import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '@/lib/analytics/verdiencheck-funnel';
import VerdienCheckSourceDetails from './VerdienCheckSourceDetails';

function isPrimaryObligation(card: PersonalRouteCard): boolean {
  if (card.family === 'benefit_prestart') return true;
  return card.family === 'food_registration' && card.severity === 'ACTION';
}

export default function VerdienCheckActionCard(props: {
  card: PersonalRouteCard;
  compact?: boolean;
}) {
  const { card, compact } = props;
  const primary = isPrimaryObligation(card);
  const quietBusinessLink =
    !primary &&
    !compact &&
    card.family === 'business_registration' &&
    card.severity === 'ACTION' &&
    Boolean(card.cta?.href);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 ${
        primary ? 'border-emerald-200' : 'border-stone-200'
      }`}
    >
      <h3 className="text-lg font-semibold text-stone-900">{card.title}</h3>
      <p className="mt-1 text-base leading-relaxed text-stone-600">{card.body}</p>
      {primary && card.cta?.href ? (
        <a
          href={card.cta.href}
          target="_blank"
          rel="noreferrer"
          className="relative z-[80] mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-lg font-semibold text-white pointer-events-auto"
          data-verdiencheck-primary-cta="official"
          onClick={() =>
            trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.officialLinkClicked, {
              action: 'LEARN_MORE',
            })
          }
        >
          {card.cta.label}
        </a>
      ) : null}
      {quietBusinessLink ? (
        <a
          href={card.cta?.href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-12 items-center text-base text-emerald-800 underline"
          onClick={() =>
            trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.officialLinkClicked, {
              action: 'LEARN_MORE',
            })
          }
        >
          {card.cta?.label}
        </a>
      ) : null}
      {!compact && primary && (card.officialSource || card.officialSourceUrl) ? (
        <VerdienCheckSourceDetails
          source={card.officialSource}
          url={card.officialSourceUrl}
        />
      ) : null}
    </article>
  );
}
