const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🧪 Test gebruikers aanmaken...\n');

    // Test seller (Chef)
    const chefPassword = await bcrypt.hash('test123', 12);
    const chef = await prisma.user.create({
      data: {
        email: 'chef@homecheff.eu',
        name: 'Test Chef',
        passwordHash: chefPassword,
        role: 'SELLER',
        username: 'testchef',
        bio: 'Passionate home chef sharing recipes and cooking tips',
        place: 'Amsterdam',
        interests: ['cooking', 'recipes', 'food'],
        sellerRoles: ['chef'],
        buyerRoles: ['food_lover'],
        emailVerified: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        marketingAccepted: true,
        marketingAcceptedAt: new Date(),
        taxResponsibilityAccepted: true,
        taxResponsibilityAcceptedAt: new Date(),
        displayFullName: true,
        fanRequestEnabled: true,
        showFansList: true,
        showProfileToEveryone: true,
        showOnlineStatus: true,
        allowProfileViews: true,
        showActivityStatus: true,
        messagePrivacy: 'EVERYONE'
      }
    });

    // Create seller profile for chef
    await prisma.sellerProfile.create({
      data: {
        id: 'chef-profile-' + Date.now(),
        userId: chef.id,
        displayName: 'Test Chef',
        bio: 'Home chef specializing in Italian cuisine and sustainable cooking',
        companyName: 'Chef\'s Kitchen',
        deliveryMode: 'FIXED',
        deliveryRadius: 5.0,
        deliveryRegions: ['Amsterdam', 'Amstelveen']
      }
    });

    console.log('✅ Chef account aangemaakt:');
    console.log(`   Email: ${chef.email}`);
    console.log(`   Password: test123`);
    console.log(`   Role: ${chef.role}`);
    console.log(`   Seller Roles: ${chef.sellerRoles.join(', ')}`);

    // Test seller (Garden)
    const gardenPassword = await bcrypt.hash('test123', 12);
    const gardener = await prisma.user.create({
      data: {
        email: 'garden@homecheff.eu',
        name: 'Test Gardener',
        passwordHash: gardenPassword,
        role: 'SELLER',
        username: 'testgarden',
        bio: 'Urban gardener growing organic vegetables and herbs',
        place: 'Utrecht',
        interests: ['gardening', 'organic', 'sustainability'],
        sellerRoles: ['garden'],
        buyerRoles: ['organic_food'],
        emailVerified: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        marketingAccepted: true,
        marketingAcceptedAt: new Date(),
        taxResponsibilityAccepted: true,
        taxResponsibilityAcceptedAt: new Date(),
        displayFullName: true,
        fanRequestEnabled: true,
        showFansList: true,
        showProfileToEveryone: true,
        showOnlineStatus: true,
        allowProfileViews: true,
        showActivityStatus: true,
        messagePrivacy: 'EVERYONE'
      }
    });

    // Create seller profile for gardener
    await prisma.sellerProfile.create({
      data: {
        userId: gardener.id,
        displayName: 'Test Gardener',
        bio: 'Urban gardener growing fresh organic vegetables and herbs',
        companyName: 'Green Thumb Garden',
        deliveryMode: 'FIXED',
        deliveryRadius: 3.0,
        deliveryRegions: ['Utrecht', 'Nieuwegein']
      }
    });

    console.log('✅ Gardener account aangemaakt:');
    console.log(`   Email: ${gardener.email}`);
    console.log(`   Password: test123`);
    console.log(`   Role: ${gardener.role}`);
    console.log(`   Seller Roles: ${gardener.sellerRoles.join(', ')}`);

    // Test buyer
    const buyerPassword = await bcrypt.hash('test123', 12);
    const buyer = await prisma.user.create({
      data: {
        email: 'buyer@homecheff.eu',
        name: 'Test Buyer',
        passwordHash: buyerPassword,
        role: 'BUYER',
        username: 'testbuyer',
        bio: 'Food enthusiast looking for fresh, local products',
        place: 'Rotterdam',
        interests: ['local_food', 'organic', 'cooking'],
        sellerRoles: [],
        buyerRoles: ['food_lover', 'organic_food'],
        emailVerified: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        marketingAccepted: true,
        marketingAcceptedAt: new Date(),
        taxResponsibilityAccepted: false,
        displayFullName: true,
        fanRequestEnabled: true,
        showFansList: true,
        showProfileToEveryone: true,
        showOnlineStatus: true,
        allowProfileViews: true,
        showActivityStatus: true,
        messagePrivacy: 'EVERYONE'
      }
    });

    console.log('✅ Buyer account aangemaakt:');
    console.log(`   Email: ${buyer.email}`);
    console.log(`   Password: test123`);
    console.log(`   Role: ${buyer.role}`);
    console.log(`   Buyer Roles: ${buyer.buyerRoles.join(', ')}`);

    // Check total users
    const userCount = await prisma.user.count();
    const sellerProfileCount = await prisma.sellerProfile.count();
    
    console.log(`\n📊 Database overzicht:`);
    console.log(`   Totaal gebruikers: ${userCount}`);
    console.log(`   Seller profielen: ${sellerProfileCount}`);

    console.log('\n🎯 Test accounts klaar voor gebruik!');
    console.log('   Admin: admin@homecheff.eu / admin123');
    console.log('   Chef: chef@homecheff.eu / test123');
    console.log('   Gardener: garden@homecheff.eu / test123');
    console.log('   Buyer: buyer@homecheff.eu / test123');

  } catch (error) {
    console.error('❌ Fout bij aanmaken test gebruikers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
