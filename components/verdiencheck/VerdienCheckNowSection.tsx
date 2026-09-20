import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '@/lib/verdiencheck/personal-route/copy';
import VerdienCheckActionCard from './VerdienCheckActionCard';

export default function VerdienCheckNowSection(props: {
  cards: PersonalRouteCard[];
}) {
  if (props.cards.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        {PERSONAL_ROUTE_COPY.nowSection}
      </h2>
      {props.cards.map((card) => (
        <VerdienCheckActionCard key={card.id} card={card} />
      ))}
    </section>
  );
}
