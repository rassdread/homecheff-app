#!/usr/bin/env node
/**
 * Phase 3B.2 orchestrator — production build + next start + Chromium proof.
 *
 * Env:
 *   PHASE3B2_PORT=3021 (default)
 *   SKIP_BUILD=1 to reuse existing .next (must be built with FEED_SEALED_BASELINE=1)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const port = process.env.PHASE3B2_PORT || "3021";
const outDir = join(root, "docs/audits/artifacts/phase3b2");
mkdirSync(outDir, { recursive: true });

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: false,
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

async function waitForServer(url, attempts = 60) {
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

  if (process.env.SKIP_BUILD !== "1") {
    console.log("[phase3b2] production build with NEXT_PUBLIC_FEED_SEALED_BASELINE=1");
    await run("npm", ["run", "build"], {
      NEXT_PUBLIC_FEED_SEALED_BASELINE: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    });
  } else {
    console.log("[phase3b2] SKIP_BUILD=1 — using existing .next");
  }

  console.log(`[phase3b2] starting next start on :${port}`);
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
    console.log("[phase3b2] running Chromium probe");
    await run("node", [
      "scripts/probe-feed-sealed-runtime-phase3b2.mjs",
      `--base-url=${baseUrl}`,
      `--commit=${commit}`,
      `--branch=${branch}`,
      `--out-dir=${outDir}`,
    ]);

    const proofPath = join(outDir, "phase3b2-feed-browser-proof.json");
    if (!existsSync(proofPath)) {
      throw new Error("Missing browser proof artifact");
    }
    const proof = JSON.parse(readFileSync(proofPath, "utf8"));
    if (proof.overallVerdict !== "READY_FOR_PHASE_3B_3") {
      throw new Error(`Browser proof verdict ${proof.overallVerdict}`);
    }

    // Write freeze contract evidence binding (JSON for validator)
    const freezePath = join(outDir, "phase3b2-feed-freeze-contract.json");
    writeFileSync(
      freezePath,
      JSON.stringify(
        {
          schemaVersion: 1,
          widgetId: "feed.discovery",
          runtimeClassification: "sealed-runtime",
          modeMax: "shadow",
          renderActivation: false,
          shadowActivation: true,
          activeWriter: "legacy",
          singleStableMount: true,
          zeroUnmountDuringStableSession: true,
          noWorkspaceRequestIdentity: true,
          noWorkspaceObserverOwnership: true,
          noWorkspaceScrollOwnership: true,
          noWorkspaceCacheOwnership: true,
          browserProofStatus: "frozen",
          nextEligiblePhase: "3B.3",
          hostActivation: false,
          productionMode: true,
          evidenceCommit: commit,
          evidenceArtifactPath:
            "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json",
        },
        null,
        2,
      ),
    );
    console.log("[phase3b2] freeze evidence written", freezePath);
  } finally {
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
    try {
      server.kill("SIGKILL");
    } catch {
      /* ignore */
    }
    writeFileSync(join(outDir, "phase3b2-server-log-tail.txt"), serverLog.slice(-8000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
