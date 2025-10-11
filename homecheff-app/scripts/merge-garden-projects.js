// Script om garden projects van een account naar een ander te verplaatsen
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeGardenProjects() {
  console.log('🔄 Merging garden projects between accounts...\n');

  try {
    // Find both users
    const sourceEmail = 'r.sergioarrias@gmail.com';
    const targetEmail = 'sergio@homecheff.eu';

    const sourceUser = await prisma.user.findUnique({ where: { email: sourceEmail } });
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (!sourceUser || !targetUser) {
      console.log('❌ One or both users not found');
      return;
    }

    console.log(`Source account: ${sourceUser.name} (${sourceEmail})`);
    console.log(`Target account: ${targetUser.name} (${targetEmail})\n`);

    // Find projects to move
    const projectsToMove = await prisma.dish.findMany({
      where: {
        userId: sourceUser.id,
        category: 'GROWN'
      },
      select: {
        id: true,
        title: true
      }
    });

    if (projectsToMove.length === 0) {
      console.log('✅ No projects to move');
      return;
    }

    console.log(`Found ${projectsToMove.length} project(s) to move:\n`);
    projectsToMove.forEach(project => {
      console.log(`  - "${project.title}"`);
    });

    console.log('\n⚠️  This will move ALL garden projects from');
    console.log(`   ${sourceEmail}`);
    console.log('   to');
    console.log(`   ${targetEmail}\n`);

    // Update the userId of all garden projects
    const result = await prisma.dish.updateMany({
      where: {
        userId: sourceUser.id,
        category: 'GROWN'
      },
      data: {
        userId: targetUser.id
      }
    });

    console.log(`✅ Moved ${result.count} project(s) to ${targetEmail}`);
    console.log('\nAll garden projects are now under one account!');

  } catch (error) {
    console.error('❌ Error merging projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment the line below to run the merge
// mergeGardenProjects();

console.log('⚠️  WARNING: This script will move garden projects between accounts!');
console.log('Edit the script and uncomment the last line to run it.');
console.log('Make sure you want to do this before running!\n');


