// Script om alle garden projects te checken
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGardenProjects() {
  console.log('🔍 Checking all garden projects...\n');

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

    console.log(`📦 Total garden projects found: ${allGardenProjects.length}\n`);

    if (allGardenProjects.length === 0) {
      console.log('❌ No garden projects found in database!');
      console.log('This could mean:');
      console.log('  1. No garden projects have been created yet');
      console.log('  2. The category field is not set to "GROWN"');
      console.log('  3. Data was deleted\n');
      return;
    }

    // Group by status
    const byStatus = allGardenProjects.reduce((acc, project) => {
      const status = project.status || 'NULL';
      if (!acc[status]) acc[status] = [];
      acc[status].push(project);
      return acc;
    }, {});

    console.log('📊 Projects by status:');
    Object.entries(byStatus).forEach(([status, projects]) => {
      console.log(`  ${status}: ${projects.length} project(s)`);
    });
    console.log('');

    // Show each project
    console.log('📋 All garden projects:\n');
    allGardenProjects.forEach((project, index) => {
      console.log(`${index + 1}. "${project.title || 'NO TITLE'}"`);
      console.log(`   ID: ${project.id}`);
      console.log(`   User: ${project.user.name || project.user.username} (${project.user.email})`);
      console.log(`   Status: ${project.status || 'NULL'} ${project.status === 'PRIVATE' ? '✅ (Will show)' : '⚠️ (Hidden in private mode)'}`);
      console.log(`   Category: ${project.category}`);
      console.log(`   Plant Type: ${project.plantType || 'Not set'}`);
      console.log(`   Main Photos: ${project.photos.length}`);
      console.log(`   Growth Photos: ${project.growthPhotos.length}`);
      console.log(`   Created: ${project.createdAt.toLocaleDateString()}`);
      console.log(`   Updated: ${project.updatedAt.toLocaleDateString()}`);
      console.log('');
    });

    // Check for projects with wrong status
    const nonPrivateProjects = allGardenProjects.filter(p => p.status !== 'PRIVATE');
    if (nonPrivateProjects.length > 0) {
      console.log('\n⚠️ WARNING: Found projects with status other than PRIVATE:');
      nonPrivateProjects.forEach(project => {
        console.log(`   - "${project.title}" has status: ${project.status}`);
      });
      console.log('\nThese projects will NOT show in "Mijn Tuin" tab (private mode).');
      console.log('To fix this, run: node scripts/fix-garden-status.js\n');
    }

    // Check for projects without photos
    const projectsWithoutPhotos = allGardenProjects.filter(p => p.photos.length === 0);
    if (projectsWithoutPhotos.length > 0) {
      console.log('\n⚠️ WARNING: Found projects without main photos:');
      projectsWithoutPhotos.forEach(project => {
        console.log(`   - "${project.title}" (ID: ${project.id})`);
      });
      console.log('\nProjects without photos might not display correctly.\n');
    }

  } catch (error) {
    console.error('❌ Error checking garden projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGardenProjects();


