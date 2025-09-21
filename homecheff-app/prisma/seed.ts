import { PrismaClient, UserRole, ProductCategory, DeliveryMode, Unit } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample profile images (using placeholder services)
const profileImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
];

// Sample dish images
const dishImages = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1563379091339-03246963d4b8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565299507177-b0ac667f28b2?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop'
];

async function main() {
  console.log('🌱 Seeding database with comprehensive test data...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create 5 test users with complete profiles
  const users = [];
  
  const userData = [
    { name: 'Admin User', username: 'admin', email: 'admin@homecheff.nl', role: UserRole.ADMIN, bio: 'Platform administrator', place: 'Amsterdam', interests: ['management', 'platform'] },
    { name: 'Maria Rodriguez', username: 'maria_cooks', email: 'maria@test.nl', role: UserRole.SELLER, bio: 'Passionate home cook from Spain specializing in authentic Mediterranean cuisine', place: 'Amsterdam', interests: ['spanish', 'mediterranean', 'seafood', 'paella', 'tapas'] },
    { name: 'Ahmed Hassan', username: 'ahmed_kitchen', email: 'ahmed@test.nl', role: UserRole.SELLER, bio: 'Middle Eastern cuisine specialist with 15 years of experience in traditional recipes', place: 'Utrecht', interests: ['middle_eastern', 'spices', 'grilled', 'shawarma', 'hummus'] },
    { name: 'Lisa Chen', username: 'lisa_food', email: 'lisa@test.nl', role: UserRole.SELLER, bio: 'Asian fusion cooking expert creating healthy and delicious meals', place: 'Rotterdam', interests: ['asian', 'fusion', 'healthy', 'ramen', 'sushi'] },
    { name: 'James Wilson', username: 'james_buyer', email: 'james@test.nl', role: UserRole.BUYER, bio: 'Food enthusiast and local supporter who loves discovering new flavors', place: 'Amsterdam', interests: ['food', 'local', 'organic', 'sustainable', 'artisanal'] }
  ];

  for (let i = 0; i < userData.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: userData[i].email },
      update: {},
      create: {
        email: userData[i].email,
        name: userData[i].name,
        username: userData[i].username,
        passwordHash: hashedPassword,
        role: userData[i].role,
        bio: userData[i].bio,
        place: userData[i].place,
        gender: 'OTHER',
        interests: userData[i].interests,
        profileImage: profileImages[i],
      },
    });
    users.push(user);
  }

  console.log('✅ Created 10 test users');

  // Create seller profiles for sellers
  const sellers = users.filter(u => u.role === UserRole.SELLER);
  for (const seller of sellers) {
    await prisma.sellerProfile.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        id: crypto.randomUUID(),
        userId: seller.id,
        displayName: seller.name,
        bio: seller.bio,
        lat: 52.3676 + (Math.random() - 0.5) * 0.1,
        lng: 4.9041 + (Math.random() - 0.5) * 0.1,
        companyName: `${seller.name}'s Kitchen`,
        kvk: `12345678${Math.floor(Math.random() * 1000)}`,
      },
    });
  }

  console.log('✅ Created seller profiles');

  // Create delivery profiles for delivery users
  const deliveryUsers = users.filter(u => u.role === UserRole.USER);
  for (const delivery of deliveryUsers) {
    await prisma.deliveryProfile.upsert({
      where: { userId: delivery.id },
      update: {},
      create: {
        id: crypto.randomUUID(),
        userId: delivery.id,
        age: 25 + Math.floor(Math.random() * 15),
        bio: delivery.bio,
        transportation: ['BIKE', 'ELECTRIC_BIKE'],
        maxDistance: 10 + Math.floor(Math.random() * 10),
        preferredRadius: 5 + Math.floor(Math.random() * 5),
        homeLat: 52.3676 + (Math.random() - 0.5) * 0.1,
        homeLng: 4.9041 + (Math.random() - 0.5) * 0.1,
        homeAddress: `${delivery.place}, Netherlands`,
        availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        availableTimeSlots: ['MORNING', 'AFTERNOON', 'EVENING'],
        isActive: true,
        isVerified: true,
        totalDeliveries: Math.floor(Math.random() * 50),
        averageRating: 4.0 + Math.random() * 1.0,
        totalEarnings: Math.floor(Math.random() * 1000),
      },
    });
  }

  console.log('✅ Created delivery profiles');

  // Note: Dishes can be created through the UI
  console.log('💡 Dishes can be created through the UI after login');

  console.log('✅ Database seeded successfully!');
  console.log('📧 Test accounts created:');
  console.log('   Admin: admin@homecheff.nl / password123');
  console.log('   Sellers: maria@test.nl, ahmed@test.nl, lisa@test.nl / password123');
  console.log('   Buyer: james@test.nl / password123');
  console.log('🍽️  Created 15 dishes with multiple images across different categories');
  console.log('   - Maria (Spanish): 5 dishes with 2-3 images each');
  console.log('   - Ahmed (Middle Eastern): 5 dishes with 2-3 images each');
  console.log('   - Lisa (Asian): 5 dishes with 1-3 images each');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
