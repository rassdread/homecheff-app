const fs = require('fs');
const path = require('path');

async function disableOldRoutes() {
  try {
    console.log('🚫 Disabling old API routes...');

    const routesToDisable = [
      'app/api/listings/route.ts',
      'app/api/listings/[id]/route.ts'
    ];

    for (const route of routesToDisable) {
      const filePath = path.join(process.cwd(), route);
      
      if (fs.existsSync(filePath)) {
        // Rename the file to disable it
        const disabledPath = filePath.replace('.ts', '.ts.disabled');
        fs.renameSync(filePath, disabledPath);
        console.log(`✅ Disabled ${route} → ${path.basename(disabledPath)}`);
      } else {
        console.log(`⚠️  File not found: ${route}`);
      }
    }

    console.log('\n✅ Old API routes disabled successfully!');
    console.log('📝 Note: These routes can be re-enabled by renaming .ts.disabled back to .ts');
    
  } catch (error) {
    console.error('❌ Error disabling routes:', error);
  }
}

disableOldRoutes();
