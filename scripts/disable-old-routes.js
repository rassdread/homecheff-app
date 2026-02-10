const fs = require('fs');
const path = require('path');

async function disableOldRoutes() {
  try {
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
      } else {
      }
    }
  } catch (error) {
    console.error('❌ Error disabling routes:', error);
  }
}

disableOldRoutes();

