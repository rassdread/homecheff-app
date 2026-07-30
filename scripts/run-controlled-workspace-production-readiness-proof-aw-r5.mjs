#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const port = process.env.AW_R5_PORT || "3073";
const outDir = join(root, "docs/audits/artifacts/aw-r5");
mkdirSync(outDir, { recursive: true });

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} exited ${code}`)),
    );
  });
}

if (process.env.SKIP_BUILD !== "1") {
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
    },
    stdio: "inherit",
  },
);

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.status > 0) break;
    } catch {
      if (attempt === 89) throw new Error(`Server not ready at ${baseUrl}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const commit = await new Promise((resolve, reject) => {
    const git = spawn("git", ["rev-parse", "HEAD"], { cwd: root });
    let output = "";
    git.stdout.on("data", (data) => (output += data));
    git.on("exit", (code) =>
      code === 0 ? resolve(output.trim()) : reject(new Error("git rev-parse failed")),
    );
  });
  await run("node", [
    "scripts/probe-controlled-workspace-production-readiness-aw-r5.mjs",
    `--base-url=${baseUrl}`,
    `--commit=${commit}`,
    "--branch=workspace/aw-r5-production-readiness",
    `--out-dir=${outDir}`,
  ]);
  console.log("[aw-r5] READY_FOR_AW_R6");
} finally {
  server.kill("SIGTERM");
}
