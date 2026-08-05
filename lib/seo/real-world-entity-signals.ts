/**
 * Phase 2.5 — Real-world entity signal inventory (prepare only).
 * Inventory genuine external channels. Do NOT fabricate profiles, citations,
 * partnerships, awards, backlinks or notability.
 */

import { ENTITY_CONTACT, ENTITY_PENDING_SAME_AS, ENTITY_VERIFIED_SAME_AS } from './entity-graph';
import { LOCAL_CITATION_CHANNELS, LOCAL_NAP } from './local-authority-readiness';
import { OFFICIAL_BRAND_REFERENCES } from './brand-entity';

export type RealWorldSignalStatus =
  | 'ready'
  | 'planned'
  | 'not_applicable'
  | 'blocked'
  | 'verified_public';

export type RealWorldSignal = {
  id: string;
  channel: string;
  status: RealWorldSignalStatus;
  note: string;
};

/** Official brand / social / registry channels — inventory only. */
export const REAL_WORLD_BRAND_SIGNALS: RealWorldSignal[] = [
  {
    id: 'linkedin_company',
    channel: 'Official LinkedIn Company Page',
    status: 'planned',
    note: 'Not created in-repo. When published: spelling HomeCheff, operator facts only; then move URL to verified sameAs.',
  },
  {
    id: 'instagram',
    channel: 'Official Instagram',
    status: 'planned',
    note: 'No verified URL. Do not invent handle or follower counts.',
  },
  {
    id: 'facebook',
    channel: 'Official Facebook',
    status: 'planned',
    note: 'No verified Page URL. NAP honesty required (no fake street).',
  },
  {
    id: 'youtube',
    channel: 'Official YouTube',
    status: 'planned',
    note: 'Optional brand channel later. No fabricated channel or view counts.',
  },
  {
    id: 'tiktok',
    channel: 'Official TikTok',
    status: 'planned',
    note: 'Optional. Only if operator publishes a real branded account.',
  },
  {
    id: 'github',
    channel: 'Official GitHub',
    status: 'not_applicable',
    note: 'HomeCheff is a product brand, not an open-source org claim. App repo may exist privately/publicly without being a brand sameAs unless explicitly branded and verified.',
  },
  {
    id: 'google_business_profile',
    channel: 'Google Business Profile',
    status: 'blocked',
    note: LOCAL_CITATION_CHANNELS.find((c) => c.channel === 'google_business_profile')?.guidance ??
      'Blocked until real NAP exists — no fabricated street/phone.',
  },
  {
    id: 'apple_business_connect',
    channel: 'Apple Business Connect',
    status: 'blocked',
    note: 'Same NAP honesty as GBP — no invented pin or phone.',
  },
  {
    id: 'bing_places',
    channel: 'Bing Places',
    status: 'blocked',
    note: LOCAL_CITATION_CHANNELS.find((c) => c.channel === 'bing_places')?.guidance ??
      'Prepare brand + locality + website + KvK; wait for verified address/phone if required.',
  },
  {
    id: 'kvk',
    channel: 'KvK (Dutch Chamber of Commerce)',
    status: 'verified_public',
    note: `KvK ${OFFICIAL_BRAND_REFERENCES.kvk} for ${OFFICIAL_BRAND_REFERENCES.operator} — already in Organization sameAs.`,
  },
  {
    id: 'press',
    channel: 'Press readiness',
    status: 'ready',
    note: `Press inbox ${ENTITY_CONTACT.press}; About/Manifest/Trust/Constitution live. No fabricated traction.`,
  },
  {
    id: 'media',
    channel: 'Media readiness',
    status: 'ready',
    note: 'Public entity pages and machine briefs ready for journalists. No invented press logos.',
  },
  {
    id: 'podcasts',
    channel: 'Podcasts',
    status: 'planned',
    note: 'Future appearances only when real. Do not invent episode credits.',
  },
  {
    id: 'interviews',
    channel: 'Interviews',
    status: 'planned',
    note: 'Operator/founder interviews when scheduled — no fabricated quotes.',
  },
  {
    id: 'local_newspapers',
    channel: 'Local newspapers',
    status: 'planned',
    note: `Local angle: ${LOCAL_NAP.addressLocality}. Earn coverage; do not invent articles.`,
  },
  {
    id: 'municipal_initiatives',
    channel: 'Municipal initiatives',
    status: 'blocked',
    note: 'Do not claim Vlaardingen partnership until a public agreement page exists.',
  },
  {
    id: 'business_associations',
    channel: 'Business associations',
    status: 'planned',
    note: 'Join/mention only with real membership — no invented associations.',
  },
  {
    id: 'partner_organisations',
    channel: 'Partner organisations',
    status: 'planned',
    note: 'Partner stories only after real agreements. Never invent partners.',
  },
  {
    id: 'educational_institutions',
    channel: 'Educational institutions',
    status: 'planned',
    note: 'Guest lectures / student projects only when real.',
  },
  {
    id: 'innovation_programmes',
    channel: 'Innovation programmes',
    status: 'planned',
    note: 'Document only after acceptance/participation is public.',
  },
  {
    id: 'incubators',
    channel: 'Incubators',
    status: 'planned',
    note: 'No incubator affiliation claimed today.',
  },
  {
    id: 'awards',
    channel: 'Awards',
    status: 'planned',
    note: 'Do not invent awards. List only after official public announcement.',
  },
  {
    id: 'public_presentations',
    channel: 'Public presentations',
    status: 'planned',
    note: 'Talks/demos when delivered — keep slides consistent with canonical entity.',
  },
  {
    id: 'conference_appearances',
    channel: 'Conference appearances',
    status: 'planned',
    note: 'No fabricated speaker listings.',
  },
];

export function realWorldSignalsBrief(): string {
  const byStatus = REAL_WORLD_BRAND_SIGNALS.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  return [
    `signals_total: ${REAL_WORLD_BRAND_SIGNALS.length}`,
    `by_status: ${Object.entries(byStatus)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`,
    `verified_sameAs: ${ENTITY_VERIFIED_SAME_AS.join(', ')}`,
    `pending_sameAs: ${ENTITY_PENDING_SAME_AS.join('; ')}`,
    'rule: inventory + readiness only — never fabricate profiles, backlinks, citations or awards',
    ...REAL_WORLD_BRAND_SIGNALS.map((s) => `${s.id}: ${s.status} — ${s.channel}`),
  ].join('\n');
}
