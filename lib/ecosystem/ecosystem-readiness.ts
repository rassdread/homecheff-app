/**
 * Phase 3.1 — HomeCheff Ecosystem Readiness (validation SSOT).
 *
 * Validate that every ecosystem participant can feel “I belong here”
 * within existing philosophy and product surfaces.
 *
 * Review only. Do not add functionality, redesign, invent users, or modify
 * Adaptive Workspace, GeoFeed, planners, routing, auth, checkout, DB,
 * SEO, entity philosophy, authority, growth foundation, or business logic.
 */

export type FitStatus =
  | 'natural'
  | 'natural_with_cue'
  | 'partial'
  | 'planned'
  | 'blocked'
  | 'out_of_scope';

export type CanonicalBucket = 'FOOD' | 'GARDEN' | 'CREATIONS' | 'SERVICES' | 'WANTED' | 'TRADE' | 'CROSS';

export type EcosystemParticipant = {
  id: string;
  label: string;
  group:
    | 'food'
    | 'garden'
    | 'creative'
    | 'education'
    | 'services'
    | 'care'
    | 'community'
    | 'institutions'
    | 'business'
    | 'partners';
  bucket: CanonicalBucket;
  fit: FitStatus;
  firstImpression: string;
  evidence: string;
  gap?: string;
};

export const ECOSYSTEM_OBJECTIVE = {
  from: 'Marketplace growth foundation (Phase 3)',
  to: 'Living community ecosystem — every participant feels they belong',
  notGoals: [
    'Add new functionality',
    'Redesign UI/Workspace',
    'Invent users or usage',
    'Change SEO, entity philosophy, authority or growth foundation SSOTs',
  ],
  belongingTest: 'Do they immediately understand: this platform is also for me?',
} as const;

/** Canonical category accommodation — no architecture change. */
export const CATEGORY_COVERAGE = {
  canonical: ['FOOD', 'GARDEN', 'CREATIONS', 'SERVICES'] as const,
  views: ['Offered', 'Wanted / Gezocht', 'Inspiration'] as const,
  entryAxes: [
    'create',
    'grow',
    'design',
    'artisticService',
    'practicalService',
    'knowledge',
  ] as const,
  accommodates: [
    'services',
    'products',
    'knowledge',
    'creative work',
    'food',
    'garden',
    'repair',
    'design',
    'education',
    'help',
    'trade',
    'wanted',
  ] as const,
  confusionRisk:
    'Broad SERVICES + CREATIONS absorb many roles; first impression may need craft-specific examples without new SEO pages or category architecture.',
  status: 'ready' as const,
};

/** Full participant inventory — philosophy fit + first-impression readiness. */
export const ECOSYSTEM_PARTICIPANTS: EcosystemParticipant[] = [
  // Food
  { id: 'home_cooks', label: 'Home cooks', group: 'food', bucket: 'FOOD', fit: 'natural', firstImpression: 'Strong — cooking is a flagship signal.', evidence: 'FOOD category, Chef ecosystem, homemade philosophy.' },
  { id: 'bakers', label: 'Bakers', group: 'food', bucket: 'FOOD', fit: 'natural', firstImpression: 'Strong — home bakery fits craftsmanship-first.', evidence: 'FOOD + create flow specializations.' },
  { id: 'restaurants', label: 'Restaurants', group: 'business', bucket: 'FOOD', fit: 'natural_with_cue', firstImpression: 'Needs cue: personal/local craft visible, not anonymous dark kitchen.', evidence: 'Seller/business tools; philosophy excludes mass retail identity.', gap: 'Onboarding example for “restaurant as neighbourhood craft”.' },

  // Garden
  { id: 'gardeners', label: 'Gardeners', group: 'garden', bucket: 'GARDEN', fit: 'natural', firstImpression: 'Strong — harvest and plants are core.', evidence: 'GARDEN category, garden ecosystem.' },
  { id: 'garden_maintenance', label: 'Garden maintenance', group: 'services', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Clear as practical service nearby.', evidence: 'SERVICES / practicalService entry.' },

  // Creative
  { id: 'artists', label: 'Artists', group: 'creative', bucket: 'CREATIONS', fit: 'natural', firstImpression: 'Strong under creations.', evidence: 'CREATIONS + artistic entry.' },
  { id: 'designers', label: 'Designers', group: 'creative', bucket: 'CREATIONS', fit: 'natural', firstImpression: 'Strong — design entry axis.', evidence: 'design entryCategories.' },
  { id: 'photographers', label: 'Photographers', group: 'creative', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Clear as creative/artistic service.', evidence: 'artisticService + services.' },
  { id: 'videographers', label: 'Videographers', group: 'creative', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Fits services; less explicit example than photo.', evidence: 'SERVICES absorb creative media.', gap: 'Example cue in entry/onboarding.' },
  { id: 'musicians', label: 'Musicians', group: 'creative', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Lessons/performance as service or knowledge.', evidence: 'knowledge / artisticService.', gap: 'Belonging cue for performers vs teachers.' },
  { id: 'writers', label: 'Writers', group: 'creative', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Knowledge/creative service; not a bookstore.', evidence: 'knowledge entry.', gap: 'Example for local writing/knowledge offers.' },
  { id: 'illustrators', label: 'Illustrators', group: 'creative', bucket: 'CREATIONS', fit: 'natural', firstImpression: 'Natural under creations.', evidence: 'CREATIONS.' },
  { id: 'clothing_designers', label: 'Clothing designers', group: 'creative', bucket: 'CREATIONS', fit: 'natural', firstImpression: 'Handmade fashion fits; ordinary resale does not.', evidence: 'CREATIONS + second-hand philosophy.' },
  { id: 'jewellery_makers', label: 'Jewellery makers', group: 'creative', bucket: 'CREATIONS', fit: 'natural', firstImpression: 'Strong craft fit.', evidence: 'CREATIONS / craft.' },
  { id: 'craft_makers', label: 'Craft makers', group: 'creative', bucket: 'CREATIONS', fit: 'natural', firstImpression: 'Core craftsmanship identity.', evidence: 'CREATIONS + craftsmanship philosophy.' },
  { id: 'programmers', label: 'Programmers', group: 'education', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Local lessons/consultancy fit; not a freelance mega-marketplace brand.', evidence: 'knowledge / practicalService.', gap: 'Cue: neighbourhood knowledge, not gig-platform positioning.' },
  { id: 'developers', label: 'Developers', group: 'education', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Same as programmers.', evidence: 'knowledge services.', gap: 'Same cue as programmers.' },

  // Education
  { id: 'teachers', label: 'Teachers', group: 'education', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Strong — lessons/knowledge.', evidence: 'knowledge entry + SERVICES.' },
  { id: 'tutors', label: 'Tutors', group: 'education', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Clear local tutoring fit.', evidence: 'knowledge / SERVICES.' },
  { id: 'consultants', label: 'Consultants', group: 'education', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Personal expertise services.', evidence: 'SERVICES / knowledge.' },
  { id: 'fitness_coaches', label: 'Fitness coaches', group: 'education', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Local coaching fits.', evidence: 'SERVICES.' },
  { id: 'personal_trainers', label: 'Personal trainers', group: 'education', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Same as fitness coaches.', evidence: 'SERVICES.' },

  // Practical / care services
  { id: 'repair_specialists', label: 'Repair specialists', group: 'services', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Strong craftsmanship + repair narrative.', evidence: 'practicalService + repair philosophy.' },
  { id: 'handymen', label: 'Handymen', group: 'services', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Clear neighbourhood help/service.', evidence: 'practicalService / Gezocht.' },
  { id: 'dog_walkers', label: 'Dog walkers', group: 'care', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Local pet service fits.', evidence: 'SERVICES.' },
  { id: 'cleaners', label: 'Cleaners', group: 'care', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Local practical service.', evidence: 'practicalService.' },
  { id: 'hairdressers', label: 'Hairdressers', group: 'care', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Fits personal services; salon mass-retail cue to avoid.', evidence: 'SERVICES.', gap: 'Example: neighbourhood personal beauty craft.' },
  { id: 'beauty_specialists', label: 'Beauty specialists', group: 'care', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Same as hairdressers.', evidence: 'SERVICES.', gap: 'Belonging example in services entry.' },
  { id: 'massage_therapists', label: 'Massage therapists', group: 'care', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Personal service nearby.', evidence: 'SERVICES.' },
  { id: 'pet_services', label: 'Pet services', group: 'care', bucket: 'SERVICES', fit: 'natural', firstImpression: 'Clear local service.', evidence: 'SERVICES / Wanted.' },
  { id: 'babysitters', label: 'Babysitters', group: 'care', bucket: 'SERVICES', fit: 'natural_with_cue', firstImpression: 'Fits help/services; trust/safety cues critical.', evidence: 'SERVICES + safety/guidelines.', gap: 'Trust/safety first-impression emphasis for care roles.' },

  // Community
  { id: 'neighbourhood_helpers', label: 'Neighbourhood helpers', group: 'community', bucket: 'WANTED', fit: 'natural', firstImpression: 'Core Gezocht / buurthulp identity.', evidence: 'Wanted view, buurthulp pillar, neighbour help.' },
  { id: 'volunteers', label: 'Volunteers', group: 'community', bucket: 'CROSS', fit: 'partial', firstImpression: 'Can offer help/non-transactional inspiration; less explicit volunteer model.', evidence: 'Inspiration + help + HCP community contribution.', gap: 'Volunteer-specific explanation without inventing NGO features.' },
  { id: 'charities', label: 'Charities', group: 'institutions', bucket: 'CROSS', fit: 'planned', firstImpression: 'Philosophy-aligned; no dedicated charity org mode.', evidence: 'Open knowledge / community guidelines.', gap: 'Org onboarding & trust cues for charities.' },
  { id: 'community_organisations', label: 'Community organisations', group: 'institutions', bucket: 'CROSS', fit: 'planned', firstImpression: 'Same as charities — fit yes, surface thin.', evidence: 'Community activations library.', gap: 'Org profile / collaboration patterns.' },
  { id: 'schools', label: 'Schools', group: 'institutions', bucket: 'CROSS', fit: 'planned', firstImpression: 'Education fit; institutional presence not first-class.', evidence: 'Teachers/tutors already natural.', gap: 'School-as-participant story.' },
  { id: 'municipalities', label: 'Municipalities', group: 'institutions', bucket: 'CROSS', fit: 'blocked', firstImpression: 'Not yet “built for us” without public partnership.', evidence: 'Press/entity readiness only.', gap: 'Blocked until real public agreements — do not claim.' },
  { id: 'housing_corporations', label: 'Housing corporations', group: 'institutions', bucket: 'CROSS', fit: 'planned', firstImpression: 'Neighbourhood economy fit; no dedicated path.', evidence: 'Local-first philosophy.', gap: 'Partnership readiness docs only.' },

  // Business & market
  { id: 'small_local_businesses', label: 'Small local businesses', group: 'business', bucket: 'CROSS', fit: 'natural_with_cue', firstImpression: 'Fit when craftsmanship-first and person-visible.', evidence: 'Seller subscriptions + seller dashboard.', gap: 'Cue vs anonymous retail.' },
  { id: 'market_vendors', label: 'Market vendors', group: 'business', bucket: 'CROSS', fit: 'natural_with_cue', firstImpression: 'Strong neighbourhood market metaphor; needs “person behind stall” cue.', evidence: 'FOOD/GARDEN/CREATIONS + Village Square.', gap: 'Example for market vendors.' },

  // Partners
  { id: 'delivery_partners', label: 'Delivery partners', group: 'partners', bucket: 'CROSS', fit: 'natural', firstImpression: 'Clear courier path; platform is not a delivery company.', evidence: '/delivery/signup, /bezorger-worden, delivery reviews.' },
  { id: 'ambassadors', label: 'Ambassadors', group: 'partners', bucket: 'CROSS', fit: 'partial', firstImpression: 'Opportunity module exists; dedicated belonging surface thin.', evidence: 'discovery opportunity-registry ambassador eligibility.', gap: 'Ambassador programme surface.' },
  { id: 'affiliate_partners', label: 'Affiliate partners', group: 'partners', bucket: 'CROSS', fit: 'natural', firstImpression: 'Programme landing + dashboard exist.', evidence: '/affiliate, attribution, promo codes.' },
];

export const ONBOARDING_ECOSYSTEM_REVIEW = {
  explainsOffer: 'ready',
  explainsRequest: 'ready',
  explainsTrade: 'ready',
  explainsTrust: 'partial',
  explainsNearbyFirst: 'partial',
  explainsWiderDiscovery: 'partial',
  explainsCraftsmanshipValue: 'partial',
  evidence:
    'Seller/buyer onboarding, MarketplaceEntryFlow, Wanted intent, barter settlement, Stripe, trust pages exist.',
  gap: 'Participant-specific “you belong” examples (baker vs tutor vs handyman vs charity) are thinner than category engines.',
} as const;

export const DISCOVERY_ECOSYSTEM_REVIEW = {
  localFirst: 'ready',
  notLocalOnly: 'ready',
  uniqueCraftTravels: 'ready',
  philosophyConsistent: true,
  evidence:
    'GeoFeed nearby-first; LOCAL_FIRST_SCALE; unique craft may reach further; no international-marketplace branding.',
  gap: 'Participant discoverability is equal in engines; first-impression category cues still uneven across niches.',
} as const;

export const TRUST_ECOSYSTEM_REVIEW = {
  supports: [
    'buyers',
    'sellers',
    'creators',
    'service providers',
    'teachers',
    'artists',
    'volunteers',
    'delivery partners',
    'community organisations',
  ] as const,
  status: 'ready' as const,
  complexity: 'Profiles, reviews, reports, guidelines, safety — shared mechanisms without SNS complexity.',
  gap: 'Care roles (babysitters) and institutions need stronger trust-first cues; orgs lack dedicated trust patterns.',
};

export const VALUE_EXCHANGE_REVIEW: Array<{
  model: string;
  status: 'natural' | 'partial' | 'planned';
  note: string;
}> = [
  { model: 'buy', status: 'natural', note: 'Checkout + Stripe.' },
  { model: 'sell', status: 'natural', note: 'Create offer + seller tools.' },
  { model: 'trade', status: 'natural', note: 'Barter settlement + proposals.' },
  { model: 'request', status: 'natural', note: 'Wanted / Gezocht.' },
  { model: 'offer', status: 'natural', note: 'Offered view + create flow.' },
  { model: 'help', status: 'natural', note: 'Neighbour help + Wanted.' },
  { model: 'delivery', status: 'natural', note: 'Optional courier network; not identity.' },
  { model: 'affiliate', status: 'natural', note: 'Affiliate programme surfaces.' },
  { model: 'community contribution', status: 'partial', note: 'HCP / growth / inspiration; less explicit than commerce paths.' },
];

export const LOCAL_COMMUNITY_REVIEW = {
  supports: [
    'local stories',
    'local creators',
    'local services',
    'local food',
    'local garden',
    'local events',
    'local opportunities',
    'local collaborations',
    'local trust',
    'local identity',
  ] as const,
  status: 'partial' as const,
  evidence:
    'Maker profiles, GeoFeed, ecosystems, activations, CommunityPulse, HCP — without becoming a social network.',
  gap: 'Stories/events/collaborations scale with real participation; avoid SNS feature creep.',
};

export const SCALABILITY_ECOSYSTEM_REVIEW = {
  path: ['Neighbourhood', 'City', 'Region', 'Netherlands', 'Europe', 'Future international'] as const,
  philosophy: {
    closeToHome: 'Everything starts close to home.',
    distance: 'Distance determines priority, not possibility.',
  },
  unchanged: true,
  status: 'ready' as const,
};

/** Ecosystem-specific growth loops. */
export const ECOSYSTEM_LOOPS: Array<{
  id: string;
  name: string;
  steps: string[];
  status: 'ready' | 'partial';
}> = [
  {
    id: 'creator_growth',
    name: 'Creator → Offer → Buyer → Review → Trust → Growth',
    steps: ['Creator publishes', 'Buyer discovers', 'Settlement', 'Review', 'Trust summary', 'More demand/creators'],
    status: 'ready',
  },
  {
    id: 'neighbour_help',
    name: 'Neighbour → Request → Helper → Relationship → Community',
    steps: ['Gezocht post', 'Helper/proposal', 'Chat/deal', 'Follow/trust', 'Local activity'],
    status: 'ready',
  },
  {
    id: 'artist_recognition',
    name: 'Artist → Discovery → Followers → Sales → Recognition',
    steps: ['Creations listing', 'Nearby + wider craft discovery', 'Follows', 'Purchase/trade', 'Reviews/HCP'],
    status: 'ready',
  },
  {
    id: 'gardener_repeat',
    name: 'Gardener → Harvest → Buyer → Repeat',
    steps: ['Garden offer', 'Local buyer', 'Fulfilment', 'Repeat via follow/favorites'],
    status: 'ready',
  },
  {
    id: 'teacher_trust',
    name: 'Teacher → Lesson → Review → Trust',
    steps: ['Knowledge/service offer', 'Booking/agreement', 'Review', 'Trust attracts learners'],
    status: 'ready',
  },
  {
    id: 'repair_repeat',
    name: 'Repair → Recommendation → Repeat customer',
    steps: ['Repair service', 'Review/reputation', 'Repeat + referrals'],
    status: 'ready',
  },
  {
    id: 'courier_assist',
    name: 'Offer → Courier → Delivery review → Reliable fulfilment',
    steps: ['Fulfilment option', 'Courier match', 'Delivery review'],
    status: 'ready',
  },
  {
    id: 'affiliate_invite',
    name: 'Affiliate → Invite → New participant → Attribution',
    steps: ['Affiliate link', 'Onboarding', 'Value creation', 'Programme'],
    status: 'ready',
  },
  {
    id: 'institution_collab',
    name: 'Institution → Public collaboration → Community legitimacy → Adoption',
    steps: ['Real agreement', 'Public page', 'Local activation', 'Trust'],
    status: 'partial',
  },
];

export const MISSING_OPPORTUNITIES = [
  {
    id: 'belonging_examples',
    area: 'explanations',
    note: 'Participant-specific “I belong here” examples across niches (without new SEO doorway pages).',
  },
  {
    id: 'craft_examples_in_onboarding',
    area: 'onboarding',
    note: 'Richer first-run examples for baker, tutor, handyman, photographer, market vendor.',
  },
  {
    id: 'care_trust_cues',
    area: 'trust signals',
    note: 'Stronger safety/trust first impression for babysitters and care services.',
  },
  {
    id: 'volunteer_charity_path',
    area: 'participants',
    note: 'Clearer volunteer/charity/community-org path without inventing NGO products.',
  },
  {
    id: 'institution_presence',
    area: 'participants',
    note: 'Schools, municipalities, housing corporations — blocked/planned until real partnerships.',
  },
  {
    id: 'ambassador_surface',
    area: 'discovery',
    note: 'Dedicated ambassador belonging surface (eligibility exists).',
  },
  {
    id: 'community_contribution_parity',
    area: 'value exchanges',
    note: 'Make community contribution feel as natural as buy/sell/trade (HCP/inspiration already partial).',
  },
  {
    id: 'no_new_categories_required',
    area: 'categories',
    note: 'No missing canonical category — FOOD/GARDEN/CREATIONS/SERVICES + Wanted/Inspiration cover the model; cues > new taxonomy.',
  },
] as const;

export const ECOSYSTEM_ROADMAP: Array<{
  priority: 1 | 2 | 3 | 4;
  item: string;
  rationale: string;
}> = [
  { priority: 1, item: 'Belonging cues in onboarding/entry for top niches', rationale: 'Engines exist; first impression is the inclusion gap.' },
  { priority: 1, item: 'Nearby-first + craftsmanship value explained in plain language', rationale: 'Philosophy complete; visitor comprehension partial.' },
  { priority: 2, item: 'Care-role trust/safety first-run emphasis', rationale: 'Trust stack exists; cue strength uneven.' },
  { priority: 2, item: 'Volunteer/charity/community-org narrative (docs/copy only)', rationale: 'Philosophy fit without new social network.' },
  { priority: 3, item: 'Ambassador programme surface', rationale: 'Converts partial partner fit to runnable advocacy.' },
  { priority: 3, item: 'Market vendor / small business craft-visible examples', rationale: 'Prevent retail/classifieds confusion.' },
  { priority: 4, item: 'Institutional collaborations only after public agreements', rationale: 'Municipality/housing/school — earn, never invent.' },
];

export const ECOSYSTEM_SCORES = {
  ecosystemReadiness: 82,
  communityReadiness: 76,
  creatorInclusion: 88,
  marketplaceCompleteness: 86,
  longTermScalability: 90,
} as const;

export function ecosystemReadinessBrief(): string {
  const byFit = ECOSYSTEM_PARTICIPANTS.reduce<Record<string, number>>((acc, p) => {
    acc[p.fit] = (acc[p.fit] ?? 0) + 1;
    return acc;
  }, {});
  return [
    `objective: ${ECOSYSTEM_OBJECTIVE.to}`,
    `participants: ${ECOSYSTEM_PARTICIPANTS.length}`,
    `fit: ${Object.entries(byFit)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`,
    `categories: ${CATEGORY_COVERAGE.canonical.join(', ')} + Wanted/Inspiration`,
    `loops: ${ECOSYSTEM_LOOPS.length}`,
    `missing: ${MISSING_OPPORTUNITIES.length}`,
    `scores: ecosystem=${ECOSYSTEM_SCORES.ecosystemReadiness} inclusion=${ECOSYSTEM_SCORES.creatorInclusion} completeness=${ECOSYSTEM_SCORES.marketplaceCompleteness}`,
    'rule: validation only — no new features, no invented users, no SEO/AW changes',
  ].join('\n');
}
