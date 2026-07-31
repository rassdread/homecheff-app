/**
 * WX Phase 1B.1 — Independently authored Workspace Mode Engine fixtures.
 *
 * Explicit expected outputs for AvailableSpace vectors.
 * These are reviewable constants — NOT derived by mirroring resolveWorkspaceMode.
 *
 * Authority: WMS Mode vocabulary + sealed numeric policy bands used by 1B.1
 * (720 / 1024 / 1440 / 640 carve-out / 480 short-height), authored as fixtures.
 */

import type {
  WorkspaceModeId,
  WorkspacePosture,
} from "../resolve-workspace-mode";

export type WorkspaceModeVectorFixture = {
  id: string;
  /** Human-readable purpose for the vector. */
  purpose: string;
  usableWidthPx: number;
  usableHeightPx: number;
  expect: {
    mode: WorkspaceModeId;
    posture: WorkspacePosture;
    landscapeCarveOut: boolean;
    heightDemoted: boolean;
  };
};

/**
 * Boundary and representative vectors.
 * Below / at / above every sealed width and height threshold, with unrelated
 * dimensions held constant where the rule under test requires isolation.
 */
export const WORKSPACE_MODE_ENGINE_VECTORS: readonly WorkspaceModeVectorFixture[] =
  [
    // --- Width 720 (Browse ↔ Hybrid), height held constant portrait ---
    {
      id: "w719-portrait",
      purpose: "width 720 − 1 → browse",
      usableWidthPx: 719,
      usableHeightPx: 800,
      expect: {
        mode: "browse",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "w720-portrait",
      purpose: "width 720 exact → hybrid-workspace",
      usableWidthPx: 720,
      usableHeightPx: 800,
      expect: {
        mode: "hybrid-workspace",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "w721-portrait",
      purpose: "width 720 + 1 → hybrid-workspace",
      usableWidthPx: 721,
      usableHeightPx: 800,
      expect: {
        mode: "hybrid-workspace",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Width 1024 (Hybrid ↔ Full), height held constant landscape ---
    {
      id: "w1023-landscape",
      purpose: "width 1024 − 1 → hybrid-workspace",
      usableWidthPx: 1023,
      usableHeightPx: 800,
      expect: {
        mode: "hybrid-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "w1024-landscape",
      purpose: "width 1024 exact → full-workspace",
      usableWidthPx: 1024,
      usableHeightPx: 800,
      expect: {
        mode: "full-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "w1025-landscape",
      purpose: "width 1024 + 1 → full-workspace",
      usableWidthPx: 1025,
      usableHeightPx: 800,
      expect: {
        mode: "full-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Width 1440 (Full ↔ Professional), height held constant ---
    {
      id: "w1439-landscape",
      purpose: "width 1440 − 1 → full-workspace",
      usableWidthPx: 1439,
      usableHeightPx: 900,
      expect: {
        mode: "full-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "w1440-landscape",
      purpose: "width 1440 exact → professional-workspace",
      usableWidthPx: 1440,
      usableHeightPx: 900,
      expect: {
        mode: "professional-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "w1441-landscape",
      purpose: "width 1440 + 1 → professional-workspace",
      usableWidthPx: 1441,
      usableHeightPx: 900,
      expect: {
        mode: "professional-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Carve-out 640 (landscape + compact width), height held short landscape ---
    {
      id: "carve-639",
      purpose: "carve-out 640 − 1 landscape → browse (no carve)",
      usableWidthPx: 639,
      usableHeightPx: 300,
      expect: {
        mode: "browse",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "carve-640",
      purpose: "carve-out 640 exact → compact-workspace",
      usableWidthPx: 640,
      usableHeightPx: 300,
      expect: {
        mode: "compact-workspace",
        posture: "landscape",
        landscapeCarveOut: true,
        heightDemoted: false,
      },
    },
    {
      id: "carve-641",
      purpose: "carve-out 640 + 1 → compact-workspace",
      usableWidthPx: 641,
      usableHeightPx: 300,
      expect: {
        mode: "compact-workspace",
        posture: "landscape",
        landscapeCarveOut: true,
        heightDemoted: false,
      },
    },
    {
      id: "carve-portrait-640",
      purpose: "width 640 portrait → browse (carve requires landscape)",
      usableWidthPx: 640,
      usableHeightPx: 800,
      expect: {
        mode: "browse",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Short-height 480 demotion (Professional entry width held) ---
    {
      id: "demote-pro-479",
      purpose: "height 480 − 1 at professional width → demote to full",
      usableWidthPx: 1600,
      usableHeightPx: 479,
      expect: {
        mode: "full-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: true,
      },
    },
    {
      id: "demote-pro-480",
      purpose: "height 480 exact at professional width → no demote",
      usableWidthPx: 1600,
      usableHeightPx: 480,
      expect: {
        mode: "professional-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "demote-pro-481",
      purpose: "height 480 + 1 at professional width → no demote",
      usableWidthPx: 1600,
      usableHeightPx: 481,
      expect: {
        mode: "professional-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Short-height 480 demotion (Full entry width held) ---
    {
      id: "demote-full-479",
      purpose: "height 480 − 1 at full width → demote to hybrid",
      usableWidthPx: 1200,
      usableHeightPx: 479,
      expect: {
        mode: "hybrid-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: true,
      },
    },
    {
      id: "demote-full-480",
      purpose: "height 480 exact at full width → no demote",
      usableWidthPx: 1200,
      usableHeightPx: 480,
      expect: {
        mode: "full-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Compact mid width landscape (carve active, not demoted) ---
    {
      id: "compact-700x320",
      purpose: "compact landscape carve representative",
      usableWidthPx: 700,
      usableHeightPx: 320,
      expect: {
        mode: "compact-workspace",
        posture: "landscape",
        landscapeCarveOut: true,
        heightDemoted: false,
      },
    },

    // --- Representative portrait / landscape matrix ---
    {
      id: "narrow-320x568",
      purpose: "very narrow supported AvailableSpace → browse portrait",
      usableWidthPx: 320,
      usableHeightPx: 568,
      expect: {
        mode: "browse",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "narrow-390x844",
      purpose: "phone-class portrait → browse",
      usableWidthPx: 390,
      usableHeightPx: 844,
      expect: {
        mode: "browse",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "mid-landscape-844x390",
      purpose: "mid landscape (≥720) → hybrid (not compact carve)",
      usableWidthPx: 844,
      usableHeightPx: 390,
      expect: {
        mode: "hybrid-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "tablet-768x1024",
      purpose: "tablet portrait hybrid",
      usableWidthPx: 768,
      usableHeightPx: 1024,
      expect: {
        mode: "hybrid-workspace",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "desktop-1280x800",
      purpose: "desktop full-workspace",
      usableWidthPx: 1280,
      usableHeightPx: 800,
      expect: {
        mode: "full-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "ultrawide-2560x1440",
      purpose: "very large AvailableSpace → professional",
      usableWidthPx: 2560,
      usableHeightPx: 1440,
      expect: {
        mode: "professional-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },

    // --- Posture isolation (mode held hybrid by width) ---
    {
      id: "square-800x800",
      purpose: "equal width/height → portrait posture",
      usableWidthPx: 800,
      usableHeightPx: 800,
      expect: {
        mode: "hybrid-workspace",
        posture: "portrait",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
    {
      id: "posture-801x800",
      purpose: "width > height → landscape posture",
      usableWidthPx: 801,
      usableHeightPx: 800,
      expect: {
        mode: "hybrid-workspace",
        posture: "landscape",
        landscapeCarveOut: false,
        heightDemoted: false,
      },
    },
  ] as const;

/** Bands declared for documentation / sync assertions (not used to compute expects). */
export const WORKSPACE_MODE_ENGINE_DECLARED_THRESHOLDS = {
  width720: 720,
  width1024: 1024,
  width1440: 1440,
  carveOut640: 640,
  shortHeight480: 480,
} as const;
