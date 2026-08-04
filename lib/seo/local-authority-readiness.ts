/**
 * Phase 2.2C — Local authority readiness (honest NAP only).
 * Do NOT fabricate street addresses, phone numbers or listing IDs.
 */

import {
  HOMECHEFF_BRAND_NAME,
  LEGAL_OPERATOR,
  PRESS_EMAIL,
  SUPPORT_EMAIL,
  VERIFIED_SAME_AS,
} from './organization-identity';

/** Verified Name–Area–Presence facts safe for local listings when claimed. */
export const LOCAL_NAP = {
  name: HOMECHEFF_BRAND_NAME,
  legalName: LEGAL_OPERATOR.legalName,
  addressLocality: LEGAL_OPERATOR.locality,
  addressCountry: LEGAL_OPERATOR.addressCountry,
  /** Full street address is NOT published — do not invent one for GBP/Maps. */
  streetAddress: null as string | null,
  phone: null as string | null,
  emailSupport: SUPPORT_EMAIL,
  emailPress: PRESS_EMAIL,
  website: 'https://homecheff.eu',
  websiteAlt: 'https://homecheff.nl',
  kvk: LEGAL_OPERATOR.kvk,
  vat: LEGAL_OPERATOR.vat,
  categoryHint: 'Digital neighbourhood marketplace / Online marketplace (local craft & community)',
} as const;

export type LocalCitationChannel =
  | 'google_business_profile'
  | 'apple_maps'
  | 'bing_places'
  | 'openstreetmap'
  | 'kvk_public'
  | 'local_directories';

export type LocalCitationStatus = 'ready_to_claim' | 'verified_public' | 'blocked_missing_nap' | 'not_applicable';

export const LOCAL_CITATION_CHANNELS: Array<{
  channel: LocalCitationChannel;
  status: LocalCitationStatus;
  guidance: string;
}> = [
  {
    channel: 'google_business_profile',
    status: 'blocked_missing_nap',
    guidance:
      'Do not create a GBP listing with a fabricated street address. Claim only when a real serviceable address or eligible online-business category is confirmed by the operator.',
  },
  {
    channel: 'apple_maps',
    status: 'blocked_missing_nap',
    guidance: 'Same NAP honesty rule as GBP — no invented pin or phone.',
  },
  {
    channel: 'bing_places',
    status: 'blocked_missing_nap',
    guidance: 'Prepare brand + locality + website + KvK; wait for verified address/phone if required.',
  },
  {
    channel: 'openstreetmap',
    status: 'not_applicable',
    guidance:
      'HomeCheff is a digital platform, not a physical shop. Do not add a fake shop node. Optional: note operator city only if OSM community guidelines allow company headquarters without public street.',
  },
  {
    channel: 'kvk_public',
    status: 'verified_public',
    guidance: `KvK ${LEGAL_OPERATOR.kvk} is already in Organization sameAs / legal operator identifier.`,
  },
  {
    channel: 'local_directories',
    status: 'ready_to_claim',
    guidance:
      'Where directories accept website + city + KvK without street: use LOCAL_NAP only. Never invent NAP fields.',
  },
];

export const LOCAL_STRUCTURED_SUPPORT = {
  schemaAddressLocality: true,
  schemaAddressCountry: true,
  schemaStreetAddress: false,
  schemaTelephone: false,
  schemaSameAs: [...VERIFIED_SAME_AS],
  areaServedCountry: 'Netherlands',
  foundingLocationLocality: LEGAL_OPERATOR.locality,
} as const;

export function localAuthorityBrief(): string {
  return [
    `name: ${LOCAL_NAP.name}`,
    `legal: ${LOCAL_NAP.legalName} (KvK ${LOCAL_NAP.kvk})`,
    `locality: ${LOCAL_NAP.addressLocality}, ${LOCAL_NAP.addressCountry}`,
    `street: not published — do not invent`,
    `phone: not published — do not invent`,
    `website: ${LOCAL_NAP.website}`,
    `emails: ${LOCAL_NAP.emailSupport}, ${LOCAL_NAP.emailPress}`,
    'citations: prepare honest GBP/Apple/Bing only when NAP is complete; KvK already verified',
  ].join('\n');
}
