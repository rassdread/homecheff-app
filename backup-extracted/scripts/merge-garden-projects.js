// Script om garden projects van een account naar een ander te verplaatsen
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeGardenProjects() {
  try {
    // Find both users
    const sourceEmail = 'r.sergioarrias@gmail.com';
    const targetEmail = 'sergio@homecheff.eu';

    const sourceUser = await prisma.user.findUnique({ where: { email: sourceEmail } });
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });

    if (!sourceUser || !targetUser) {
      return;
    }
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
      return;
    }
    projectsToMove.forEach(project => {
    });
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
  } catch (error) {
    console.error('❌ Error merging projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment the line below to run the merge
// mergeGardenProjects();