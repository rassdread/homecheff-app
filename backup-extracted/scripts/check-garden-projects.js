// Script om alle garden projects te checken
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGardenProjects() {
  try {
    // Get all dishes with category GROWN
    const allGardenProjects = await prisma.dish.findMany({
      where: {
        category: 'GROWN'
      },
      include: {
        photos: true,
        growthPhotos: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    if (allGardenProjects.length === 0) {
      return;
    }

    // Group by status
    const byStatus = allGardenProjects.reduce((acc, project) => {
      const status = project.status || 'NULL';
      if (!acc[status]) acc[status] = [];
      acc[status].push(project);
      return acc;
    }, {});
    Object.entries(byStatus).forEach(([status, projects]) => {
    });
    // Show each project
    allGardenProjects.forEach((project, index) => {
    });

    // Check for projects with wrong status
    const nonPrivateProjects = allGardenProjects.filter(p => p.status !== 'PRIVATE');
    if (nonPrivateProjects.length > 0) {
      nonPrivateProjects.forEach(project => {
      });
    }

    // Check for projects without photos
    const projectsWithoutPhotos = allGardenProjects.filter(p => p.photos.length === 0);
    if (projectsWithoutPhotos.length > 0) {
      projectsWithoutPhotos.forEach(project => {
      });
    }

  } catch (error) {
    console.error('❌ Error checking garden projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGardenProjects();

