import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import VerdienCheckActionCard from './VerdienCheckActionCard';

export default function VerdienCheckNowSection(props: {
  cards: PersonalRouteCard[];
}) {
  if (props.cards.length === 0) return null;
  return (
    <section className="space-y-3">
      {props.cards.map((card) => (
        <VerdienCheckActionCard key={card.id} card={card} />
      ))}
    </section>
  );
}
