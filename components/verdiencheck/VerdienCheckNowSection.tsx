import type { PersonalRouteCard } from '@/lib/verdiencheck/personal-route';
import VerdienCheckActionCard from './VerdienCheckActionCard';

export default function VerdienCheckNowSection(props: {
  cards: PersonalRouteCard[];
  heading?: string;
}) {
  if (props.cards.length === 0) return null;
  return (
    <section className="space-y-3">
      {props.heading ? (
        <h2 className="text-lg font-semibold text-stone-900">{props.heading}</h2>
      ) : null}
      {props.cards.map((card) => (
        <VerdienCheckActionCard key={card.id} card={card} />
      ))}
    </section>
  );
}
