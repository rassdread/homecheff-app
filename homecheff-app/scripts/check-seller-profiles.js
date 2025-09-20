const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSellerProfiles() {
  try {
    console.log('🔍 Checking seller profiles...');

    // Get all users
    const users = await prisma.user.findMany({
      include: { SellerProfile: true },
      where: { role: 'SELLER' }
    });

    console.log(`👥 Found ${users.length} seller users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - SellerProfile: ${user.SellerProfile ? 'EXISTS' : 'MISSING'}`);
      if (user.SellerProfile) {
        console.log(`   - SellerProfile ID: ${user.SellerProfile.id}`);
      }
      console.log('');
    });

    // Get all seller profiles
    const sellerProfiles = await prisma.sellerProfile.findMany({
      include: { User: true }
    });

    console.log(`🏪 Found ${sellerProfiles.length} seller profiles:`);
    
    sellerProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. SellerProfile ID: ${profile.id}`);
      console.log(`   - User ID: ${profile.userId}`);
      console.log(`   - User Name: ${profile.User?.name || profile.User?.email}`);
      console.log('');
    });

    // Check if there are any orphaned seller profiles
    const orphanedProfiles = sellerProfiles.filter(profile => !profile.User);
    if (orphanedProfiles.length > 0) {
      console.log(`⚠️  Found ${orphanedProfiles.length} orphaned seller profiles`);
    }

    // Check if there are users without seller profiles
    const usersWithoutProfiles = users.filter(user => !user.SellerProfile);
    if (usersWithoutProfiles.length > 0) {
      console.log(`⚠️  Found ${usersWithoutProfiles.length} seller users without profiles`);
    }
    
  } catch (error) {
    console.error('❌ Error checking seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellerProfiles();
