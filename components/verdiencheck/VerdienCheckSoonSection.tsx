import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import VerdienCheckActionCard from './VerdienCheckActionCard';

export default function VerdienCheckSoonSection(props: {
  cards: PersonalRouteCard[];
}) {
  if (props.cards.length === 0) return null;
  return (
    <details className="rounded-2xl border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-medium text-stone-800">
        {PERSONAL_ROUTE_COPY.soonSection}
      </summary>
      <div className="mt-3 space-y-3">
        {props.cards.map((card) => (
          <VerdienCheckActionCard key={card.id} card={card} compact />
        ))}
      </div>
    </details>
  );
}
