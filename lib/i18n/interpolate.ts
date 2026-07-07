/**
 * Één veilige i18n-interpolatiehelper (UX-FIN-3A.1).
 *
 * Ondersteunt zowel `{count}` als `{{count}}` placeholders zodat bestaande
 * single-brace keys blijven werken én double-brace keys (bv. trust-cues zoals
 * "{{count}} afgeronde afspraken") correct renderen i.p.v. "{5} ...".
 *
 * Ontbrekende params breken niet: de placeholder blijft dan staan.
 * `0` en lege string worden wél ingevuld (alleen `undefined`/`null` = ontbrekend).
 */
export function interpolateTranslation(
  value: string,
  params?: Record<string, string | number> | null,
): string {
  if (!params) return value;

  const replace = (paramKey: string, match: string): string => {
    const replacement = params[paramKey];
    return replacement === undefined || replacement === null
      ? match
      : String(replacement);
  };

  // Double-brace eerst, zodat `{{x}}` niet halverwege door de single-brace
  // regex tot `{x}` wordt verminkt.
  return value
    .replace(/\{\{(\w+)\}\}/g, (match, paramKey: string) => replace(paramKey, match))
    .replace(/\{(\w+)\}/g, (match, paramKey: string) => replace(paramKey, match));
}
