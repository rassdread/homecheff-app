import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '@/lib/analytics/verdiencheck-funnel';
import VerdienCheckActionCard from './VerdienCheckActionCard';

export default function VerdienCheckLaterSection(props: {
  cards: PersonalRouteCard[];
  restDetails: PersonalRouteCard[];
  plain?: boolean;
}) {
  const extra = [...props.cards, ...props.restDetails];
  if (extra.length === 0) return null;
  const list = (
    <div className="space-y-3">
      {extra.map((card) => (
        <VerdienCheckActionCard key={card.id} card={card} compact />
      ))}
    </div>
  );
  if (props.plain) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-stone-600">{PERSONAL_ROUTE_COPY.laterSection}</h3>
        {list}
      </section>
    );
  }
  return (
    <details
      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) {
          trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.detailsOpened);
        }
      }}
    >
      <summary className="cursor-pointer text-sm font-medium text-stone-800">
        {PERSONAL_ROUTE_COPY.laterSection}
      </summary>
      <div className="mt-3">{list}</div>
    </details>
  );
}
