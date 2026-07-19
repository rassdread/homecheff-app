/**
 * Phase 3B.1 — sealed runtime contract unit tests (pure core).
 */
import assert from "node:assert/strict";
import {
  createFeedDiscoverySealedContract,
  FEED_DISCOVERY_WIDGET_ID,
  FEED_SEALED_INVARIANT_IDS,
  HardContractViolation,
  isSealedCapabilityProhibited,
  SEALED_WORKSPACE_PROHIBITIONS,
  stableStringify,
  validateSealedRuntimeContract,
} from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b1] sealed runtime contract");

{
  const a = createFeedDiscoverySealedContract();
  const b = createFeedDiscoverySealedContract();
  assert.equal(a.widgetId, FEED_DISCOVERY_WIDGET_ID);
  assert.equal(a.runtimeClassification, "sealed-runtime");
  assert.equal(a.renderActivation, false);
  assert.equal(a.shadowActivation, true);
  assert.equal(a.activeWriter, "legacy");
  assert.equal(a.owner, "legacy-feed-runtime");
  assert.equal(a.mountPolicy, "single-stable-mount");
  assert.equal(a.stateBoundary, "opaque");
  assert.equal(a.requestBoundary, "owned-by-widget");
  assert.equal(
    a.observerBoundary,
    "owned-by-widget-except-existing-platform-measurement",
  );
  assert.equal(a.scrollBoundary, "owned-by-widget");
  assert.equal(stableStringify(a), stableStringify(b));
  ok("feed.discovery sealed contract valid + deterministic");
}

{
  const c = createFeedDiscoverySealedContract();
  const json = JSON.parse(JSON.stringify(c));
  assert.deepEqual(json, JSON.parse(stableStringify(c)));
  assert.equal(typeof c.permittedWorkspaceCapabilities[0], "string");
  assert.equal(
    Object.values(c).some((v) => typeof v === "function"),
    false,
  );
  ok("contract serializable and free of functions");
}

{
  const c = createFeedDiscoverySealedContract();
  for (const p of SEALED_WORKSPACE_PROHIBITIONS) {
    assert.equal(isSealedCapabilityProhibited(c, p), true);
  }
  assert.equal(isSealedCapabilityProhibited(c, "declare"), false);
  assert.equal(c.invariantIds.length, FEED_SEALED_INVARIANT_IDS.length);
  ok("prohibitions enforced; invariants complete");
}

{
  const base = createFeedDiscoverySealedContract();
  assert.throws(
    () => validateSealedRuntimeContract({ ...base, renderActivation: true }),
    HardContractViolation,
  );
  assert.throws(
    () => validateSealedRuntimeContract({ ...base, shadowActivation: false }),
    HardContractViolation,
  );
  assert.throws(
    () => validateSealedRuntimeContract({ ...base, activeWriter: "workspace" }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateSealedRuntimeContract({
        ...base,
        permittedWorkspaceCapabilities: ["render"],
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateSealedRuntimeContract({
        ...base,
        prohibitedWorkspaceCapabilities: SEALED_WORKSPACE_PROHIBITIONS.filter(
          (p) => p !== "request",
        ),
      }),
    HardContractViolation,
  );
  assert.throws(
    () => validateSealedRuntimeContract(null),
    HardContractViolation,
  );
  ok("invalid contracts fail closed");
}

console.log(`\nadaptive-workspace Phase 3B.1 sealed: ${passed} assertions ok\n`);
