/**
 * Phase 3 — HomeCheff Growth Foundation (readiness SSOT).
 *
 * Shift from technical SEO readiness to real marketplace readiness.
 * Inventory + readiness only. Do not invent usage, reviews, partners or metrics.
 * Does not modify Adaptive Workspace, GeoFeed ownership, planners, auth, checkout,
 * DB architecture, routing, SEO/structured-data architecture, or entity philosophy.
 */

export type ReadinessStatus =
  | 'ready'
  | 'partial'
  | 'planned'
  | 'blocked'
  | 'not_applicable';

export type ReadinessItem = {
  id: string;
  label: string;
  status: ReadinessStatus;
  evidence: string;
  gap?: string;
};

/** Mission: living marketplace through continuous real value creation. */
export const GROWTH_FOUNDATION_OBJECTIVE = {
  from: 'Technical readiness (SEO / entity / AI / authority complete)',
  to: 'Real marketplace readiness (visitors, creators, buyers, neighbours, communities)',
  notGoals: [
    'Improve SEO scores',
    'Create additional SEO pages',
    'Chase keywords',
    'Invent authority, usage or partnerships',
  ],
  principle:
    'The platform becomes more valuable because real people continuously create value.',
} as const;

/** First-wave adoption readiness — no invented usage. */
export const MARKETPLACE_ADOPTION_READINESS: ReadinessItem[] = [
  {
    id: 'first_creators',
    label: 'First creators',
    status: 'ready',
    evidence:
      'Seller onboarding (/onboarding/seller), create wizard (/sell/new), MarketplaceEntryFlow + MarketplaceOfferForm, SellerActivationGate, Stripe Connect.',
  },
  {
    id: 'first_buyers',
    label: 'First buyers',
    status: 'ready',
    evidence:
      'Homepage Dorpsplein feed chips, GeoFeed discovery, product detail CTAs, checkout (/checkout), orders (/orders).',
  },
  {
    id: 'first_trades',
    label: 'First trades / barter',
    status: 'ready',
    evidence:
      'Barter settlement in offer form, proposals, exchange suggestions, deals hub (/profile/deals).',
  },
  {
    id: 'first_services',
    label: 'First services',
    status: 'ready',
    evidence:
      'Marketplace categories include services; create flow specializations; ecosystem /gemeenschap segments.',
  },
  {
    id: 'first_neighbourhood_communities',
    label: 'First neighbourhood communities',
    status: 'partial',
    evidence:
      'Nearby-first GeoFeed, place/map, CommunityPulseBar, community progress/HCP, activations library.',
    gap: 'Density of real local supply/demand still depends on adoption — not inventable in code.',
  },
  {
    id: 'first_ambassadors',
    label: 'First ambassadors',
    status: 'partial',
    evidence:
      'Ambassador opportunity in discovery opportunity-registry; HCP recognition paths.',
    gap: 'No dedicated /ambassador dashboard route yet.',
  },
  {
    id: 'first_delivery_partners',
    label: 'First delivery partners',
    status: 'ready',
    evidence:
      '/delivery/signup, /bezorger-worden, courier dashboard, delivery APIs, delivery reviews.',
  },
  {
    id: 'first_municipalities',
    label: 'First municipalities',
    status: 'blocked',
    evidence: 'Press/About/entity pages ready for outreach.',
    gap: 'No public municipal partnership page — do not claim until real agreement exists.',
  },
  {
    id: 'first_local_organisations',
    label: 'First local organisations',
    status: 'planned',
    evidence: 'Press readiness + community guidelines + open knowledge.',
    gap: 'Requires real outreach; no invented org affiliations.',
  },
  {
    id: 'first_business_collaborations',
    label: 'First business collaborations',
    status: 'partial',
    evidence:
      'Seller subscriptions (/sell), business DNA/preview libs, affiliate programme.',
    gap: 'Collaborations only after real agreements — readiness for tools exists.',
  },
];

/** Creator craft paths that fit HomeCheff philosophy. */
export const CREATOR_CRAFT_PATHS = [
  'cook',
  'bake',
  'grow',
  'create',
  'repair',
  'design',
  'teach',
  'consult',
  'perform',
  'photograph',
  'paint',
  'craft',
  'neighbourhood_help',
  'knowledge_exchange',
  'trade',
  'sell',
  'buy',
] as const;

export const CREATOR_EXPERIENCE_READINESS: ReadinessItem[] = [
  {
    id: 'what_to_offer',
    label: 'Creators understand what they may offer',
    status: 'ready',
    evidence:
      'MarketplaceEntryFlow taxonomy (intent → category → specialization); philosophy excludes ordinary second-hand without transformation; pillar /wat-is-homecheff + /persoonlijk-vakmanschap.',
  },
  {
    id: 'how_they_earn',
    label: 'Creators understand how they earn',
    status: 'ready',
    evidence:
      'Checkout + Stripe Connect; fees explained on earn/sell surfaces; barter/direct/proposal settlement options; /lokaal-verdienen style pillars.',
  },
  {
    id: 'how_they_grow',
    label: 'Creators understand how they grow',
    status: 'partial',
    evidence:
      'Seller dashboard/analytics, growth surfaces (lib/discovery/growth), HCP, follows, profile trust.',
    gap: 'Growth storytelling can still feel product-heavy for first-time creators — polish, not architecture.',
  },
  {
    id: 'how_they_become_trusted',
    label: 'Creators understand how they become trusted',
    status: 'ready',
    evidence:
      'Visible profiles, reviews (order/deal/delivery), trust summary, community guidelines, reporting.',
  },
];

export const BUYER_EXPERIENCE_READINESS: ReadinessItem[] = [
  {
    id: 'discover',
    label: 'How to discover',
    status: 'ready',
    evidence: 'Homepage Village Square / Dorpsplein chips + GeoFeed + category ecosystems.',
  },
  {
    id: 'search',
    label: 'How to search',
    status: 'ready',
    evidence: 'ImprovedFilterBar, AdvancedFiltersPanel, search libs, product APIs.',
  },
  {
    id: 'request',
    label: 'How to request (Wanted / Gezocht)',
    status: 'ready',
    evidence: 'Gezocht chip, REQUEST listing kind, /request/[slug], create intent for requests.',
  },
  {
    id: 'trade',
    label: 'How to trade',
    status: 'ready',
    evidence: 'Proposals, barter settlement, exchange suggestions, deals hub.',
  },
  {
    id: 'contact',
    label: 'How to contact',
    status: 'ready',
    evidence: 'StartChatButton, /messages, proposal sheets.',
  },
  {
    id: 'trust',
    label: 'How to trust',
    status: 'ready',
    evidence: 'Maker-visible profiles, trust badges/summaries, /trust, reviews, report button.',
  },
  {
    id: 'buy',
    label: 'How to buy',
    status: 'ready',
    evidence: 'Product sale CTAs → checkout → Stripe; orders history.',
  },
  {
    id: 'nearby_first',
    label: 'Nearby-first understood',
    status: 'partial',
    evidence:
      'GeoFeed + place filter + philosophy copy (distance = priority, not possibility).',
    gap: 'Guest comprehension of nearby-first still depends on orientation copy clarity, not missing engines.',
  },
];

export const COMMUNITY_EXPERIENCE_READINESS: ReadinessItem[] = [
  {
    id: 'living_neighbourhood_feel',
    label: 'Feels like a living neighbourhood (not only listings)',
    status: 'partial',
    evidence:
      'CommunityPulseBar, growth inserts, HCP, opportunities, activations, ecosystem pages.',
    gap: 'Needs real local density + stories; avoid adding social-network complexity.',
  },
  {
    id: 'neighbourhood_moments',
    label: 'Neighbourhood moments',
    status: 'partial',
    evidence: 'Activations library + opportunity modules + community delivery panel.',
  },
  {
    id: 'stories_local_identity',
    label: 'Stories / local identity',
    status: 'partial',
    evidence: 'Maker profiles, meet-the-maker pillars, open knowledge — not a feed of posts.',
    gap: 'No invented community posts; authentic maker stories remain the path.',
  },
  {
    id: 'social_interaction_without_sns',
    label: 'Social interaction without SNS complexity',
    status: 'ready',
    evidence: 'Chat, proposals, follows, favorites, reviews — transaction/community oriented, not infinite scroll social.',
  },
];

/** Natural growth loops — document only. */
export const GROWTH_LOOPS: Array<{
  id: string;
  name: string;
  steps: string[];
  status: ReadinessStatus;
  notes: string;
}> = [
  {
    id: 'creator_trust_loop',
    name: 'Creator → Offer → Buyer → Review → Trust → More buyers → More creators',
    steps: [
      'Creator onboards and publishes offer',
      'Buyer discovers nearby / via request',
      'Checkout, proposal, or barter settles',
      'Review / deal review builds reputation',
      'Trust summary attracts more buyers',
      'Visible success attracts more creators',
    ],
    status: 'ready',
    notes: 'Core marketplace loop is product-complete; density is adoption-bound.',
  },
  {
    id: 'trade_community_loop',
    name: 'Trade → Connections → Community → Activity → Growth',
    steps: [
      'Trade or Wanted match creates connection (chat/proposal)',
      'Follows / favorites retain relationship',
      'Community pulse + HCP reward constructive activity',
      'More activity improves local feed relevance',
      'Growth surfaces nudge next constructive action',
    ],
    status: 'partial',
    notes: 'Mechanics exist; “living neighbourhood” feel scales with real participation.',
  },
  {
    id: 'request_supply_loop',
    name: 'Wanted request → Maker proposal → Fulfilment → Repeat ask',
    steps: [
      'Neighbour posts Gezocht',
      'Creator proposes / offers',
      'Deal completes',
      'Trust + notification paths encourage repeat',
    ],
    status: 'ready',
    notes: 'Reverse discovery surfaces exist in code.',
  },
  {
    id: 'delivery_assist_loop',
    name: 'Local offer → Optional courier → Delivery review → Reliable fulfilment',
    steps: [
      'Seller offers with fulfilment options',
      'Buyer selects delivery where available',
      'Courier completes',
      'Delivery review strengthens network',
    ],
    status: 'ready',
    notes: 'Platform identity remains marketplace — not a delivery company.',
  },
  {
    id: 'affiliate_referral_loop',
    name: 'Referral / affiliate → New user → Attribution → Programme growth',
    steps: [
      'Affiliate or invite link (/welkom, /uitnodiging, /r)',
      'New user discovers and creates value',
      'Attribution + promo tools',
    ],
    status: 'ready',
    notes: 'Programme ready; growth depends on honest partners — no fake affiliates.',
  },
];

export const RETENTION_READINESS: ReadinessItem[] = [
  {
    id: 'return_visits',
    label: 'Return visits',
    status: 'partial',
    evidence: 'Homepage feed, action center, notifications, favorites/follows.',
    gap: 'Habit loops improve with local density and push/email preference quality.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    status: 'ready',
    evidence: '/notifications, preferences API, notification-service, profile settings.',
  },
  {
    id: 'saved_searches',
    label: 'Saved searches',
    status: 'partial',
    evidence: 'useSavedSearches + AdvancedFiltersPanel (localStorage).',
    gap: 'Server-side saved-search persistence / alerts missing.',
  },
  {
    id: 'saved_creators',
    label: 'Saved creators (follows)',
    status: 'ready',
    evidence: 'FollowButton, follows API, favorites hub.',
  },
  {
    id: 'repeat_purchases_trades_services',
    label: 'Repeat purchases / trades / services',
    status: 'partial',
    evidence: 'Orders, deals, chat, favorites — re-engagement possible.',
    gap: 'No fabricated loyalty programme claims; HCP helps but is not CRM automation.',
  },
  {
    id: 'community_loyalty',
    label: 'Community loyalty',
    status: 'partial',
    evidence: 'HCP, leaderboards, community progress, growth achievement feed.',
  },
];

/** Local expansion — must match entity philosophy. */
export const LOCAL_EXPANSION_READINESS = {
  path: [
    'Neighbourhood',
    'City',
    'Region',
    'Netherlands',
    'Europe',
    'Future international',
  ] as const,
  philosophyLock: {
    closeToHome: 'Everything starts close to home.',
    distance: 'Distance determines priority, not possibility.',
    localFirst: 'local-first',
    notLocalOnly: 'not local-only',
  },
  status: 'ready' as ReadinessStatus,
  evidence:
    'GeoFeed nearby-first + entity LOCAL_FIRST_SCALE; unique craft may reach further without “international marketplace” branding.',
  contradictionCheck: 'PASS — growth expansion does not override local-first discovery priority.',
};

export const REAL_WORLD_TRUST_READINESS: ReadinessItem[] = [
  {
    id: 'real_reviews',
    label: 'Real reviews',
    status: 'ready',
    evidence: 'Token reviews, deal reviews, delivery reviews — no fabricated aggregate ratings in schema.',
  },
  {
    id: 'real_reputation',
    label: 'Real reputation',
    status: 'ready',
    evidence: 'Profile trust summary + discovery trust tiers/badges from real activity.',
  },
  {
    id: 'real_moderation',
    label: 'Real moderation',
    status: 'ready',
    evidence: 'Report APIs, admin moderation/trust queues, image moderation.',
  },
  {
    id: 'real_reporting',
    label: 'Real reporting',
    status: 'ready',
    evidence: 'ReportContentButton + /api/reports/create + /safety.',
  },
  {
    id: 'real_ambassadors',
    label: 'Real ambassadors',
    status: 'partial',
    evidence: 'Opportunity eligibility exists.',
    gap: 'Programme ops still thin without dedicated ambassador surface.',
  },
  {
    id: 'real_municipalities_partners_stories_media',
    label: 'Municipalities / partners / stories / media',
    status: 'planned',
    evidence: 'Press readiness (press@) + public entity pages.',
    gap: 'Earn only — never invent partnerships or media logos.',
  },
];

/** Ecosystem fit within HomeCheff philosophy. */
export const BUSINESS_ECOSYSTEM_FIT: Array<{
  group: string;
  fits: boolean;
  status: ReadinessStatus;
  note: string;
}> = [
  { group: 'home cooks', fits: true, status: 'ready', note: 'Core food category — homemade, not dark kitchens as identity.' },
  { group: 'restaurants', fits: true, status: 'partial', note: 'Fit when personal/local craft visible; not anonymous mass retail.' },
  { group: 'gardeners', fits: true, status: 'ready', note: 'Garden / home-grown category.' },
  { group: 'artists', fits: true, status: 'ready', note: 'Creations / creative work.' },
  { group: 'photographers', fits: true, status: 'ready', note: 'Creative services.' },
  { group: 'teachers', fits: true, status: 'ready', note: 'Lessons / knowledge.' },
  { group: 'consultants', fits: true, status: 'ready', note: 'Personal services / knowledge.' },
  { group: 'repair specialists', fits: true, status: 'ready', note: 'Repairs + craftsmanship-first.' },
  { group: 'craft makers', fits: true, status: 'ready', note: 'Handmade / studio.' },
  { group: 'delivery partners', fits: true, status: 'ready', note: 'Assist fulfilment — platform is not a delivery company.' },
  { group: 'municipal projects', fits: true, status: 'planned', note: 'Philosophy fit; blocked until real public agreements.' },
  { group: 'social initiatives', fits: true, status: 'planned', note: 'Neighbour help / community exchange fit.' },
  { group: 'small businesses', fits: true, status: 'ready', note: 'Subscriptions + seller tools when craftsmanship-first.' },
];

export const GROWTH_CAMPAIGN_READINESS: ReadinessItem[] = [
  {
    id: 'local_flyers_qr',
    label: 'Local flyer / QR campaigns',
    status: 'partial',
    evidence: 'Short links /r/[slug], welkom/uitnodiging codes, public homepage.',
    gap: 'Creative/ops playbooks outside product — preparation only here.',
  },
  {
    id: 'tiktok_instagram_facebook',
    label: 'TikTok / Instagram / Facebook',
    status: 'planned',
    evidence: 'Phase 2.5 real-world signal inventory — accounts not verified yet.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    status: 'planned',
    evidence: 'Company page planned in off-page roadmap.',
  },
  {
    id: 'google_business',
    label: 'Google Business Profile',
    status: 'blocked',
    evidence: 'Blocked until real NAP (no fabricated street/phone).',
  },
  {
    id: 'press',
    label: 'Press',
    status: 'ready',
    evidence: 'press@homecheff.eu + About/Manifest/Trust entity pack.',
  },
  {
    id: 'municipal_partnerships',
    label: 'Municipal partnerships',
    status: 'blocked',
    evidence: 'Outreach-ready materials; no claimed partnership.',
  },
  {
    id: 'community_events',
    label: 'Community events',
    status: 'planned',
    evidence: 'Activations library supports real-world neighbourhood actions.',
  },
  {
    id: 'referral_ambassadors_affiliate',
    label: 'Referral / ambassadors / affiliate',
    status: 'partial',
    evidence: 'Affiliate + invite links ready; ambassador surface partial.',
  },
];

/** Prioritised growth roadmap — preparation, not implementation. */
export const GROWTH_ROADMAP: Array<{
  priority: 1 | 2 | 3 | 4;
  item: string;
  rationale: string;
}> = [
  {
    priority: 1,
    item: 'Seed first neighbourhood creators + Wanted posts (honest density)',
    rationale: 'Network effects need real offers and requests before campaigns scale.',
  },
  {
    priority: 1,
    item: 'Creator clarity polish: what to offer / earn / trust (copy + onboarding cues)',
    rationale: 'Surfaces exist; first-run comprehension drives activation.',
  },
  {
    priority: 1,
    item: 'Buyer nearby-first orientation (guest → first discovery → first contact)',
    rationale: 'Philosophy is coded; visitors must feel distance priority immediately.',
  },
  {
    priority: 2,
    item: 'Server-side saved searches / alerts',
    rationale: 'Retention gap: saved searches are localStorage-only today.',
  },
  {
    priority: 2,
    item: 'Ambassador programme surface (ops + eligibility already partial)',
    rationale: 'Converts opportunity module into runnable local advocacy.',
  },
  {
    priority: 2,
    item: 'Authentic social channels (LinkedIn → Instagram/Facebook) with HomeCheff spelling',
    rationale: 'External entity signals from Phase 2.5 — create only real accounts.',
  },
  {
    priority: 3,
    item: 'Local flyer/QR + community events using /r and invite codes',
    rationale: 'Offline → online loops without SEO spam pages.',
  },
  {
    priority: 3,
    item: 'Press + local media with truth-bound press kit (no traction inventing)',
    rationale: 'Earn independent mentions for Knowledge Panel path.',
  },
  {
    priority: 4,
    item: 'Municipal / educational / innovation collaborations when agreements are public',
    rationale: 'Philosophy fit; blocked until real.',
  },
  {
    priority: 4,
    item: 'Europe / international expansion only after NL neighbourhood density proves loops',
    rationale: 'Preserve local-first; never rebrand as international marketplace.',
  },
];

export const GROWTH_SCORES = {
  growthReadiness: 84,
  communityReadiness: 78,
  creatorReadiness: 86,
  marketplaceReadiness: 85,
} as const;

export function growthFoundationBrief(): string {
  const count = (items: ReadinessItem[], status: ReadinessStatus) =>
    items.filter((i) => i.status === status).length;
  return [
    `objective: ${GROWTH_FOUNDATION_OBJECTIVE.to}`,
    `principle: ${GROWTH_FOUNDATION_OBJECTIVE.principle}`,
    `adoption_ready: ${count(MARKETPLACE_ADOPTION_READINESS, 'ready')}; partial: ${count(MARKETPLACE_ADOPTION_READINESS, 'partial')}; blocked: ${count(MARKETPLACE_ADOPTION_READINESS, 'blocked')}`,
    `growth_loops: ${GROWTH_LOOPS.length}`,
    `ecosystem_groups: ${BUSINESS_ECOSYSTEM_FIT.length}`,
    `roadmap_items: ${GROWTH_ROADMAP.length}`,
    `local_expansion: ${LOCAL_EXPANSION_READINESS.path.join(' → ')} (${LOCAL_EXPANSION_READINESS.contradictionCheck})`,
    `scores: growth=${GROWTH_SCORES.growthReadiness} community=${GROWTH_SCORES.communityReadiness} creator=${GROWTH_SCORES.creatorReadiness} marketplace=${GROWTH_SCORES.marketplaceReadiness}`,
    'rule: readiness documentation only — never invent usage, partners, reviews or SEO spam',
  ].join('\n');
}
