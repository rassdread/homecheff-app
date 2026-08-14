/**
 * Format a LEGAL-0 ISO calendar date for display.
 * Uses UTC so the calendar day never shifts with server/browser timezone.
 */

export function formatLegalEffectiveDate(
  isoDate: string,
  locale: 'nl' | 'en',
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid legal effective date: ${isoDate}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
