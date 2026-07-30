#!/usr/bin/env node
/**
 * Administrative Release Closure validator (no runtime changes).
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const AW_R6 = "be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170";

execSync(`git merge-base --is-ancestor ${AW_R6} HEAD`, { cwd: root, stdio: "pipe" });

const lineage = [
  "c281c27173e3393f97b8e4cad703563dc0fb77f3",
  "df9b9b9a86ee31db79a546a2ebfa4c33036e6738",
  "227c2ee6cb89e5a838d9df2e45c08dd2073ea152",
  "fe4ad5e54e7f5408a826398059d60f278c8fe7be",
  "ac34031c8e16b70593392c484902d5f007b6f916",
  "aa693a51190799197a2a0580b9e7dc0db1ecf621",
  "f740f6350d01bbe7f1b3733610edbb6f275270d1",
  "d8c4a1bdb3ca2ce3acc8dbfcfe70f2c6bbf690e3",
  AW_R6,
];
for (const hash of lineage) {
  execSync(`git merge-base --is-ancestor ${hash} ${AW_R6}`, {
    cwd: root,
    stdio: "pipe",
  });
}

const pack = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/aw-r6/aw-r6-controlled-workspace-production-feed-on-freeze-pack.json",
    ),
    "utf8",
  ),
);
assert.equal(pack.freezeCommit, "pending");
assert.equal(pack.finalVerdict, "ADAPTIVE_WORKSPACE_PRODUCTION_LIVE_FROZEN");
assert.equal(pack.feedOnAuthorized, true);
assert.equal(pack.productionPromotionAuthorized, true);

const roadmap = readFileSync(
  join(
    root,
    "docs/architecture/homecheff-adaptive-workspace-condensed-implementation-roadmap.md",
  ),
  "utf8",
);
assert.match(roadmap, /be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170/);
assert.match(roadmap, /no AW-R7/i);
assert.match(roadmap, /Next migration stage:\*\* `none`|Next implementation stage \| \*\*none\*\*/i);

const platform = readFileSync(
  join(
    root,
    "docs/architecture/homecheff-adaptive-workspace-platform-contract-v1.md",
  ),
  "utf8",
);
assert.match(platform, /Feed ON \| true/);
assert.match(platform, /closureFreeze/);

const handoff = readFileSync(
  join(
    root,
    "docs/architecture/homecheff-adaptive-workspace-master-handoff-v3.md",
  ),
  "utf8",
);
assert.match(handoff, /closureFreeze=pending/);
assert.match(handoff, /be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170/);
assert.match(handoff, /no AW-R7/i);

const notes = readFileSync(
  join(root, "docs/releases/adaptive-workspace-production-v1-release-notes.md"),
  "utf8",
);
assert.match(notes, /Not performed/);
assert.match(notes, /be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170/);

const changelog = readFileSync(
  join(root, "docs/releases/CHANGELOG-adaptive-workspace.md"),
  "utf8",
);
assert.match(changelog, /be42e9fd73f9dbf09d64dbbb3ccc6eb5e5413170/);

const closurePackPath = join(
  root,
  "docs/audits/artifacts/release-closure/closure-freeze-pack.json",
);
assert.ok(existsSync(closurePackPath));
const closurePack = JSON.parse(readFileSync(closurePackPath, "utf8"));
assert.equal(closurePack.closureFreeze, "pending");
assert.equal(closurePack.productionRuntimeFreeze, AW_R6);
assert.equal(closurePack.awR7, "absent");

const noRuntime = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/release-closure/no-runtime-delta.json"),
    "utf8",
  ),
);
assert.equal(noRuntime.result, "PASS");

const delta = execSync(`git diff --name-only ${AW_R6} -- app components lib prisma package.json`, {
  cwd: root,
})
  .toString()
  .trim();
assert.equal(delta, "", "runtime delta detected");

console.log("validate-adaptive-workspace-release-closure: PASS");
