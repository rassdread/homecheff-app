// Vercel build: Prisma Client generate + Next.js build.
// Database migrations are NOT run during Vercel builds (Preview or Production).
const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Starting Vercel build (prisma generate → next build)\n");
console.log(
  "ℹ️  Database migrations are managed by an explicit approved pipeline and are not run during Vercel builds.\n"
);

try {
  console.log("🔧 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit", shell: true });
  console.log("✅ Prisma client generated\n");

  console.log("🔎 Blocking unbound hook calls (missing imports)...");
  execSync("node scripts/check-unbound-hooks.mjs", { stdio: "inherit", shell: true });

  console.log("🔎 Typecheck ratchet (new errors and TS2304 fail the deploy)...");
  execSync("node scripts/typecheck-ratchet.mjs", {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, TYPECHECK_NODE_OPTIONS: "--max-old-space-size=6144" },
  });

  console.log("🏗️  Building Next.js application...");
  // Restoring .next/cache makes this compile exceed the 4096 MB heap.
  // The same commit completes when that cache is absent. A 6 GB heap is
  // killed on the 8 GB builder, so the heap stays at 4096 MB.
  fs.rmSync(".next/cache", { recursive: true, force: true });
  console.log("🧹 Removed restored Next.js build cache before compilation\n");
  execSync(
    "cross-env NODE_OPTIONS=--max-old-space-size=4096 NEXT_TELEMETRY_DISABLED=1 next build",
    { stdio: "inherit", shell: true }
  );

  console.log("\n✅ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Build failed!");
  console.error("Error:", error.message || "Unknown error");
  process.exit(1);
}
