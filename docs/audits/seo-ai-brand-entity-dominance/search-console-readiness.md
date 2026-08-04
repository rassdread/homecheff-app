/**
 * Phase 2.3 — Search Console / Bing Webmaster / brand-monitoring readiness.
 * Prepare only — do not fabricate property ownership or verification codes.
 */

import { OFFICIAL_BRAND_REFERENCES, BRANDED_SEARCH_PHRASES } from './brand-entity';
import { ENTITY_CONTACT } from './entity-graph';

export type SearchPropertyStatus = 'prepared' | 'pending_operator' | 'not_claimed';

export const GOOGLE_SEARCH_CONSOLE_READINESS = {
  status: 'prepared' as SearchPropertyStatus,
  recommendedProperties: [
    OFFICIAL_BRAND_REFERENCES.website,
    OFFICIAL_BRAND_REFERENCES.websiteAlt,
  ],
  checklist: [
    'Operator verifies domain ownership in Google Search Console (DNS or HTML) — not automated here',
    'Submit https://homecheff.eu/sitemap.xml after verification',
    'Monitor Coverage / Page indexing for public SEO landings only',
    'Use Rich Results / Enhancement reports for Organization + FAQ where eligible',
    'Brand queries to watch: ' + BRANDED_SEARCH_PHRASES.slice(0, 6).join(', '),
    'Do not claim Knowledge Panel ownership until Google shows an editable panel',
  ],
  contacts: {
    support: ENTITY_CONTACT.support,
    press: ENTITY_CONTACT.press,
  },
} as const;

export const BING_WEBMASTER_READINESS = {
  status: 'prepared' as SearchPropertyStatus,
  recommendedProperties: [
    OFFICIAL_BRAND_REFERENCES.website,
    OFFICIAL_BRAND_REFERENCES.websiteAlt,
  ],
  checklist: [
    'Operator adds site in Bing Webmaster Tools and verifies ownership',
    'Import Search Console verification if available, or use DNS/meta',
    'Submit sitemap https://homecheff.eu/sitemap.xml',
    'Enable IndexNow only if the operator chooses an approved integration later',
    'Monitor brand queries separately from generic “home chef” noise',
  ],
} as const;

export const BRAND_MONITORING_READINESS = {
  status: 'prepared' as const,
  tracks: [
    'Exact brand: HomeCheff / HomeCheff.eu',
    'Ambiguity noise: unaffiliated “Home Chef” (do not bid/compete — monitor only)',
    'Structured data: Organization @id https://homecheff.eu/#organization',
    'Machine files: /llms.txt and /ai.txt freshness',
    'Entity surfaces: /wat-is-homecheff, /over-ons, /manifest, /trust',
  ],
  rule: 'Prepared infrastructure and checklists only — no fabricated ownership, tokens or verified badges.',
} as const;


(See TypeScript SSOT for full checklists.)
