// Vercel build: Prisma Client generate + Next.js build.
// Database migrations are NOT run during Vercel builds (Preview or Production).
const { execSync } = require("child_process");

console.log("🚀 Starting Vercel build (prisma generate → next build)\n");
console.log(
  "ℹ️  Database migrations are managed by an explicit approved pipeline and are not run during Vercel builds.\n"
);

try {
  console.log("🔧 Asserting Prisma Linux binaryTargets...");
  execSync("node scripts/assert-prisma-binary-targets.mjs", {
    stdio: "inherit",
    shell: true,
  });

  console.log("🔧 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit", shell: true });
  console.log("✅ Prisma client generated\n");

  console.log("🔧 Asserting Linux Prisma Query Engines were generated...");
  execSync("node scripts/assert-prisma-runtime-engines.mjs", {
    stdio: "inherit",
    shell: true,
  });

  console.log("🔎 Blocking unbound hook calls (missing imports)...");
  execSync("node scripts/check-unbound-hooks.mjs", { stdio: "inherit", shell: true });

  console.log("🔎 Typecheck ratchet (new errors and TS2304 fail the deploy)...");
  execSync("node scripts/typecheck-ratchet.mjs", {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, TYPECHECK_NODE_OPTIONS: "--max-old-space-size=6144" },
  });

  console.log("🏗️  Building Next.js application...");
  // Standard Vercel builder = 8 GB RAM. Cold builds can OOM at 4096; 7168 leaves
  // headroom for the OS while staying under the machine limit. Do not use 8192.
  // Historical note: a 6 GB heap was killed on some builders — prefer 7168 with
  // a warm cache retry if the first cold build still fails.
  const nextHeap = process.env.HC_NEXT_HEAP_MB || "7168";
  execSync(
    `cross-env NODE_OPTIONS=--max-old-space-size=${nextHeap} NEXT_TELEMETRY_DISABLED=1 next build`,
    { stdio: "inherit", shell: true }
  );

  console.log("\n✅ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Build failed!");
  console.error("Error:", error.message || "Unknown error");
  process.exit(1);
}
