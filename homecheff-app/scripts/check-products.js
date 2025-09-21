const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const count = await prisma.product.count();
    console.log('Total products:', count);
    
    const activeCount = await prisma.product.count({ where: { isActive: true } });
    console.log('Active products:', activeCount);
    
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 3,
      select: { id: true, title: true, isActive: true, createdAt: true }
    });
    console.log('Sample products:', products);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkProducts();


