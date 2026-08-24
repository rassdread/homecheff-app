/**
 * Phase 2.2A — Single HomeCheff entity graph (verified relationships only).
 * Phase 2.3 — Brand entity dominance.
 * Phase 2.4 — Brand authority & knowledge-graph dominance (more concept links, same identity).
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
    path: '/sergio-arrias',
    note: 'Name and role in schema; public knowledge page /sergio-arrias — no invented credentials.',
  },
  arriassisme: {
    id: 'arriassisme',
    name: 'Arriassisme',
    path: '/arriassisme',
    role: 'Founder’s personal philosophical inspiration',
    note: 'NOT the HomeCheff Manifest / platform philosophy. Concept node — inspiredBy founder only.',
  },
  brandOrigin: {
    id: 'brandOrigin',
    name: 'Origin of HomeCheff',
    path: '/oorsprong-homecheff',
    role: 'Official origin / history knowledge surface',
  },
  brandName: {
    id: 'brandName',
    name: 'Why HomeCheff',
    path: '/waarom-homecheff',
    role: 'Brand name meaning + two-F spelling surface',
  },
  neighbourhoodMarketplace: {
    id: 'neighbourhoodMarketplace',
    name: 'Digital neighbourhood marketplace',
    nameNl: 'Digitale buurtmarkt',
    role: 'Canonical product category / positioning for the HomeCheff brand',
    note:
      'Concept node — not a separate Organization in JSON-LD. Local-first / neighbourhood-first, not neighbourhood-only; craftsmanship-first value creation, not ordinary second-hand resale.',
  },
  neighbourhoodEconomy: {
    id: 'neighbourhoodEconomy',
    name: 'Neighbourhood economy',
    nameNl: 'Buurt economie',
    role: 'Concept — local opportunity and community value exchange',
    note: 'Concept node — explained on public knowledge pages; not a separate Organization.',
  },
  craftsmanship: {
    id: 'craftsmanship',
    name: 'Craftsmanship',
    nameNl: 'Vakmanschap',
    role: 'Concept — personal labour, creativity and production as value basis',
    note: 'Concept node — distinguishes HomeCheff from ordinary resale and mass retail.',
  },
  communityExchange: {
    id: 'communityExchange',
    name: 'Community exchange',
    nameNl: 'Community-ruil / barter',
    role: 'Concept — barter and neighbour value exchange',
    note: 'Concept node — supported settlement path; not a separate legal entity.',
  },
  socialCohesion: {
    id: 'socialCohesion',
    name: 'Social cohesion',
    nameNl: 'Sociale cohesie',
    role: 'Concept — reconnecting neighbours; philosophical motivation for HomeCheff',
    note: 'Concept node — declining interaction / loneliness / invisible skills as calm motivation; no invented statistics.',
  },
  privacyPhilosophy: {
    id: 'privacyPhilosophy',
    name: 'Privacy philosophy (community before data)',
    nameNl: 'Privacyfilosofie (community vóór data)',
    role: 'Concept — people are the community, not the product',
    note: 'Concept node — philosophy communication; legal policy remains /privacy.',
  },
  neighbourhoodFirstGrowth: {
    id: 'neighbourhoodFirstGrowth',
    name: 'Neighbourhood-first growth',
    nameNl: 'Neighbourhood-first groei',
    role: 'Concept — local-first scale path without changing philosophy',
    note: 'Concept node — neighbourhood→…→Oceania; distance = priority not possibility; never anonymous international marketplace.',
  },
  community: {
    id: 'community',
    name: 'Community',
    nameNl: 'Community',
    role: 'Concept — neighbours discovering each other',
    note: 'Concept node — destination of the platform; technology is the bridge.',
  },
  localEconomy: {
    id: 'localEconomy',
    name: 'Local economy',
    nameNl: 'Lokale economie',
    role: 'Concept — alias emphasis for neighbourhood economy',
    note: 'Concept node — aligns with neighbourhoodEconomy; craftsmanship visible nearby.',
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
  communityGuidelines: {
    id: 'communityGuidelines',
    name: 'Community Guidelines',
    path: '/community-guidelines',
    role: 'Ethics / community conduct surface',
  },
  principles: {
    id: 'principles',
    name: 'Principles',
    path: '/principles',
    role: 'Public principles / diversity & orientation surface',
  },
  openKnowledge: {
    id: 'openKnowledge',
    name: 'Open Knowledge',
    path: '/docs',
    role: 'Educational documentation hub',
  },
  marketplace: {
    id: 'marketplace',
    name: 'HomeCheff Marketplace',
    role: 'Commerce / discovery layer (SELL)',
    canonicalUrl: 'https://homecheff.eu/',
    schemaId: 'https://homecheff.eu/#marketplace',
    note: 'Self-made products, personal services, creative work — not ordinary second-hand resale.',
  },
  studio: {
    id: 'studio',
    name: 'HomeCheff Studio',
    role: 'CREATE layer',
    canonicalUrl: 'https://studio.homecheff.eu/',
    parentLandingPath: '/studio',
    schemaId: 'https://studio.homecheff.eu/#app',
    note: 'Product app lives on studio subdomain; parent-brand explanation at homecheff.eu/studio.',
  },
  growth: {
    id: 'growth',
    name: 'HomeCheff Growth',
    role: 'GROW / commercial growth layer',
    canonicalUrl: 'https://growth.homecheff.eu/',
    parentLandingPath: '/growth',
    schemaId: 'https://growth.homecheff.eu/#app',
    note: 'Product app lives on growth subdomain; parent-brand explanation at homecheff.eu/growth.',
  },
  affiliate: {
    id: 'affiliate',
    name: 'HomeCheff Affiliate & Partner',
    role: 'PROMOTE — cross-ecosystem referral/partner layer',
    path: '/affiliate',
    schemaId: 'https://homecheff.eu/#affiliate',
    note: 'Not Marketplace-only; terms follow certified commercial SSOT — no blanket guaranteed income.',
  },
  ecosystem: {
    id: 'ecosystem',
    name: 'HomeCheff ecosystem',
    path: '/ecosystem',
    role: 'Canonical participation / entity relationship page',
    note: 'Visible + machine-readable agreement of CREATE → SELL → GROW → PROMOTE → EARN → REPEAT.',
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
    note: 'Verified founder name and job title; knowledge at /sergio-arrias.',
  },
  {
    from: 'founder',
    to: 'brand',
    relation: 'founded',
    note: 'Sergio Arrias founded HomeCheff.',
  },
  {
    from: 'brand',
    to: 'operator',
    relation: 'operatedBy',
    note: 'HomeCheff is operated by Arrias Beheer B.V. (also parentOrganization).',
  },
  {
    from: 'founder',
    to: 'arriassisme',
    relation: 'inspiredBy',
    note: 'Arriassisme inspires the founder personally — not the platform Manifest.',
  },
  {
    from: 'brand',
    to: 'brandOrigin',
    relation: 'originDocumentedAt',
    note: 'Official origin narrative at /oorsprong-homecheff.',
  },
  {
    from: 'brand',
    to: 'brandName',
    relation: 'nameExplainedAt',
    note: 'Brand meaning and two-F spelling at /waarom-homecheff.',
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
    to: 'neighbourhoodEconomy',
    relation: 'supports',
    note: 'Platform supports neighbourhood economy through local-first discovery and personal work.',
  },
  {
    from: 'brand',
    to: 'craftsmanship',
    relation: 'emphasises',
    note: 'Craftsmanship-first value creation — not ordinary second-hand resale.',
  },
  {
    from: 'brand',
    to: 'communityExchange',
    relation: 'supports',
    note: 'Supports barter and community exchange alongside checkout and direct agreements.',
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
    to: 'communityGuidelines',
    relation: 'ethicsPolicy',
    note: 'Community Guidelines define expected conduct for real people in the community.',
  },
  {
    from: 'brand',
    to: 'principles',
    relation: 'diversityPolicy',
    note: 'Principles surface states public orientation without fabricated impact claims.',
  },
  {
    from: 'brand',
    to: 'openKnowledge',
    relation: 'explains',
    note: 'Open Knowledge docs explain the same entity as Manifest, Trust, FAQ and About.',
  },
  {
    from: 'neighbourhoodMarketplace',
    to: 'craftsmanship',
    relation: 'requires',
    note: 'Marketplace positioning requires personal craftsmanship or meaningful transformation.',
  },
  {
    from: 'neighbourhoodMarketplace',
    to: 'communityExchange',
    relation: 'includes',
    note: 'Barter and Wanted belong inside the neighbourhood marketplace model.',
  },
  {
    from: 'brand',
    to: 'community',
    relation: 'serves',
    note: 'Platform serves community — neighbours discovering each other.',
  },
  {
    from: 'brand',
    to: 'socialCohesion',
    relation: 'motivatedBy',
    note: 'Philosophical motivation: reconnect people; make invisible skills visible nearby.',
  },
  {
    from: 'brand',
    to: 'localEconomy',
    relation: 'supports',
    note: 'Supports local economy through craftsmanship visible nearby.',
  },
  {
    from: 'brand',
    to: 'privacyPhilosophy',
    relation: 'publishes',
    note: 'Community before data — people are not advertising products.',
  },
  {
    from: 'brand',
    to: 'neighbourhoodFirstGrowth',
    relation: 'growsVia',
    note: 'Neighbourhood→city→…→Oceania without changing local-first philosophy.',
  },
  {
    from: 'founder',
    to: 'neighbourhoodMarketplace',
    relation: 'createdAsPracticalApplication',
    note: 'Years of philosophy became the digital neighbourhood marketplace.',
  },
  {
    from: 'marketplace',
    to: 'brand',
    relation: 'isPartOf',
    note: 'Marketplace is the commerce layer of the HomeCheff ecosystem brand.',
  },
  {
    from: 'studio',
    to: 'brand',
    relation: 'isPartOf',
    note: 'Studio is the CREATE layer; schema references parent #organization.',
  },
  {
    from: 'growth',
    to: 'brand',
    relation: 'isPartOf',
    note: 'Growth is the GROW layer; schema references parent #organization.',
  },
  {
    from: 'affiliate',
    to: 'brand',
    relation: 'provider',
    note: 'Affiliate/partner is a horizontal promote layer across Marketplace, Growth and Studio where supported.',
  },
  {
    from: 'ecosystem',
    to: 'brand',
    relation: 'explains',
    note: 'Canonical /ecosystem page explains participation roles for humans and machines.',
  },
] as const;

/** Public knowledge pages that must describe the same entity. */
export const ENTITY_KNOWLEDGE_SURFACES = [
  '/wat-is-homecheff',
  '/ecosystem',
  '/studio',
  '/growth',
  '/affiliate',
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
  '/persoonlijk-vakmanschap',
  '/buurt-economie',
  '/sergio-arrias',
  '/oorsprong-homecheff',
  '/waarom-homecheff',
  '/arriassisme',
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
  const relationships = ENTITY_RELATIONSHIPS.map(
    (r) => `${r.from} -[${r.relation}]-> ${r.to}`,
  ).join('; ');
  return [
    `brand: ${ENTITY_NODES.brand.name} (${ENTITY_NODES.brand.schemaId}) — spelling=${ENTITY_NODES.brand.spelling}`,
    `website: ${ENTITY_NODES.website.canonicalUrl} (${ENTITY_NODES.website.schemaId})`,
    `legal_operator: ${ENTITY_NODES.operator.name} — KvK ${ENTITY_NODES.operator.kvk}, ${ENTITY_NODES.operator.locality}, ${ENTITY_NODES.operator.country}`,
    `founder: ${ENTITY_NODES.founder.name} (${ENTITY_NODES.founder.role}) — ${ENTITY_NODES.founder.path}`,
    `arriassisme: ${ENTITY_NODES.arriassisme.name} (${ENTITY_NODES.arriassisme.path}) — personal inspiration, NOT Manifest`,
    `origin: ${ENTITY_NODES.brandOrigin.path}; brand_name: ${ENTITY_NODES.brandName.path}`,
    `positioning: ${ENTITY_NODES.neighbourhoodMarketplace.name} / ${ENTITY_NODES.neighbourhoodMarketplace.nameNl}`,
    `concepts: ${ENTITY_NODES.neighbourhoodEconomy.name}; ${ENTITY_NODES.craftsmanship.name}; ${ENTITY_NODES.communityExchange.name}; ${ENTITY_NODES.socialCohesion.name}; ${ENTITY_NODES.privacyPhilosophy.name}; ${ENTITY_NODES.neighbourhoodFirstGrowth.name}`,
    `community: ${ENTITY_NODES.community.name}; local_economy: ${ENTITY_NODES.localEconomy.name}`,
    `manifest: ${ENTITY_NODES.manifest.path}`,
    `trust: ${ENTITY_NODES.trust.path}`,
    `community_guidelines: ${ENTITY_NODES.communityGuidelines.path}`,
    `principles: ${ENTITY_NODES.principles.path}`,
    `open_knowledge: ${ENTITY_NODES.openKnowledge.path}`,
    `ecosystem_page: ${ENTITY_NODES.ecosystem.path}`,
    `marketplace: ${ENTITY_NODES.marketplace.name} (${ENTITY_NODES.marketplace.schemaId})`,
    `studio: ${ENTITY_NODES.studio.name} (${ENTITY_NODES.studio.schemaId}) — parent landing ${ENTITY_NODES.studio.parentLandingPath}`,
    `growth: ${ENTITY_NODES.growth.name} (${ENTITY_NODES.growth.schemaId}) — parent landing ${ENTITY_NODES.growth.parentLandingPath}`,
    `affiliate: ${ENTITY_NODES.affiliate.name} (${ENTITY_NODES.affiliate.schemaId})`,
    `loop: CREATE → SELL → GROW → PROMOTE → EARN → REPEAT`,
    `relationships: ${relationships}`,
    `contact: support=${ENTITY_CONTACT.support}; press=${ENTITY_CONTACT.press}`,
    `sameAs_verified: ${ENTITY_VERIFIED_SAME_AS.join(', ')}`,
    `sameAs_pending: ${ENTITY_PENDING_SAME_AS.join('; ')}`,
    'rule: one brand identity — never invent foundingDate, streetAddress, unverified social URLs or impact metrics',
    'rule: Arrias Beheer B.V. = legal operator; HomeCheff = brand/ecosystem (no HomeCheff B.V.)',
    'rule: Arriassisme ≠ HomeCheff philosophy',
    'rule: founder = years of philosophy → practical platform (not “just an app”)',
    'rule: affiliate is ecosystem-wide where supported — no blanket guaranteed income or invented commissions',
    '',
    brandEntityBrief(),
  ].join('\n');
}
