type Hint = { nl: string; en: string };

export function ListingQualityCard({
  score,
  bandNl,
  bandEn,
  hints,
  summaryNl,
  summaryEn,
  language = "nl",
}: {
  score: number;
  bandNl: string;
  bandEn: string;
  hints: Hint[];
  summaryNl: string;
  summaryEn: string;
  language?: string;
}) {
  const en = language === "en";
  const band = en ? bandEn : bandNl;
  const summary = en ? summaryEn : summaryNl;
  return (
    <section className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-gray-800">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
        {en ? "Listing quality" : "Listingkwaliteit"}
      </p>
      <p className="mt-1 text-lg font-semibold text-gray-900">
        {score}/100 — {band}
      </p>
      <p className="mt-2 leading-relaxed">{summary}</p>
      {hints.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
          {hints.slice(0, 4).map((hint) => (
            <li key={hint.nl}>{en ? hint.en : hint.nl}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
