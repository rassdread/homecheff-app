import type {
  ProfileCapacityBudget,
  ProfileFixtureBands,
  WorkspaceProfile,
} from "../types/workspace";

/**
 * TEST FIXTURE ONLY — Phase 1C provisional bands.
 * NOT production breakpoints. Replace via calibration later.
 */
export const PROFILE_TEST_FIXTURE_BANDS: ProfileFixtureBands = {
  compactMaxExclusive: 720,
  comfortMaxExclusive: 1024,
  expandedMaxExclusive: 1440,
  shortHeightMaxExclusive: 480,
};

const PROFILE_ORDER: WorkspaceProfile[] = [
  "COMPACT",
  "COMFORT",
  "EXPANDED",
  "PROFESSIONAL",
];

function bandFromWidth(
  widthPx: number,
  bands: ProfileFixtureBands,
): WorkspaceProfile {
  if (widthPx < bands.compactMaxExclusive) return "COMPACT";
  if (widthPx < bands.comfortMaxExclusive) return "COMFORT";
  if (widthPx < bands.expandedMaxExclusive) return "EXPANDED";
  return "PROFESSIONAL";
}

function demote(profile: WorkspaceProfile): WorkspaceProfile {
  const i = PROFILE_ORDER.indexOf(profile);
  return PROFILE_ORDER[Math.max(0, i - 1)]!;
}

export function resolveWorkspaceProfile(args: {
  usableWidthPx: number;
  usableHeightPx: number;
  /** TEST FIXTURE bands — injectable for tests */
  bands?: ProfileFixtureBands;
}): {
  profile: WorkspaceProfile;
  heightDemoted: boolean;
  budget: ProfileCapacityBudget;
} {
  const bands = args.bands ?? PROFILE_TEST_FIXTURE_BANDS;
  let profile = bandFromWidth(args.usableWidthPx, bands);
  let heightDemoted = false;
  if (args.usableHeightPx < bands.shortHeightMaxExclusive && profile !== "COMPACT") {
    // Height demotes supporting capacity band; primary still placed later.
    profile = demote(profile);
    heightDemoted = true;
  }
  return {
    profile,
    heightDemoted,
    budget: capacityBudgetForProfile(profile),
  };
}

export function capacityBudgetForProfile(
  profile: WorkspaceProfile,
): ProfileCapacityBudget {
  switch (profile) {
    case "COMPACT":
      return {
        profile,
        maxPersistentSupportingPanels: 0,
        maxUtilityPanels: 0,
        maxConcurrentTransientPanels: 1,
        keepAlivePolicy: "sealed-keep",
        primaryMinWidthShare: 1,
      };
    case "COMFORT":
      return {
        profile,
        maxPersistentSupportingPanels: 1,
        maxUtilityPanels: 0,
        maxConcurrentTransientPanels: 2,
        keepAlivePolicy: "prefer-keep",
        primaryMinWidthShare: 0.6,
      };
    case "EXPANDED":
      return {
        profile,
        maxPersistentSupportingPanels: 2,
        maxUtilityPanels: 0,
        maxConcurrentTransientPanels: 2,
        keepAlivePolicy: "prefer-keep",
        primaryMinWidthShare: 0.45,
      };
    case "PROFESSIONAL":
      return {
        profile,
        maxPersistentSupportingPanels: 2,
        maxUtilityPanels: 2,
        maxConcurrentTransientPanels: 3,
        keepAlivePolicy: "prefer-keep",
        primaryMinWidthShare: 0.4,
      };
  }
}
