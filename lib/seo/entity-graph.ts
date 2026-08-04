/**
 * Phase 2.2A — Single HomeCheff entity graph (verified relationships only).
 * Phase 2.3 — Brand entity dominance: reinforce brand ↔ marketplace ↔ trust surfaces.
 * Do not invent founding dates, street addresses, social URLs or metrics.
 */

import {
  LEGAL_OPERATOR,
  PRESS_EMAIL,
  SUPPORT_EMAIL,
  VERIFIED_FOUNDER,
  VERIFIED_SAME_AS,
  PENDING_SAME_AS_VERIFICATION,
  ORGANIZATION_OMITTED_FIELDS,
} from './organization-identity';
import { CANONICAL_BRAND_SPELLING, brandEntityBrief } from './brand-entity';

/** Canonical nodes in the public knowledge graph. */
export const ENTITY_NODES = {
  brand: {
    id: 'brand',
    name: CANONICAL_BRAND_SPELLING,
    role: 'Platform brand / digital neighbourhood marketplace',
    canonicalUrl: 'https://homecheff.eu',
    schemaId: 'https://homecheff.eu/#organization',
    spelling: CANONICAL_BRAND_SPELLING,
  },
  website: {
    id: 'website',
    name: 'homecheff.eu',
    role: 'Primary public website',
    canonicalUrl: 'https://homecheff.eu',
    schemaId: 'https://homecheff.eu/#website',
  },
  operator: {
    id: 'operator',
    name: LEGAL_OPERATOR.legalName,
    role: 'Legal operator (parent organization)',
    locality: LEGAL_OPERATOR.locality,
    country: LEGAL_OPERATOR.addressCountry,
    kvk: LEGAL_OPERATOR.kvk,
    vat: LEGAL_OPERATOR.vat,
    schemaId: 'https://homecheff.eu/#legal-operator',
  },
  founder: {
    id: 'founder',
    name: VERIFIED_FOUNDER.name,
    role: VERIFIED_FOUNDER.jobTitle,
    note: 'Name and role only — no public biography in schema.',
  },
  neighbourhoodMarketplace: {
    id: 'neighbourhoodMarketplace',
    name: 'Digital neighbourhood marketplace',
    nameNl: 'Digitale buurtmarkt',
    role: 'Canonical product category / positioning for the HomeCheff brand',
    note:
      'Concept node — not a separate Organization in JSON-LD. Local-first / neighbourhood-first, not neighbourhood-only; craftsmanship-first value creation, not ordinary second-hand resale.',
  },
  manifest: {
    id: 'manifest',
    name: 'HomeCheff Manifest',
    path: '/manifest',
    role: 'Publishing principles / brand philosophy surface',
  },
  trust: {
    id: 'trust',
    name: 'Trust & transparency',
    path: '/trust',
    role: 'Trust / corrections policy surface',
  },
} as const;

/** Directed relationships — one consistent identity. */
export const ENTITY_RELATIONSHIPS = [
  {
    from: 'brand',
    to: 'operator',
    relation: 'parentOrganization',
    note: 'HomeCheff brand is operated by Arrias Beheer B.V.',
  },
  {
    from: 'website',
    to: 'brand',
    relation: 'publisher',
    note: 'Website is published by the HomeCheff Organization entity.',
  },
  {
    from: 'brand',
    to: 'founder',
    relation: 'founder',
    note: 'Verified founder name and job title only.',
  },
  {
    from: 'brand',
    to: 'neighbourhoodMarketplace',
    relation: 'positionedAs',
    note:
      'HomeCheff is the digital neighbourhood marketplace (digitale buurtmarkt): local-first and scalable; unique craft may reach further. Everything starts close to home.',
  },
  {
    from: 'brand',
    to: 'manifest',
    relation: 'publishingPrinciples',
    note: 'Manifest states brand philosophy without inventing metrics.',
  },
  {
    from: 'brand',
    to: 'trust',
    relation: 'correctionsPolicy',
    note: 'Trust page is the public corrections / transparency surface.',
  },
  {
    from: 'brand',
    to: 'knowledge',
    relation: 'explains',
    note: 'Manifest, Constitution, Trust, FAQ, docs explain the same entity.',
  },
] as const;

/** Public knowledge pages that must describe the same entity. */
export const ENTITY_KNOWLEDGE_SURFACES = [
  '/wat-is-homecheff',
  '/over-ons',
  '/manifest',
  '/constitution',
  '/trust',
  '/faq',
  '/docs',
  '/principles',
  '/safety',
  '/community-guidelines',
  '/privacy',
  '/llms.txt',
  '/ai.txt',
] as const;

export const ENTITY_CONTACT = {
  support: SUPPORT_EMAIL,
  press: PRESS_EMAIL,
} as const;

export const ENTITY_VERIFIED_SAME_AS = VERIFIED_SAME_AS;
export const ENTITY_PENDING_SAME_AS = PENDING_SAME_AS_VERIFICATION;
export const ENTITY_OMITTED = ORGANIZATION_OMITTED_FIELDS;

/** Machine-readable summary for AI briefs. */
export function entityGraphBrief(): string {
  return [
    `brand: ${ENTITY_NODES.brand.name} (${ENTITY_NODES.brand.schemaId}) — spelling=${ENTITY_NODES.brand.spelling}`,
    `website: ${ENTITY_NODES.website.canonicalUrl} (${ENTITY_NODES.website.schemaId})`,
    `legal_operator: ${ENTITY_NODES.operator.name} — KvK ${ENTITY_NODES.operator.kvk}, ${ENTITY_NODES.operator.locality}, ${ENTITY_NODES.operator.country}`,
    `founder: ${ENTITY_NODES.founder.name} (${ENTITY_NODES.founder.role}) — name/role only`,
    `positioning: ${ENTITY_NODES.neighbourhoodMarketplace.name} / ${ENTITY_NODES.neighbourhoodMarketplace.nameNl}`,
    `manifest: ${ENTITY_NODES.manifest.path}`,
    `trust: ${ENTITY_NODES.trust.path}`,
    `contact: support=${ENTITY_CONTACT.support}; press=${ENTITY_CONTACT.press}`,
    `sameAs_verified: ${ENTITY_VERIFIED_SAME_AS.join(', ')}`,
    `sameAs_pending: ${ENTITY_PENDING_SAME_AS.join('; ')}`,
    'rule: one brand identity — never invent foundingDate, streetAddress, social URLs or impact metrics',
    '',
    brandEntityBrief(),
  ].join('\n');
}
