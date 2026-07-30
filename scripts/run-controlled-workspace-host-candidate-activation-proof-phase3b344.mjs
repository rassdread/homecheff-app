#!/usr/bin/env node
/**
 * Phase 3B.3.44 orchestrator:
 * 1) production build with sealed baseline
 * 2) Phase 3B.2 Chromium proof rerun (20/20)
 * 3) Phase 3B.3.44 candidate-activation Chromium proof
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const port = process.env.PHASE3B344_PORT || "3065";
const out3b2 = join(root, "docs/audits/artifacts/phase3b2");
const out3b344 = join(root, "docs/audits/artifacts/phase3b344");
mkdirSync(out3b2, { recursive: true });
mkdirSync(out3b344, { recursive: true });

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
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready at ${url}`);
}

async function main() {
  const commit = git("rev-parse HEAD");
  const branch = git("branch --show-current");

  const priorPath = join(
    root,
    "docs/audits/artifacts/phase3b342/phase3b3-42-controlled-workspace-host-candidate-activation-readiness-proof.json",
  );
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  if (prior.overallVerdict !== "READY_FOR_PHASE_3B_3_43") {
    throw new Error(`Phase 3B.3.42 predecessor proof required: ${prior.overallVerdict}`);
  }

  if (process.env.SKIP_BUILD !== "1") {
    console.log("[phase3b344] production build NEXT_PUBLIC_FEED_SEALED_BASELINE=1");
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
  server.stdout.on("data", (d) => { serverLog += d.toString(); });
  server.stderr.on("data", (d) => { serverLog += d.toString(); });

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(baseUrl);

    console.log("[phase3b344] Phase 3B.2 proof rerun");
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
    const pass2 = (p2.invariants || []).filter((i) => i.status === "PASS").length;
    if (pass2 !== 20) throw new Error(`Phase 3B.2 rerun not 20/20 (got ${pass2})`);

    const freezePath = join(out3b2, "phase3b2-feed-freeze-contract.json");
    const freeze = JSON.parse(readFileSync(freezePath, "utf8"));
    freeze.evidenceCommit = commit;
    freeze.browserProofStatus = "frozen";
    freeze.productionMode = true;
    writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

    console.log("[phase3b344] Phase 3B.3.44 candidate-activation proof");
    await run("node", [
      "scripts/probe-controlled-workspace-host-candidate-activation-phase3b344.mjs",
      `--base-url=${baseUrl}`,
      `--commit=${commit}`,
      `--branch=${branch}`,
      `--out-dir=${out3b344}`,
    ]);

    const p333 = JSON.parse(
      readFileSync(
        join(
          out3b344,
          "phase3b3-44-controlled-workspace-host-candidate-activation-proof.json",
        ),
        "utf8",
      ),
    );
    if (p333.overallVerdict !== "READY_FOR_PHASE_3B_3_45") {
      throw new Error(`Phase 3B.3.44 proof failed: ${p333.overallVerdict}`);
    }
    if (p333.commit !== commit) {
      throw new Error(`Proof commit mismatch: artifact=${p333.commit} HEAD=${commit}`);
    }
    console.log("[phase3b344] READY_FOR_PHASE_3B_3_45");
  } finally {
    server.kill("SIGTERM");
    writeFileSync(
      join(out3b344, "phase3b3-44-server-log-tail.txt"),
      serverLog.slice(-8000),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
