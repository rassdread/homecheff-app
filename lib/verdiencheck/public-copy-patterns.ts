/**
 * Forbidden public compliance myths. Match user-facing copy, not fixtures or
 * certified DAC7 goods-exclusion wording that is explicitly not a tax-free floor.
 */

export type PublicCopyHit = {
  file: string;
  patternId: string;
  excerpt: string;
};

export const FORBIDDEN_PUBLIC_COPY_PATTERNS: ReadonlyArray<{
  id: string;
  re: RegExp;
}> = [
  {
    id: 'vat_from_20000',
    re: /(?:vanaf\s*€?\s*20[.\s]?000[^\n]{0,48}btw|btw[^\n]{0,48}vanaf\s*€?\s*20[.\s]?000|btw-plichtig vanaf\s*€?\s*20[.\s]?000|vat-liable from\s*€?\s*20[,\s]?000)/i,
  },
  {
    id: 'tax_free_until_20000',
    re: /(?:tot\s*€?\s*20[.\s]?000[^\n]{0,40}belastingvrij|belastingvrij[^\n]{0,40}€?\s*20[.\s]?000|tax[ -]?free[^\n]{0,40}€?\s*20[,.\s]?000)/i,
  },
  {
    id: 'kvk_or_tax_free_2200',
    re: /(?:vanaf\s*)?€?\s*2[.\s]?200[^\n]{0,24}(?:belastingvrij|KVK-grens)|(?:belastingvrij|KVK-grens)[^\n]{0,24}€?\s*2[.\s]?200/i,
  },
  {
    id: 'dac7_as_tax_30',
    re: /30 transacties[^\n]{0,40}belasting(?!dienst)|30 transactions[^\n]{0,40}tax(?! authorities)/i,
  },
  {
    id: 'tax_free_2000',
    re: /€?\s*2[.\s]?000[^\n]{0,40}belastingvrij|belastingvrij[^\n]{0,40}€?\s*2[.\s]?000|€?\s*2[,.\s]?000[^\n]{0,40}tax[ -]?free/i,
  },
  {
    id: 'wajong_70',
    re: /Wajong:?\s*70\s*%/i,
  },
  {
    id: 'portions_1_to_5',
    re: /1\s*[-–]\s*5\s*(?:porties|portions)/i,
  },
  {
    id: 'haccp_certificate_required',
    re: /HACCP-certificaat verplicht|HACCP certificate (?:is )?required/i,
  },
];

export const PUBLIC_COPY_SCAN_SKIP =
  /(?:from-vercel|\/docs\/|\/scripts\/|node_modules|\.md$|test-verdiencheck|validate-verdiencheck|public-copy-patterns)/i;

export function findForbiddenPublicCopy(file: string, text: string): PublicCopyHit[] {
  if (PUBLIC_COPY_SCAN_SKIP.test(file.replaceAll('\\', '/'))) return [];
  const hits: PublicCopyHit[] = [];
  for (const { id, re } of FORBIDDEN_PUBLIC_COPY_PATTERNS) {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
    const global = new RegExp(re.source, flags);
    let match: RegExpExecArray | null;
    while ((match = global.exec(text))) {
      const start = Math.max(0, match.index - 40);
      const excerpt = text.slice(start, match.index + match[0].length + 40).replace(/\s+/g, ' ');
      hits.push({ file, patternId: id, excerpt });
      if (match[0].length === 0) global.lastIndex += 1;
    }
  }
  return hits;
}
