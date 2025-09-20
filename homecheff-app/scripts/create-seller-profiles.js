const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSellerProfiles() {
  try {
    console.log('🏪 Creating missing seller profiles...');

    // Get all seller users without profiles
    const sellerUsers = await prisma.user.findMany({
      where: { 
        role: 'SELLER',
        SellerProfile: null
      }
    });

    console.log(`👥 Found ${sellerUsers.length} seller users without profiles`);

    for (const user of sellerUsers) {
      try {
        const sellerProfile = await prisma.sellerProfile.create({
          data: {
            id: `seller-${user.id}`,
            userId: user.id,
            displayName: user.name || user.username || 'Verkoper',
            bio: 'Nieuwe verkoper op HomeCheff',
            lat: 52.3676, // Amsterdam coordinates
            lng: 4.9041,
            btw: '',
            companyName: '',
            kvk: '',
            subscriptionId: null,
            subscriptionValidUntil: null
          }
        });

        console.log(`✅ Created seller profile for ${user.name || user.email}: ${sellerProfile.id}`);
      } catch (error) {
        console.error(`❌ Failed to create profile for ${user.name || user.email}:`, error.message);
      }
    }

    // Verify creation
    const totalProfiles = await prisma.sellerProfile.count();
    console.log(`\n📊 Total seller profiles: ${totalProfiles}`);

    console.log('\n✅ Seller profile creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating seller profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSellerProfiles();
