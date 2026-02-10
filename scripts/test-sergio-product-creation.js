const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductCreation() {
  try {
    console.log('🧪 Testing product creation for Sergio...\n');

    const userEmail = 'r.sergioarrias@gmail.com';
    const userId = 'bfa0a9b2-423b-46e1-a664-7919f3512dd5'; // Correct User ID
    const sellerProfileId = '2cf8c0fc-75b1-4ccd-aad3-fb2e99293758'; // SellerProfile ID

    // Test 1: Check if user exists and has correct roles
    console.log('1️⃣ Checking user data...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        SellerProfile: true
      }
    });

    if (!user) {
      console.log('❌ User not found with ID:', userId);
      return;
    }

    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Seller Roles: ${JSON.stringify(user.sellerRoles)}`);
    console.log(`   Has SellerProfile: ${!!user.SellerProfile}`);
    
    if (user.SellerProfile) {
      console.log(`   SellerProfile ID: ${user.SellerProfile.id}`);
    }

    // Test 2: Simulate the product creation logic
    console.log('\n2️⃣ Testing product creation logic...');
    
    // Check if user has seller privileges
    const hasSellerRole = user.role === 'SELLER';
    const hasSellerRoles = user.sellerRoles && user.sellerRoles.length > 0;
    const hasSellerProfile = !!user.SellerProfile;

    console.log(`   Role === 'SELLER': ${hasSellerRole}`);
    console.log(`   Has seller roles: ${hasSellerRoles}`);
    console.log(`   Has SellerProfile: ${hasSellerProfile}`);

    if (hasSellerRole || hasSellerRoles) {
      console.log('✅ User has seller privileges');
      
      let finalSellerProfileId = null;
      
      if (hasSellerProfile) {
        finalSellerProfileId = user.SellerProfile.id;
        console.log(`✅ Using existing SellerProfile: ${finalSellerProfileId}`);
      } else {
        console.log('⚠️ Would create new SellerProfile (but user already has one)');
      }

      // Test creating a product
      console.log('\n3️⃣ Testing actual product creation...');
      
      const productData = {
        title: 'Test Product voor Sergio',
        description: 'Dit is een test product om te controleren of Sergio kan verkopen',
        priceCents: 1599, // €15.99 = 1599 cents
        category: 'GROWN',
        status: 'PRIVATE'
      };

      try {
        const newProduct = await prisma.dish.create({
          data: {
            title: productData.title,
            description: productData.description,
            priceCents: productData.priceCents,
            category: productData.category,
            status: productData.status,
            userId: user.id
          }
        });

        console.log('✅ Product created successfully!');
        console.log(`   Product ID: ${newProduct.id}`);
        console.log(`   Title: ${newProduct.title}`);
        console.log(`   Price: €${(newProduct.priceCents / 100).toFixed(2)}`);
        console.log(`   User ID: ${newProduct.userId}`);

        // Clean up - delete the test product
        await prisma.dish.delete({
          where: { id: newProduct.id }
        });
        console.log('🧹 Test product cleaned up');

      } catch (productError) {
        console.log('❌ Product creation failed:');
        console.log(`   Error: ${productError.message}`);
      }

    } else {
      console.log('❌ User does not have seller privileges');
    }

  } catch (error) {
    console.error('❌ Error testing product creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductCreation();
