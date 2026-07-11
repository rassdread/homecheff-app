/**
 * Phase 13W — Living Platform route registry (SSOT).
 */

export const LIVING_PLATFORM_LAST_REVIEWED = '2026-07-11';

export const LIVING_PLATFORM_PATHS = {
  evidence: '/evidence',
  statistics: '/statistics',
  stories: '/stories',
  timeline: '/timeline',
  reports: '/reports',
  howHomeCheffGrows: '/how-homecheff-grows',
} as const;

export type LivingPlatformPathKey = keyof typeof LIVING_PLATFORM_PATHS;

export const LIVING_PLATFORM_NAMESPACES = {
  evidence: 'livingPlatformEvidence',
  statistics: 'livingPlatformStatistics',
  stories: 'livingPlatformStories',
  timeline: 'livingPlatformTimeline',
  reports: 'livingPlatformReports',
  howHomeCheffGrows: 'livingPlatformHowGrows',
  shared: 'livingPlatformShared',
} as const;

export function collectLivingPlatformPublicPaths(): string[] {
  return Object.values(LIVING_PLATFORM_PATHS);
}

/** Case study framework — only published entries with permission. */
export type CaseStudyRecord = {
  id: string;
  slug: string;
  published: boolean;
  permissionVerified: boolean;
  participantLabel: string;
  challengeKey: string;
  solutionKey: string;
  platformRoleKey: string;
  outcomeKey: string;
  lessonsKey: string;
  relatedDocPaths: string[];
  manifestConnectionKey: string;
};

/** Published community stories — empty until real participants grant permission. */
export const PUBLISHED_CASE_STUDIES: CaseStudyRecord[] = [];

export type TimelineEventKind = 'shipped' | 'planned';

export type TimelineEvent = {
  id: string;
  date: string;
  kind: TimelineEventKind;
  titleKey: string;
  bodyKey: string;
};

/** Factual platform milestones — planned entries clearly marked. */
export const PLATFORM_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-2025-platform',
    date: '2025',
    kind: 'shipped',
    titleKey: 'event2025PlatformTitle',
    bodyKey: 'event2025PlatformBody',
  },
  {
    id: 'tl-2026-manifest',
    date: '2026-07',
    kind: 'shipped',
    titleKey: 'event2026ManifestTitle',
    bodyKey: 'event2026ManifestBody',
  },
  {
    id: 'tl-2026-open-knowledge',
    date: '2026-07',
    kind: 'shipped',
    titleKey: 'event2026OpenKnowledgeTitle',
    bodyKey: 'event2026OpenKnowledgeBody',
  },
  {
    id: 'tl-2026-machine-trust',
    date: '2026-07',
    kind: 'shipped',
    titleKey: 'event2026MachineTrustTitle',
    bodyKey: 'event2026MachineTrustBody',
  },
  {
    id: 'tl-2026-living-platform',
    date: '2026-07',
    kind: 'shipped',
    titleKey: 'event2026LivingPlatformTitle',
    bodyKey: 'event2026LivingPlatformBody',
  },
  {
    id: 'tl-future-transparency-reports',
    date: 'planned',
    kind: 'planned',
    titleKey: 'eventFutureReportsTitle',
    bodyKey: 'eventFutureReportsBody',
  },
];

export type TransparencyReportKind =
  | 'quarterly'
  | 'safety'
  | 'moderation'
  | 'community'
  | 'platform';

export type TransparencyReportSlot = {
  id: string;
  kind: TransparencyReportKind;
  titleKey: string;
  descriptionKey: string;
  /** Populated when a report is published — initially empty. */
  publishedAt: string | null;
  href: string | null;
};

/** Report architecture — slots only until factual reports exist. */
export const TRANSPARENCY_REPORT_SLOTS: TransparencyReportSlot[] = [
  {
    id: 'report-quarterly',
    kind: 'quarterly',
    titleKey: 'reportQuarterlyTitle',
    descriptionKey: 'reportQuarterlyDesc',
    publishedAt: null,
    href: null,
  },
  {
    id: 'report-safety',
    kind: 'safety',
    titleKey: 'reportSafetyTitle',
    descriptionKey: 'reportSafetyDesc',
    publishedAt: null,
    href: null,
  },
  {
    id: 'report-moderation',
    kind: 'moderation',
    titleKey: 'reportModerationTitle',
    descriptionKey: 'reportModerationDesc',
    publishedAt: null,
    href: null,
  },
  {
    id: 'report-community',
    kind: 'community',
    titleKey: 'reportCommunityTitle',
    descriptionKey: 'reportCommunityDesc',
    publishedAt: null,
    href: null,
  },
  {
    id: 'report-platform',
    kind: 'platform',
    titleKey: 'reportPlatformTitle',
    descriptionKey: 'reportPlatformDesc',
    publishedAt: null,
    href: null,
  },
];

export const AUTHORITY_HUB_LINKS = [
  { href: '/constitution', labelKey: 'linkConstitution' },
  { href: '/manifest', labelKey: 'linkManifest' },
  { href: '/docs', labelKey: 'linkDocs' },
  { href: '/evidence', labelKey: 'linkEvidence' },
  { href: '/statistics', labelKey: 'linkStatistics' },
  { href: '/trust', labelKey: 'linkTrust' },
  { href: '/glossary', labelKey: 'linkGlossary' },
  { href: '/timeline', labelKey: 'linkTimeline' },
  { href: '/stories', labelKey: 'linkStories' },
  { href: '/reports', labelKey: 'linkReports' },
  { href: '/how-homecheff-grows', labelKey: 'linkHowGrows' },
] as const;
