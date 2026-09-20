import type { PersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';

export default function VerdienCheckResultSummary(props: {
  route: PersonalVerdienRoute;
}) {
  const { route } = props;
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{route.headline}</h2>
      <p className="mt-2 text-base leading-relaxed text-stone-600">{route.summary}</p>
      <p className="mt-3 text-lg font-medium text-emerald-900">{route.canStartMessage}</p>
    </section>
  );
}
