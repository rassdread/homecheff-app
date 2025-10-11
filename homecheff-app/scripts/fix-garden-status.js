// Script om alle garden project statussen te fixen naar PRIVATE
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixGardenStatus() {
  console.log('🔧 Fixing garden project statuses...\n');

  try {
    // Find all garden projects that are not PRIVATE
    const projectsToFix = await prisma.dish.findMany({
      where: {
        category: 'GROWN',
        status: {
          not: 'PRIVATE'
        }
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    console.log(`Found ${projectsToFix.length} project(s) to fix:\n`);

    if (projectsToFix.length === 0) {
      console.log('✅ All garden projects already have status PRIVATE');
      return;
    }

    projectsToFix.forEach(project => {
      console.log(`  - "${project.title}" (${project.status} → PRIVATE)`);
    });

    console.log('\nUpdating...');

    // Update all to PRIVATE
    const result = await prisma.dish.updateMany({
      where: {
        category: 'GROWN',
        status: {
          not: 'PRIVATE'
        }
      },
      data: {
        status: 'PRIVATE'
      }
    });

    console.log(`\n✅ Updated ${result.count} project(s) to PRIVATE status`);
    console.log('\nYour garden projects should now be visible in "Mijn Tuin" tab!');

  } catch (error) {
    console.error('❌ Error fixing garden statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGardenStatus();


