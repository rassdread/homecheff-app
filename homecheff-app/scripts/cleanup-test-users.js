const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up existing test users...');
    
    // Find and delete test users
    const testEmails = [
      'anna@test.com',
      'anna2@test.com',
      'tom2@test.com',
      'lisa2@test.com',
      'marco2@test.com',
      'sophie2@test.com'
    ];
    
    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          sellerProfile: {
            include: {
              products: {
                include: {
                  Image: true
                }
              }
            }
          }
        }
      });
      
      if (user) {
        console.log(`🗑️  Deleting user: ${user.name} (${user.email})`);
        
        // Delete images first
        if (user.sellerProfile?.products) {
          for (const product of user.sellerProfile.products) {
            if (product.Image) {
              await prisma.image.deleteMany({
                where: { productId: product.id }
              });
            }
          }
        }
        
        // Delete products
        if (user.sellerProfile?.products) {
          await prisma.product.deleteMany({
            where: { sellerId: user.sellerProfile.id }
          });
        }
        
        // Delete seller profile
        if (user.sellerProfile) {
          await prisma.sellerProfile.delete({
            where: { id: user.sellerProfile.id }
          });
        }
        
        // Delete user
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        console.log(`✅ Deleted user: ${user.name}`);
      }
    }
    
    console.log('🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUsers();
