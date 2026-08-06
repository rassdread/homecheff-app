/**
 * Phase 2.2G — Off-page authority readiness (no fake mentions or wiki stubs).
 * Phase 2.4 — Social / press / citation / KG readiness without fabricating profiles.
 */

import {
  ENTITY_CONTACT,
  ENTITY_NODES,
  ENTITY_PENDING_SAME_AS,
  ENTITY_VERIFIED_SAME_AS,
} from './entity-graph';
import { LOCAL_NAP } from './local-authority-readiness';

export type OffPageTrack =
  | 'press_media'
  | 'linkedin_company'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'wikipedia'
  | 'wikidata'
  | 'brand_mentions'
  | 'citations'
  | 'business_citations'
  | 'creator_outreach'
  | 'community_partnerships'
  | 'knowledge_graph';

export type OffPageStatus = 'ready' | 'partial' | 'blocked' | 'not_started';

export const OFF_PAGE_READINESS: Array<{
  track: OffPageTrack;
  status: OffPageStatus;
  checklist: string[];
}> = [
  {
    track: 'press_media',
    status: 'ready',
    checklist: [
      `Press email live: ${ENTITY_CONTACT.press}`,
      'Public About (/over-ons), Manifest, Constitution, Trust',
      'Legal operator + KvK verifiable',
      'Do not send fabricated traction metrics',
      'Use entity philosophy + canonical description from Phase 2.1–2.3',
    ],
  },
  {
    track: 'linkedin_company',
    status: 'not_started',
    checklist: [
      'Create official LinkedIn Company page only with correct spelling HomeCheff',
      'Use verified operator facts (Arrias Beheer B.V., Vlaardingen) — no invented employee counts',
      'Add URL to PENDING_SAME_AS → VERIFIED_SAME_AS only after public confirmation',
      'Do not invent a LinkedIn URL in JSON-LD before the page exists',
    ],
  },
  {
    track: 'instagram',
    status: 'not_started',
    checklist: [
      'Official Instagram handle must match brand spelling HomeCheff when created',
      'No fake follower counts or purchased engagement',
      'Pending until URL is confirmed in organization-identity',
    ],
  },
  {
    track: 'facebook',
    status: 'not_started',
    checklist: [
      'Official Facebook Page only when operator publishes it',
      'Same NAP honesty — no fabricated street address',
      'Do not add sameAs until URL is verified',
    ],
  },
  {
    track: 'youtube',
    status: 'not_started',
    checklist: [
      'Optional official YouTube channel with HomeCheff spelling',
      'No purchased views or fabricated subscriber counts',
      'Add sameAs only after public confirmation',
    ],
  },
  {
    track: 'tiktok',
    status: 'not_started',
    checklist: [
      'Optional official TikTok — authentic craftsmanship/neighbourhood content only',
      'No fake engagement',
      'Pending until URL verified',
    ],
  },
  {
    track: 'wikipedia',
    status: 'blocked',
    checklist: [
      'Notability not yet established via independent reliable secondary sources',
      'Do NOT create a promotional Wikipedia article',
      'First earn independent press; then follow Wikipedia notability guidelines',
      'Readiness = documentation only — not publication',
    ],
  },
  {
    track: 'wikidata',
    status: 'partial',
    checklist: [
      'Prepare item draft only after independent sources exist',
      `Pending sameAs: ${ENTITY_PENDING_SAME_AS.join('; ')}`,
      `Verified sameAs today: ${ENTITY_VERIFIED_SAME_AS.join(', ')}`,
      'Statements must cite sources — no unsourced founder biography',
      'Readiness for a future item — do not create unsourced stubs',
    ],
  },
  {
    track: 'brand_mentions',
    status: 'not_started',
    checklist: [
      'Prefer organic creator and community mentions over paid link schemes',
      'Track honest mentions; never invent testimonials',
    ],
  },
  {
    track: 'citations',
    status: 'partial',
    checklist: [
      'KvK public registry citation exists',
      'Local directory citations only with honest NAP (city + website; no fake street)',
      `Locality: ${LOCAL_NAP.addressLocality}, ${LOCAL_NAP.addressCountry}`,
    ],
  },
  {
    track: 'business_citations',
    status: 'partial',
    checklist: [
      'KvK is the primary business citation today',
      'Directory listings: website + city + KvK only — never invent phone/street',
      'GBP / Apple / Bing Places remain blocked until real NAP exists (see local-authority-readiness)',
    ],
  },
  {
    track: 'creator_outreach',
    status: 'partial',
    checklist: [
      'Outreach must match product truth (Phase 13O)',
      'Invite makers to create value — not to seed fake inventory',
      'Existing OUTREACH_PHASE2 notes are informal; keep non-spammy',
    ],
  },
  {
    track: 'community_partnerships',
    status: 'not_started',
    checklist: [
      'Municipal / neighbourhood partnerships only when real agreements exist',
      'Do not claim Vlaardingen partnership until a public page exists',
      `Operator city: ${ENTITY_NODES.operator.locality}`,
    ],
  },
  {
    track: 'knowledge_graph',
    status: 'partial',
    checklist: [
      'On-site entity graph + Organization JSON-LD prepared',
      'No Knowledge Panel ownership claim in this repo',
      'Wikidata/Wikipedia blocked until independent sources',
      'Monitor panel appearance after brand search grows — do not spoof',
    ],
  },
];

export function offPageBrief(): string {
  return OFF_PAGE_READINESS.map(
    (t) => `${t.track}: ${t.status}\n  - ${t.checklist.join('\n  - ')}`,
  ).join('\n');
}
