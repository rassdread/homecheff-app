// Script om users te checken die seller roles hebben maar geen SellerProfile
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSellerProfiles() {
  console.log('🔍 Checking users with seller roles but missing SellerProfile...\n');

  try {
    // Find users with seller roles
    const usersWithSellerRoles = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SELLER' },
          { sellerRoles: { has: 'chef' } },
          { sellerRoles: { has: 'garden' } },
          { sellerRoles: { has: 'designer' } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        sellerRoles: true,
        SellerProfile: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    console.log(`📦 Found ${usersWithSellerRoles.length} users with seller roles\n`);

    const missingProfiles = [];
    const hasProfiles = [];

    usersWithSellerRoles.forEach(user => {
      if (user.SellerProfile) {
        hasProfiles.push(user);
      } else {
        missingProfiles.push(user);
      }
    });

    console.log(`✅ Users WITH SellerProfile: ${hasProfiles.length}`);
    hasProfiles.forEach(user => {
      console.log(`   - ${user.name || user.username} (${user.email}) - ${user.SellerProfile.displayName || 'No display name'}`);
    });

    console.log(`\n❌ Users MISSING SellerProfile: ${missingProfiles.length}`);
    missingProfiles.forEach(user => {
      console.log(`   - ${user.name || user.username} (${user.email})`);
      console.log(`     Role: ${user.role}, SellerRoles: ${user.sellerRoles?.join(', ') || 'none'}`);
    });

    if (missingProfiles.length > 0) {
      console.log('\n🔧 To fix missing SellerProfiles, run:');
      console.log('node scripts/create-missing-seller-profiles.js\n');
    }

    // Also check garden project users specifically
    console.log('\n🌱 Checking garden project owners...');
    const gardenProjectUsers = await prisma.dish.findMany({
      where: {
        category: 'GROWN'
      },
      include: {
        user: {
          include: {
            SellerProfile: true
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            sellerRoles: true,
            SellerProfile: {
              select: {
                id: true,
                businessName: true
              }
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        user: true
      }
    });

    const uniqueUsers = new Map();
    gardenProjectUsers.forEach(project => {
      const user = project.user;
      if (!uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, user);
      }
    });

    console.log(`📋 Garden project owners (${uniqueUsers.size} unique users):`);
    Array.from(uniqueUsers.values()).forEach(user => {
      const hasProfile = user.SellerProfile ? '✅' : '❌';
      console.log(`   ${hasProfile} ${user.name || user.username} (${user.email})`);
      if (!user.SellerProfile) {
        console.log(`      Role: ${user.role}, SellerRoles: ${user.sellerRoles?.join(', ') || 'none'}`);
      }
    });

  } catch (error) {
    console.error('❌ Error checking seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellerProfiles();
