const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTestUser() {
  try {
    console.log('🧹 Deleting Anna Bakker test user...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'anna@test.com' }
    });
    
    if (user) {
      console.log(`Found user: ${user.name} (${user.email})`);
      
      // Find seller profile
      const sellerProfile = await prisma.sellerProfile.findFirst({
        where: { userId: user.id }
      });
      
      if (sellerProfile) {
        console.log('Found seller profile, deleting products...');
        
        // Find products
        const products = await prisma.product.findMany({
          where: { sellerId: sellerProfile.id }
        });
        
        for (const product of products) {
          // Delete images
          await prisma.image.deleteMany({
            where: { productId: product.id }
          });
          
          // Delete product
          await prisma.product.delete({
            where: { id: product.id }
          });
          
          console.log(`Deleted product: ${product.title}`);
        }
        
        // Delete seller profile
        await prisma.sellerProfile.delete({
          where: { id: sellerProfile.id }
        });
        
        console.log('Deleted seller profile');
      }
      
      // Delete user
      await prisma.user.delete({
        where: { id: user.id }
      });
      
      console.log('✅ User deleted successfully!');
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestUser();



