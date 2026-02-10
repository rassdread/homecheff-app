// Script om alle garden project statussen te fixen naar PRIVATE
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixGardenStatus() {
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
    if (projectsToFix.length === 0) {
      return;
    }

    projectsToFix.forEach(project => {
    });
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
  } catch (error) {
    console.error('❌ Error fixing garden statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGardenStatus();

