/**
 * Phase 3B.1 — feed.discovery shadow + diagnostics + instrumentation tests.
 */
import assert from "node:assert/strict";
import {
  evaluateFeedDiscoveryShadow,
  feedDiscoveryShadowHasNoRenderer,
  peekFeedDiscoveryDiagnosticsSnapshot,
  readFeedDiscoveryDiagnosticsSnapshot,
} from "../feed";
import {
  enableFeedSealedInstrumentationForTests,
  feedSealedNoteGeoFeedMount,
  feedSealedNoteGeoFeedUnmount,
  feedSealedNoteRequestStart,
  readFeedSealedInstrumentationCounters,
  resetFeedSealedInstrumentationForTests,
} from "@/lib/feed/feed-sealed-runtime-instrumentation";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

enableFeedSealedInstrumentationForTests(true);
resetFeedSealedInstrumentationForTests();

console.log("\n[phase3b1] shadow declaration");

{
  const d = evaluateFeedDiscoveryShadow();
  assert.equal(d.widgetId, "feed.discovery");
  assert.equal(d.renderActivation, false);
  assert.equal(d.shadowActivation, true);
  assert.equal(d.activeWriter, "legacy");
  assert.equal(d.runtimeClassification, "sealed-runtime");
  assert.equal(d.workspaceRendererRegistered, false);
  assert.equal(feedDiscoveryShadowHasNoRenderer(d), true);
  assert.equal(d.manifest.id, "feed.discovery");
  assert.equal(d.sealedContract.renderActivation, false);
  ok("shadow declaration: sealed, no renderer, legacy writer");
}

{
  resetFeedSealedInstrumentationForTests();
  const before = readFeedSealedInstrumentationCounters();
  assert.equal(before.contractEvaluationCount, 0);
  assert.equal(before.mountCount, 0);
  evaluateFeedDiscoveryShadow();
  const after = readFeedSealedInstrumentationCounters();
  assert.equal(after.contractEvaluationCount, 1);
  assert.equal(after.mountCount, 0);
  assert.equal(after.requestStartCount, 0);
  assert.equal(after.unmountCount, 0);
  assert.equal(after.activeInstanceCount, 0);
  ok("shadow evaluation only bumps evaluation count");
}

console.log("\n[phase3b1] diagnostics");

{
  resetFeedSealedInstrumentationForTests();
  const s1 = peekFeedDiscoveryDiagnosticsSnapshot();
  const s2 = peekFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(s1.mountCount, 0);
  assert.equal(s1.renderActivation, false);
  assert.equal(s1.shadowActivation, true);
  assert.equal(s1.activeWriter, "legacy");
  assert.equal(s1.sampleSequence, s2.sampleSequence);
  assert.equal(s1.contractEvaluationCount, 0);
  assert.equal(
    readFeedSealedInstrumentationCounters().contractEvaluationCount,
    0,
  );
  ok("initial snapshot stable; peek does not bump evaluation");
}

{
  resetFeedSealedInstrumentationForTests();
  feedSealedNoteGeoFeedMount();
  let snap = peekFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(snap.mountCount, 1);
  assert.equal(snap.activeInstanceCount, 1);
  feedSealedNoteGeoFeedMount();
  snap = peekFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(snap.mountCount, 2);
  assert.equal(snap.activeInstanceCount, 2);
  feedSealedNoteGeoFeedUnmount();
  snap = peekFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(snap.unmountCount, 1);
  assert.equal(snap.activeInstanceCount, 1);
  feedSealedNoteGeoFeedUnmount();
  feedSealedNoteGeoFeedUnmount();
  snap = peekFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(snap.unmountCount, 3);
  assert.equal(snap.activeInstanceCount, 0);
  ok("mount/unmount increments; active count never negative");
}

{
  resetFeedSealedInstrumentationForTests();
  feedSealedNoteRequestStart();
  const before = peekFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(before.requestCount, 1);
  const afterRead = readFeedDiscoveryDiagnosticsSnapshot();
  assert.equal(afterRead.requestCount, 1);
  assert.equal(
    readFeedSealedInstrumentationCounters().requestStartCount,
    1,
  );
  assert.equal(afterRead.renderActivation, false);
  ok("snapshot read-only; does not steer renderer or mutate counters");
}

{
  resetFeedSealedInstrumentationForTests();
  const d = evaluateFeedDiscoveryShadow();
  const snap = readFeedDiscoveryDiagnosticsSnapshot({ declaration: d });
  assert.equal(snap.contractEvaluationCount, 1);
  assert.equal(snap.sealedContract.widgetId, "feed.discovery");
  assert.equal(
    snap.invariantStatuses.FEED_GEOFEED_SINGLE_MOUNT,
    "instrumented",
  );
  assert.equal(
    snap.invariantStatuses.FEED_VISIBLE_DOM_UNCHANGED,
    "not-directly-instrumented-in-3b1",
  );
  ok("diagnostics include invariant instrument statuses");
}

console.log(
  `\nadaptive-workspace-react Phase 3B.1 feed sealed: ${passed} assertions ok\n`,
);
