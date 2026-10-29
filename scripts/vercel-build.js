// Vercel build: Prisma Client generate + Next.js build.
// Database migrations are NOT run during Vercel builds (Preview or Production).
const { execSync } = require("child_process");

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
  // The standard Vercel builder has 8 GB. A 6 GB heap is killed during next build.
  // Webpack's default parallelism (100) retains about 4.1 GB during compilation on
  // this tree and crosses the 4096 MB heap. Parallelism 1 keeps that peak near 3.2 GB.
  // Build scheduling only; it does not change the emitted bundles' runtime behavior.
  execSync(
    "cross-env NODE_OPTIONS=--max-old-space-size=4096 NEXT_TELEMETRY_DISABLED=1 NEXT_WEBPACK_PARALLELISM=1 next build",
    { stdio: "inherit", shell: true }
  );

  console.log("\n✅ Build completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ Build failed!");
  console.error("Error:", error.message || "Unknown error");
  process.exit(1);
}
