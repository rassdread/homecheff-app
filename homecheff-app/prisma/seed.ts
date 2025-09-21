import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@homecheff.nl' },
    update: {},
    create: {
      email: 'admin@homecheff.nl',
      name: 'Admin User',
      username: 'admin',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      bio: 'Platform administrator',
      place: 'Amsterdam',
      gender: 'OTHER',
      interests: ['management', 'platform'],
      profileImage: null,
    },
  });

  // Test buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.nl' },
    update: {},
    create: {
      email: 'buyer@test.nl',
      name: 'Test Buyer',
      username: 'testbuyer',
      passwordHash: hashedPassword,
      role: UserRole.BUYER,
      bio: 'Test buyer account',
      place: 'Amsterdam',
      gender: 'OTHER',
      interests: ['food', 'local'],
      profileImage: null,
    },
  });

  // Test seller
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.nl' },
    update: {},
    create: {
      email: 'seller@test.nl',
      name: 'Test Seller',
      username: 'testseller',
      passwordHash: hashedPassword,
      role: UserRole.SELLER,
      bio: 'Test seller account',
      place: 'Amsterdam',
      gender: 'OTHER',
      interests: ['cooking', 'business'],
      profileImage: null,
    },
  });

  // Test delivery driver
  const delivery = await prisma.user.upsert({
    where: { email: 'delivery@test.nl' },
    update: {},
    create: {
      email: 'delivery@test.nl',
      name: 'Test Delivery',
      username: 'testdelivery',
      passwordHash: hashedPassword,
      role: UserRole.USER,
      bio: 'Test delivery driver',
      place: 'Amsterdam',
      gender: 'OTHER',
      interests: ['delivery', 'transport'],
      profileImage: null,
    },
  });

  // Note: DeliveryProfile and SellerProfile can be created through the UI
  console.log('💡 DeliveryProfile and SellerProfile can be created through the UI');

  console.log('✅ Database seeded successfully!');
  console.log('📧 Test accounts created:');
  console.log('   Admin: admin@homecheff.nl / password123');
  console.log('   Buyer: buyer@test.nl / password123');
  console.log('   Seller: seller@test.nl / password123');
  console.log('   Delivery: delivery@test.nl / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
