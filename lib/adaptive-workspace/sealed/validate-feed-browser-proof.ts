/**
 * Phase 3B.2 — machine-readable browser-proof artifact schema + validation.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_SEALED_INVARIANT_IDS,
  type FeedSealedInvariantId,
} from "./feed-discovery-invariants";

export const FEED_BROWSER_PROOF_SCHEMA_VERSION = 1 as const;

export type FeedBrowserProofStatus =
  | "PASS"
  | "FAIL"
  | "INCONCLUSIVE"
  | "NOT_APPLICABLE";

export type FeedBrowserProofInvariantRow = {
  id: FeedSealedInvariantId;
  expected: string;
  observed: string;
  status: FeedBrowserProofStatus;
  releaseBlocking: true;
};

export type FeedBrowserProofArtifact = {
  schemaVersion: typeof FEED_BROWSER_PROOF_SCHEMA_VERSION;
  phase: "3B.2";
  branch: string;
  commit: string;
  productionMode: true;
  browser: string;
  browserVersion: string;
  scenarios: string[];
  invariants: FeedBrowserProofInvariantRow[];
  requestSummaries: Array<{
    scenario: string;
    method: string;
    path: string;
    status: number | null;
    sequence: number;
  }>;
  mountUnmount: {
    mountCount: number;
    unmountCount: number;
    activeInstanceCount: number;
  };
  keyTransitions: {
    requestKeyTransitionCount: number;
    nativePaintKeyTransitionCount: number;
    lastRequestKeyHash: string | null;
    lastNativePaintKeyHash: string | null;
  };
  cacheInit: {
    resultCacheInitCount: number;
    filterCacheInitCount: number;
  };
  pagination: {
    paginationResetCount: number;
    lastPaginationCursorHash: string | null;
    preparedBatchIdentityTransitionCount: number;
    lastPreparedBatchHash: string | null;
  };
  observers: {
    intersectionObserverCreateCount: number;
    pageIntersectionObserverDelta: number;
    pageResizeObserverDelta: number;
  };
  scroll: {
    owner: string;
    before: number;
    after: number;
    tolerancePx: number;
  };
  domSignatures: {
    initial: string;
    afterShadowReeval: string;
    equal: boolean;
  };
  hydration: {
    errors: string[];
    warnings: string[];
  };
  performance: {
    feedRequestCount: number;
    softTimingInconclusive: boolean;
    notes: string;
  };
  modes: {
    off: { evaluated: boolean; pass: boolean };
    shadow: { evaluated: boolean; pass: boolean };
    onAttempt: { allowed: false; renderActivation: false };
  };
  overallVerdict: "READY_FOR_PHASE_3B_3" | "NOT_READY_FOR_PHASE_3B_3";
};

const STATUS_SET = new Set([
  "PASS",
  "FAIL",
  "INCONCLUSIVE",
  "NOT_APPLICABLE",
]);

export function validateFeedBrowserProofArtifact(
  candidate: unknown,
): FeedBrowserProofArtifact {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_PROOF_INVALID",
      "Browser proof artifact must be an object",
    );
  }
  const a = candidate as FeedBrowserProofArtifact;

  if (a.schemaVersion !== FEED_BROWSER_PROOF_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_PROOF_SCHEMA",
      "Unsupported proof schemaVersion",
    );
  }
  if (a.phase !== "3B.2") {
    throw new HardContractViolation("FEED_PROOF_PHASE", "phase must be 3B.2");
  }
  if (a.productionMode !== true) {
    throw new HardContractViolation(
      "FEED_PROOF_PROD",
      "development-only proof is not valid for freeze",
    );
  }
  if (typeof a.commit !== "string" || a.commit.length < 7) {
    throw new HardContractViolation(
      "FEED_PROOF_COMMIT",
      "commit SHA required",
    );
  }
  if (!Array.isArray(a.invariants) || a.invariants.length === 0) {
    throw new HardContractViolation(
      "FEED_PROOF_INVARIANTS",
      "invariants required",
    );
  }

  const seen = new Set<string>();
  for (const row of a.invariants) {
    if (!FEED_SEALED_INVARIANT_IDS.includes(row.id)) {
      throw new HardContractViolation(
        "FEED_PROOF_INVARIANT_UNKNOWN",
        `Unknown invariant ${row.id}`,
      );
    }
    if (!STATUS_SET.has(row.status)) {
      throw new HardContractViolation(
        "FEED_PROOF_STATUS",
        `Invalid status for ${row.id}`,
      );
    }
    if (row.releaseBlocking !== true) {
      throw new HardContractViolation(
        "FEED_PROOF_BLOCKING_FLAG",
        `${row.id} must be releaseBlocking`,
      );
    }
    if (row.status === "FAIL" || row.status === "INCONCLUSIVE") {
      throw new HardContractViolation(
        "FEED_PROOF_BLOCKING_STATUS",
        `Release-blocking invariant ${row.id} is ${row.status}`,
      );
    }
    seen.add(row.id);
  }

  for (const id of FEED_SEALED_INVARIANT_IDS) {
    if (!seen.has(id)) {
      throw new HardContractViolation(
        "FEED_PROOF_MISSING_INVARIANT",
        `Missing release-blocking invariant ${id}`,
      );
    }
  }

  if (a.overallVerdict !== "READY_FOR_PHASE_3B_3") {
    throw new HardContractViolation(
      "FEED_PROOF_VERDICT",
      "overallVerdict must be READY_FOR_PHASE_3B_3 for freeze acceptance",
    );
  }

  if (a.modes?.onAttempt?.allowed !== false) {
    throw new HardContractViolation(
      "FEED_PROOF_ON",
      "Feed ON attempt must remain disallowed",
    );
  }

  return a;
}
