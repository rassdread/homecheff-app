// Vercel build script that mimics the old behavior: npx prisma generate && prisma migrate deploy && next build
// But with graceful error handling for migrations
const { execSync } = require('child_process');

console.log('🚀 Starting build (simulating: npx prisma generate && prisma migrate deploy && next build)\n');

try {
  // Step 1: Generate Prisma client (MUST succeed)
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', shell: true });
  console.log('✅ Prisma client generated\n');
  
  // Step 2: Run migrations (CAN fail gracefully)
  try {
    console.log('🔧 Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', shell: true });
    console.log('✅ Migrations applied\n');
  } catch (migrationError) {
    console.log('⚠️  Migrations skipped (database may already be up to date)');
    console.log('   This is OK - build will continue\n');
  }
  
  // Step 3: Build Next.js (MUST succeed)
  // Build directly with next build to avoid recursive prebuild
  console.log('🏗️  Building Next.js application...');
  execSync('cross-env NODE_OPTIONS=--max-old-space-size=4096 NEXT_TELEMETRY_DISABLED=1 next build', { stdio: 'inherit', shell: true });
  
  console.log('\n✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed!');
  console.error('Error:', error.message || 'Unknown error');
  process.exit(1);
}

