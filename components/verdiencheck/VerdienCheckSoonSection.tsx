import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import VerdienCheckActionCard from './VerdienCheckActionCard';

export default function VerdienCheckSoonSection(props: {
  cards: PersonalRouteCard[];
  plain?: boolean;
}) {
  if (props.cards.length === 0) return null;
  const list = (
    <div className="space-y-3">
      {props.cards.map((card) => (
        <VerdienCheckActionCard key={card.id} card={card} compact />
      ))}
    </div>
  );
  if (props.plain) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-stone-600">{PERSONAL_ROUTE_COPY.soonSection}</h3>
        {list}
      </section>
    );
  }
  return (
    <details className="rounded-2xl border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-medium text-stone-800">
        {PERSONAL_ROUTE_COPY.soonSection}
      </summary>
      <div className="mt-3">{list}</div>
    </details>
  );
}
