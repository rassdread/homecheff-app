/**
 * Phase 2.2G — Off-page authority readiness (no fake mentions or wiki stubs).
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
  | 'wikipedia'
  | 'wikidata'
  | 'brand_mentions'
  | 'citations'
  | 'creator_outreach'
  | 'community_partnerships';

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
      'Use entity philosophy one-pager from Phase 2.1',
    ],
  },
  {
    track: 'wikipedia',
    status: 'blocked',
    checklist: [
      'Notability not yet established via independent reliable secondary sources',
      'Do NOT create a promotional Wikipedia article',
      'First earn independent press; then follow Wikipedia notability guidelines',
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
];

export function offPageBrief(): string {
  return OFF_PAGE_READINESS.map(
    (t) => `${t.track}: ${t.status}\n  - ${t.checklist.join('\n  - ')}`,
  ).join('\n');
}
