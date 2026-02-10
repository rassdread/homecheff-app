// Prebuild script that handles Prisma gracefully
const { execSync } = require('child_process');

try {
  console.log('🔧 Installing Next.js...');
  execSync('npm install next@14.2.5 --save-exact --no-save', { stdio: 'inherit' });

  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('✅ Prebuild completed successfully!');
} catch (error) {
  console.error('❌ Prebuild failed:', error.message);
  process.exit(1);
}



