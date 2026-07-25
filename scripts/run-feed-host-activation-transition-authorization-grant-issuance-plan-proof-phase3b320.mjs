#!/usr/bin/env node
/**
 * Phase 3B.3.20 orchestrator:
 * 1) production build with sealed baseline
 * 2) Phase 3B.2 Chromium proof rerun (20/20)
 * 3) Phase 3B.3.20 host activation transition authorization grant issuance
 *    decision Chromium proof (new)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const port = process.env.PHASE3B320_PORT || "3041";
const out3b2 = join(root, "docs/audits/artifacts/phase3b2");
const out3b319 = join(root, "docs/audits/artifacts/phase3b319");
const out3b320 = join(root, "docs/audits/artifacts/phase3b320");
mkdirSync(out3b2, { recursive: true });
mkdirSync(out3b320, { recursive: true });

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

function git(args) {
  const { execSync } = require("node:child_process");
  return execSync(`git ${args}`, { cwd: root, encoding: "utf8" }).trim();
}

async function waitForServer(url, attempts = 90) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready at ${url}`);
}

async function main() {
  const commit = git("rev-parse HEAD");
  const branch = git("branch --show-current");

  const priorIssuanceDecisionProofPath = join(
    out3b319,
    "phase3b3-18-feed-host-activation-transition-authorization-grant-issuance-decision-proof.json",
  );
  const priorIssuanceDecisionProof = JSON.parse(
    readFileSync(priorIssuanceDecisionProofPath, "utf8"),
  );
  if (priorIssuanceDecisionProof.overallVerdict !== "READY_FOR_PHASE_3B_3_20") {
    throw new Error(
      `Phase 3B.3.19 issuance decision proof required: ${priorIssuanceDecisionProof.overallVerdict}`,
    );
  }

  if (process.env.SKIP_BUILD !== "1") {
    console.log("[phase3b320] production build NEXT_PUBLIC_FEED_SEALED_BASELINE=1");
    await run("npm", ["run", "build"], {
      NEXT_PUBLIC_FEED_SEALED_BASELINE: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    });
  }

  const server = spawn(
    "npx",
    ["next", "start", "-p", port, "-H", "127.0.0.1"],
    {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXT_PUBLIC_FEED_SEALED_BASELINE: "1",
        PORT: port,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let serverLog = "";
  server.stdout.on("data", (d) => {
    serverLog += d.toString();
  });
  server.stderr.on("data", (d) => {
    serverLog += d.toString();
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(baseUrl);

    console.log("[phase3b320] Phase 3B.2 proof rerun");
    await run("node", [
      "scripts/probe-feed-sealed-runtime-phase3b2.mjs",
      `--base-url=${baseUrl}`,
      `--commit=${commit}`,
      `--branch=${branch}`,
      `--out-dir=${out3b2}`,
    ]);
    const p2 = JSON.parse(
      readFileSync(join(out3b2, "phase3b2-feed-browser-proof.json"), "utf8"),
    );
    if (p2.overallVerdict !== "READY_FOR_PHASE_3B_3") {
      throw new Error(`Phase 3B.2 rerun failed: ${p2.overallVerdict}`);
    }
    const pass2 = (p2.invariants || []).filter((i) => i.status === "PASS")
      .length;
    if (pass2 !== 20) {
      throw new Error(`Phase 3B.2 rerun not 20/20 (got ${pass2})`);
    }

    const freezePath = join(out3b2, "phase3b2-feed-freeze-contract.json");
    const freeze = JSON.parse(readFileSync(freezePath, "utf8"));
    freeze.evidenceCommit = commit;
    freeze.browserProofStatus = "frozen";
    freeze.productionMode = true;
    writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

    console.log(
      "[phase3b320] Phase 3B.3.20 host activation transition authorization grant issuance plan proof",
    );
    await run("node", [
      "scripts/probe-feed-host-activation-transition-authorization-grant-issuance-plan-phase3b320.mjs",
      `--base-url=${baseUrl}`,
      `--commit=${commit}`,
      `--branch=${branch}`,
      `--out-dir=${out3b320}`,
    ]);

    const p319 = JSON.parse(
      readFileSync(
        join(
          out3b320,
          "phase3b3-20-feed-host-activation-transition-authorization-grant-issuance-plan-proof.json",
        ),
        "utf8",
      ),
    );
    if (p319.overallVerdict !== "READY_FOR_PHASE_3B_3_21") {
      throw new Error(`Phase 3B.3.20 proof failed: ${p319.overallVerdict}`);
    }
    if (p319.commit !== commit) {
      throw new Error(
        `Proof commit mismatch: artifact=${p319.commit} HEAD=${commit}`,
      );
    }

    console.log("[phase3b320] READY_FOR_PHASE_3B_3_21");
  } finally {
    server.kill("SIGTERM");
    writeFileSync(
      join(out3b320, "phase3b3-20-server-log-tail.txt"),
      serverLog.slice(-8000),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
