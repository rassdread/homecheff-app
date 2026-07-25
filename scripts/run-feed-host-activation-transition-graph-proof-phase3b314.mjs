#!/usr/bin/env node
/**
 * Phase 3B.3.14 orchestrator:
 * 1) production build with sealed baseline
 * 2) Phase 3B.2 Chromium proof rerun (20/20)
 * 3) Phase 3B.3.14 host activation transition graph Chromium proof (new)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const port = process.env.PHASE3B314_PORT || "3035";
const out3b2 = join(root, "docs/audits/artifacts/phase3b2");
const out3b313 = join(root, "docs/audits/artifacts/phase3b314");
mkdirSync(out3b2, { recursive: true });
mkdirSync(out3b313, { recursive: true });

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

  if (process.env.SKIP_BUILD !== "1") {
    console.log("[phase3b314] production build NEXT_PUBLIC_FEED_SEALED_BASELINE=1");
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

    console.log("[phase3b314] Phase 3B.2 proof rerun");
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

    // Align freeze evidenceCommit with the fresh 3B.2 proof stamp.
    const freezePath = join(out3b2, "phase3b2-feed-freeze-contract.json");
    const freeze = JSON.parse(readFileSync(freezePath, "utf8"));
    freeze.evidenceCommit = commit;
    freeze.browserProofStatus = "frozen";
    freeze.productionMode = true;
    writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

    console.log("[phase3b314] Phase 3B.3.14 host activation transition graph proof");
    await run("node", [
      "scripts/probe-feed-host-activation-transition-graph-phase3b314.mjs",
      `--base-url=${baseUrl}`,
      `--commit=${commit}`,
      `--branch=${branch}`,
      `--out-dir=${out3b313}`,
    ]);

    const p32 = JSON.parse(
      readFileSync(
        join(out3b313, "phase3b3-14-feed-host-activation-transition-graph-proof.json"),
        "utf8",
      ),
    );
    if (p32.overallVerdict !== "READY_FOR_PHASE_3B_3_15") {
      throw new Error(`Phase 3B.3.14 proof failed: ${p32.overallVerdict}`);
    }
    if (p32.commit !== commit) {
      throw new Error(
        `Proof commit mismatch: artifact=${p32.commit} HEAD=${commit}`,
      );
    }

    console.log("[phase3b314] READY_FOR_PHASE_3B_3_15");
  } finally {
    server.kill("SIGTERM");
    writeFileSync(
      join(out3b313, "phase3b3-13-server-log-tail.txt"),
      serverLog.slice(-8000),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
