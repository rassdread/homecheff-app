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

  console.log("🏗️  Building Next.js application...");
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
