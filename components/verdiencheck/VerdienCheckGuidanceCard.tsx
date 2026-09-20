import type { GuidanceHit } from '@/lib/verdiencheck/guidance/types';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

export default function VerdienCheckGuidanceCard(props: {
  copy: VerdienCheckCopy;
  hits: GuidanceHit[];
  showDevFixtures: boolean;
}) {
  const { copy, hits, showDevFixtures } = props;
  const visible = showDevFixtures
    ? hits
    : hits.filter((h) => !h.rule.developmentFixture);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{copy.guidanceTitle}</h2>
      {visible.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600">{copy.guidanceLater}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {visible.map((hit) => (
            <li key={hit.rule.id}>
              <p className="font-medium text-gray-900">{hit.rule.shortTitle}</p>
              <p className="text-sm text-gray-600">{hit.rule.shortText}</p>
              {hit.rule.cta.href ? (
                <a
                  href={hit.rule.cta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-emerald-800 underline"
                >
                  {hit.rule.cta.label}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
