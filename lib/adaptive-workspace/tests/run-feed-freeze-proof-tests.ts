/**
 * Phase 3B.2 — freeze + browser-proof schema unit tests.
 */
import assert from "node:assert/strict";
import {
  createFeedDiscoveryFreezeContract,
  validateFeedDiscoveryFreezeContract,
  validateFeedBrowserProofArtifact,
  FEED_SEALED_INVARIANT_IDS,
  HardContractViolation,
} from "../index";
import type { FeedBrowserProofArtifact } from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function validProof(
  overrides?: Partial<FeedBrowserProofArtifact>,
): FeedBrowserProofArtifact {
  const invariants = FEED_SEALED_INVARIANT_IDS.map((id) => ({
    id,
    expected: "ok",
    observed: "ok",
    status: "PASS" as const,
    releaseBlocking: true as const,
  }));
  return {
    schemaVersion: 1,
    phase: "3B.2",
    branch: "identity/phase2-auth-foundation",
    commit: "6c994ca000000000000000000000000000000000",
    productionMode: true,
    browser: "chromium-puppeteer-core",
    browserVersion: "test",
    scenarios: ["OFF_INITIAL_LOAD", "SHADOW_EVALUATION"],
    invariants,
    requestSummaries: [],
    mountUnmount: { mountCount: 1, unmountCount: 0, activeInstanceCount: 1 },
    keyTransitions: {
      requestKeyTransitionCount: 0,
      nativePaintKeyTransitionCount: 0,
      lastRequestKeyHash: "abc",
      lastNativePaintKeyHash: null,
    },
    cacheInit: { resultCacheInitCount: 1, filterCacheInitCount: 0 },
    pagination: {
      paginationResetCount: 0,
      lastPaginationCursorHash: "c1",
      preparedBatchIdentityTransitionCount: 0,
      lastPreparedBatchHash: "b1",
    },
    observers: {
      intersectionObserverCreateCount: 1,
      pageIntersectionObserverDelta: 0,
      pageResizeObserverDelta: 0,
    },
    scroll: { owner: "window", before: 100, after: 100, tolerancePx: 4 },
    domSignatures: { initial: "a", afterShadowReeval: "a", equal: true },
    hydration: { errors: [], warnings: [] },
    performance: {
      feedRequestCount: 1,
      softTimingInconclusive: true,
      notes: "soft",
    },
    modes: {
      off: { evaluated: true, pass: true },
      shadow: { evaluated: true, pass: true },
      onAttempt: { allowed: false, renderActivation: false },
    },
    overallVerdict: "READY_FOR_PHASE_3B_3",
    ...overrides,
  };
}

console.log("\n[phase3b2] freeze contract");

{
  const c = createFeedDiscoveryFreezeContract({
    evidenceCommit: "6c994caabcdef",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
  });
  assert.equal(c.renderActivation, false);
  assert.equal(c.hostActivation, false);
  assert.equal(c.nextEligiblePhase, "3B.3");
  assert.equal(c.browserProofStatus, "frozen");
  assert.equal(c.modeMax, "shadow");
  ok("valid frozen contract");
}

{
  const base = createFeedDiscoveryFreezeContract({
    evidenceCommit: "6c994caabcdef",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b2/x.json",
  });
  assert.throws(
    () =>
      validateFeedDiscoveryFreezeContract({
        ...base,
        renderActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedDiscoveryFreezeContract({
        ...base,
        activeWriter: "workspace",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedDiscoveryFreezeContract({
        ...base,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedDiscoveryFreezeContract({
        ...base,
        nextEligiblePhase: "3B.4",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedDiscoveryFreezeContract({
        ...base,
        evidenceCommit: "",
      }),
    HardContractViolation,
  );
  ok("freeze fail-closed on invalid fields");
}

console.log("\n[phase3b2] browser proof schema");

{
  const a = validateFeedBrowserProofArtifact(validProof());
  assert.equal(a.overallVerdict, "READY_FOR_PHASE_3B_3");
  ok("valid proof accepted");
}

{
  assert.throws(
    () =>
      validateFeedBrowserProofArtifact(
        validProof({
          invariants: validProof().invariants.map((r, i) =>
            i === 0 ? { ...r, status: "FAIL" } : r,
          ),
        }),
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedBrowserProofArtifact(
        validProof({
          invariants: validProof().invariants.map((r, i) =>
            i === 1 ? { ...r, status: "INCONCLUSIVE" } : r,
          ),
        }),
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedBrowserProofArtifact(
        validProof({
          invariants: validProof().invariants.slice(1),
        }),
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedBrowserProofArtifact(
        validProof({ productionMode: false as unknown as true }),
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedBrowserProofArtifact(
        validProof({ overallVerdict: "NOT_READY_FOR_PHASE_3B_3" }),
      ),
    HardContractViolation,
  );
  ok("invalid / incomplete / inconclusive proofs fail");
}

console.log(`\nadaptive-workspace Phase 3B.2 freeze/proof: ${passed} assertions ok\n`);
