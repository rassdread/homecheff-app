/**
 * Phase 2.3 — Search Console / Bing Webmaster / brand-monitoring readiness.
 * Phase 2.4 — Knowledge Graph, entity, structured-data and brand-query monitoring prep.
 * Prepare only — do not fabricate property ownership or verification codes.
 */

import { BRAND_SEARCH_MONITORING } from './brand-authority';
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
    'Brand queries to watch: ' + BRANDED_SEARCH_PHRASES.slice(0, 8).join(', '),
    'Do not claim Knowledge Panel ownership until Google shows an editable panel',
    'Entity monitoring: Organization @id https://homecheff.eu/#organization remains stable',
    'Structured data monitoring: watch Enhancement reports; fix only real errors — no spam markup',
    'Brand query reporting: Performance → filter HomeCheff / homecheff.eu separately from “home chef” noise',
    'Knowledge Graph monitoring: watch for panel appearance; do not spoof ownership or invent facts',
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
    'Use URL Inspection / SEO reports for Organization consistency — no fabricated Schema',
    'Copilot / Bing brand recognition depends on crawl + verified site; prepare only here',
  ],
} as const;

export const BRAND_MONITORING_READINESS = {
  status: 'prepared' as const,
  tracks: [
    'Exact brand: HomeCheff / HomeCheff.eu',
    'Recognition queries: Who/What is HomeCheff, marketplace, buurtmarkt, community, craftsmanship',
    'Ambiguity noise: unaffiliated “Home Chef” (do not bid/compete — monitor only)',
    'Structured data: Organization @id https://homecheff.eu/#organization',
    'Machine files: /llms.txt and /ai.txt freshness',
    'Entity surfaces: /wat-is-homecheff, /over-ons, /manifest, /trust, /community-guidelines, /principles',
    'Knowledge Graph: panel / AI Overview appearance — observe, do not fabricate',
  ],
  measurement: BRAND_SEARCH_MONITORING.measurement,
  primaryQueries: BRAND_SEARCH_MONITORING.primaryQueries,
  rule: 'Prepared infrastructure and checklists only — no fabricated ownership, tokens, verified badges or search volumes.',
} as const;

export function searchReadinessBrief(): string {
  return [
    `gsc: ${GOOGLE_SEARCH_CONSOLE_READINESS.status}`,
    `bing: ${BING_WEBMASTER_READINESS.status}`,
    `brand_monitoring: ${BRAND_MONITORING_READINESS.status}`,
    `properties: ${GOOGLE_SEARCH_CONSOLE_READINESS.recommendedProperties.join(', ')}`,
    `primary_brand_queries: ${BRAND_MONITORING_READINESS.primaryQueries.join(', ')}`,
    BRAND_MONITORING_READINESS.rule,
  ].join('\n');
}
