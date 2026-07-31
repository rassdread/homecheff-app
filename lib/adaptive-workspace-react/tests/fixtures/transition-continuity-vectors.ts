/**
 * WX Phase 1B.2 remediation — independently authored transition continuity fixtures.
 *
 * Explicit expected outcomes only. Must NOT import or call resolveWorkspaceMode /
 * describeWorkspaceModeTransition / simulateModeTransitionAcrossSpace.
 * Must NOT reimplement band thresholds as branching logic.
 */

export type TransitionPairFixture = {
  id: string;
  category:
    | "mode-boundary"
    | "same-mode-noop"
    | "reverse"
    | "repeated"
    | "posture-only";
  fromWidthPx: number;
  fromHeightPx: number;
  toWidthPx: number;
  toHeightPx: number;
  /** Independently authored expected modes (AvailableSpace honesty). */
  expectedFromMode: string;
  expectedToMode: string;
  expectedModeChanged: boolean;
  /** Contract: remount is never authorized. */
  expectedRemountAuthorized: false;
  expectedFeedIdentityPreserved: true;
};

/** Permitted Mode-to-Mode categories + reverse + same-Mode + posture. */
export const TRANSITION_PAIR_FIXTURES: readonly TransitionPairFixture[] = [
  {
    id: "browse-to-hybrid-720",
    category: "mode-boundary",
    fromWidthPx: 719,
    fromHeightPx: 800,
    toWidthPx: 720,
    toHeightPx: 800,
    expectedFromMode: "browse",
    expectedToMode: "hybrid-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "hybrid-to-browse-719",
    category: "reverse",
    fromWidthPx: 720,
    fromHeightPx: 800,
    toWidthPx: 719,
    toHeightPx: 800,
    expectedFromMode: "hybrid-workspace",
    expectedToMode: "browse",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "hybrid-to-full-1024",
    category: "mode-boundary",
    fromWidthPx: 1023,
    fromHeightPx: 800,
    toWidthPx: 1024,
    toHeightPx: 800,
    expectedFromMode: "hybrid-workspace",
    expectedToMode: "full-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "full-to-hybrid-1023",
    category: "reverse",
    fromWidthPx: 1024,
    fromHeightPx: 800,
    toWidthPx: 1023,
    toHeightPx: 800,
    expectedFromMode: "full-workspace",
    expectedToMode: "hybrid-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "full-to-professional-1440",
    category: "mode-boundary",
    fromWidthPx: 1439,
    fromHeightPx: 900,
    toWidthPx: 1440,
    toHeightPx: 900,
    expectedFromMode: "full-workspace",
    expectedToMode: "professional-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "professional-to-full-1439",
    category: "reverse",
    fromWidthPx: 1440,
    fromHeightPx: 900,
    toWidthPx: 1439,
    toHeightPx: 900,
    expectedFromMode: "professional-workspace",
    expectedToMode: "full-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "browse-to-full",
    category: "mode-boundary",
    fromWidthPx: 390,
    fromHeightPx: 844,
    toWidthPx: 1280,
    toHeightPx: 800,
    expectedFromMode: "browse",
    expectedToMode: "full-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "full-to-browse",
    category: "reverse",
    fromWidthPx: 1280,
    fromHeightPx: 800,
    toWidthPx: 390,
    toHeightPx: 844,
    expectedFromMode: "full-workspace",
    expectedToMode: "browse",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "professional-to-browse",
    category: "mode-boundary",
    fromWidthPx: 1920,
    fromHeightPx: 1080,
    toWidthPx: 390,
    toHeightPx: 844,
    expectedFromMode: "professional-workspace",
    expectedToMode: "browse",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "hybrid-same-mode-noop",
    category: "same-mode-noop",
    fromWidthPx: 800,
    fromHeightPx: 900,
    toWidthPx: 900,
    toHeightPx: 900,
    expectedFromMode: "hybrid-workspace",
    expectedToMode: "hybrid-workspace",
    expectedModeChanged: false,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "full-same-mode-noop",
    category: "same-mode-noop",
    fromWidthPx: 1100,
    fromHeightPx: 800,
    toWidthPx: 1300,
    toHeightPx: 800,
    expectedFromMode: "full-workspace",
    expectedToMode: "full-workspace",
    expectedModeChanged: false,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "portrait-to-landscape-hybrid",
    category: "posture-only",
    fromWidthPx: 800,
    fromHeightPx: 1000,
    toWidthPx: 900,
    toHeightPx: 700,
    expectedFromMode: "hybrid-workspace",
    expectedToMode: "hybrid-workspace",
    expectedModeChanged: false,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "repeated-720-below",
    category: "repeated",
    fromWidthPx: 720,
    fromHeightPx: 800,
    toWidthPx: 710,
    toHeightPx: 800,
    expectedFromMode: "hybrid-workspace",
    expectedToMode: "browse",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
  {
    id: "repeated-720-above",
    category: "repeated",
    fromWidthPx: 710,
    fromHeightPx: 800,
    toWidthPx: 720,
    toHeightPx: 800,
    expectedFromMode: "browse",
    expectedToMode: "hybrid-workspace",
    expectedModeChanged: true,
    expectedRemountAuthorized: false,
    expectedFeedIdentityPreserved: true,
  },
] as const;

/** Fail-closed / invalid input fixtures (explicit expected dims). */
export const FAIL_CLOSED_FIXTURES = [
  {
    id: "zero-box-holds-last-stable",
    previous: { widthPx: 1280, heightPx: 800 },
    incomingWidthPx: 0,
    incomingHeightPx: 0,
    fallbackWidthPx: 320,
    fallbackHeightPx: 568,
    lastStable: { widthPx: 1280, heightPx: 800 },
    expectedWidth: 1280,
    expectedHeight: 800,
    expectedUsedLastStable: true,
  },
  {
    id: "nan-box-holds-last-stable",
    previous: { widthPx: 900, heightPx: 700 },
    incomingWidthPx: Number.NaN,
    incomingHeightPx: Number.NaN,
    fallbackWidthPx: 320,
    fallbackHeightPx: 568,
    lastStable: { widthPx: 900, heightPx: 700 },
    expectedWidth: 900,
    expectedHeight: 700,
    expectedUsedLastStable: true,
  },
  {
    id: "no-stable-uses-fallback",
    previous: null,
    incomingWidthPx: -1,
    incomingHeightPx: -1,
    fallbackWidthPx: 390,
    fallbackHeightPx: 844,
    lastStable: null,
    expectedWidth: 390,
    expectedHeight: 844,
    expectedUsedLastStable: false,
  },
] as const;

/** Contract policy assertions — explicit boolean fixtures (not browser proof). */
export const CONTINUITY_POLICY_FIXTURES = {
  remountOnModeChange: false,
  reloadFeedOnModeChange: false,
  resetScrollOnModeChange: false,
  resetFiltersOnModeChange: false,
  duplicateObserversOnModeChange: false,
  neverKeyPrimaryByMode: true,
  neverUnmountPrimaryOnModeChange: true,
  railsHideWithoutUnmount: true,
  primarySlotKey: "aw-slot-primary",
  startSlotKey: "aw-slot-start",
  endSlotKey: "aw-slot-end",
  orientationSlotKey: "aw-slot-orientation",
  contractId: "wx-transition-continuity-v1",
  phase: "1b.2",
} as const;

/** Boundaries that browser oscillation must exercise (measured AvailableSpace). */
export const OSCILLATION_BOUNDARY_TARGETS = [720, 1024, 1440] as const;

export const OSCILLATIONS_PER_BOUNDARY_MIN = 5;
