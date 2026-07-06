/** Compact workshop date label for tile badges and price lines. */
export function formatWorkshopDateCompact(iso: string, locale = 'nl-NL'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
