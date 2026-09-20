import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '@/lib/analytics/verdiencheck-funnel';
import VerdienCheckSourceDetails from './VerdienCheckSourceDetails';

export default function VerdienCheckActionCard(props: {
  card: PersonalRouteCard;
  compact?: boolean;
}) {
  const { card, compact } = props;
  return (
    <article
      className={`rounded-2xl border bg-white p-4 ${
        card.severity === 'ACTION'
          ? 'border-stone-300'
          : 'border-stone-200'
      }`}
    >
      <h3 className="text-base font-semibold text-stone-900">{card.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">{card.body}</p>
      {card.cta?.href ? (
        <a
          href={card.cta.href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-emerald-800 underline"
          onClick={() =>
            trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.officialLinkClicked, {
              action: 'LEARN_MORE',
            })
          }
        >
          {card.cta.label}
        </a>
      ) : null}
      {!compact && (card.officialSource || card.officialSourceUrl) ? (
        <VerdienCheckSourceDetails
          source={card.officialSource}
          url={card.officialSourceUrl}
        />
      ) : null}
    </article>
  );
}
