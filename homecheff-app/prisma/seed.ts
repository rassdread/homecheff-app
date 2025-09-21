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

// Sample garden/plant images
const gardenImages = [
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop'
];

// Sample design/craft images
const designImages = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506629905607-6d1c5b1b8c7b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506629905607-6d1c5b1b8c7b?w=400&h=300&fit=crop'
];

async function main() {
  console.log('🌱 Seeding database with comprehensive test data...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create 5 test users with complete profiles
  const users: any[] = [];
  
  const userData = [
    { name: 'Admin User', username: 'admin', email: 'admin@homecheff.nl', role: UserRole.ADMIN, bio: 'Platform administrator', place: 'Amsterdam', interests: ['management', 'platform'] },
    { name: 'Maria Rodriguez', username: 'maria_cooks', email: 'maria@test.nl', role: UserRole.SELLER, bio: 'Passionate home cook from Spain specializing in authentic Mediterranean cuisine', place: 'Amsterdam', interests: ['spanish', 'mediterranean', 'seafood', 'paella', 'tapas'] },
    { name: 'Ahmed Hassan', username: 'ahmed_kitchen', email: 'ahmed@test.nl', role: UserRole.SELLER, bio: 'Middle Eastern cuisine specialist with 15 years of experience in traditional recipes', place: 'Utrecht', interests: ['middle_eastern', 'spices', 'grilled', 'shawarma', 'hummus'] },
    { name: 'Lisa Chen', username: 'lisa_food', email: 'lisa@test.nl', role: UserRole.SELLER, bio: 'Asian fusion cooking expert creating healthy and delicious meals', place: 'Rotterdam', interests: ['asian', 'fusion', 'healthy', 'ramen', 'sushi'] },
    { name: 'James Wilson', username: 'james_buyer', email: 'james@test.nl', role: UserRole.BUYER, bio: 'Food enthusiast and local supporter who loves discovering new flavors', place: 'Amsterdam', interests: ['food', 'local', 'organic', 'sustainable', 'artisanal'] },
    // GROWN category users
    { name: 'Emma van der Berg', username: 'emma_garden', email: 'emma@garden.nl', role: UserRole.SELLER, bio: 'Urban gardener and sustainable living enthusiast growing organic vegetables', place: 'Amsterdam', interests: ['gardening', 'organic', 'sustainable', 'vegetables', 'herbs'] },
    { name: 'Tom de Vries', username: 'tom_grower', email: 'tom@garden.nl', role: UserRole.SELLER, bio: 'Professional gardener specializing in rare herbs and medicinal plants', place: 'Utrecht', interests: ['herbs', 'medicinal', 'rare_plants', 'gardening', 'natural'] },
    { name: 'Sophie Green', username: 'sophie_plants', email: 'sophie@garden.nl', role: UserRole.SELLER, bio: 'Plant lover and indoor gardening expert with beautiful houseplants', place: 'Rotterdam', interests: ['houseplants', 'indoor_gardening', 'decorative', 'succulents', 'flowers'] },
    // DESIGNER category users
    { name: 'Alex Creative', username: 'alex_design', email: 'alex@design.nl', role: UserRole.SELLER, bio: 'Handmade jewelry designer creating unique pieces with natural materials', place: 'Amsterdam', interests: ['jewelry', 'handmade', 'design', 'natural_materials', 'artisan'] },
    { name: 'Maya Artisan', username: 'maya_craft', email: 'maya@design.nl', role: UserRole.SELLER, bio: 'Textile artist and fashion designer creating sustainable clothing', place: 'Den Haag', interests: ['textiles', 'fashion', 'sustainable', 'handmade', 'design'] }
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

  // Create sample products for analytics testing
  const sellerProfiles = await prisma.sellerProfile.findMany({
    include: { User: true }
  });

  const spanishDishes = [
    { title: 'Paella Valenciana', description: 'Authentieke Spaanse rijstschotel met kip en groenten', priceCents: 1850, category: 'CHEFF', unit: 'PORTION' },
    { title: 'Gazpacho Andaluz', description: 'Koude tomatensoep uit Andalusië', priceCents: 850, category: 'CHEFF', unit: 'STUK' },
    { title: 'Tortilla Española', description: 'Spaanse aardappelomelet met ui', priceCents: 1250, category: 'CHEFF', unit: 'STUK' },
    { title: 'Churros con Chocolate', description: 'Gefrituurde deegsticks met warme chocoladesaus', priceCents: 650, category: 'CHEFF', unit: 'STUK' },
    { title: 'Patatas Bravas', description: 'Gekruide aardappelblokjes met pittige saus', priceCents: 750, category: 'CHEFF', unit: 'PORTION' }
  ];

  const middleEasternDishes = [
    { title: 'Hummus Tradicional', description: 'Cremige kikkererwtenpuree met tahini', priceCents: 950, category: 'CHEFF', unit: 'STUK' },
    { title: 'Falafel Plate', description: 'Gefrituurde kikkererwtenballetjes met salade', priceCents: 1450, category: 'CHEFF', unit: 'PORTION' },
    { title: 'Shawarma Wrap', description: 'Gemarineerd vlees in pita brood', priceCents: 1650, category: 'CHEFF', unit: 'STUK' },
    { title: 'Baklava', description: 'Zoete filodeeg met noten en honing', priceCents: 550, category: 'CHEFF', unit: 'STUK' },
    { title: 'Tabouleh Salad', description: 'Verse bulgur salade met kruiden', priceCents: 1150, category: 'CHEFF', unit: 'STUK' }
  ];

  const asianDishes = [
    { title: 'Pad Thai', description: 'Thaise roerbaknoedels met garnalen', priceCents: 1750, category: 'CHEFF', unit: 'PORTION' },
    { title: 'Ramen Tonkotsu', description: 'Japanse noedelsoep met varkensvlees', priceCents: 1950, category: 'CHEFF', unit: 'STUK' },
    { title: 'Spring Rolls', description: 'Verse loempia\'s met groenten', priceCents: 850, category: 'CHEFF', unit: 'STUK' },
    { title: 'Mango Sticky Rice', description: 'Zoete rijst met verse mango', priceCents: 750, category: 'CHEFF', unit: 'STUK' },
    { title: 'Kimchi', description: 'Gefermenteerde kool met kruiden', priceCents: 450, category: 'CHEFF', unit: 'STUK' }
  ];

  const grownProducts = [
    { title: 'Verse Tomaatjes', description: 'Biologische cherry tomaten uit eigen tuin', priceCents: 450, category: 'GROWN', unit: 'BOSJE' },
    { title: 'Kruiden Mix', description: 'Verse basilicum, peterselie en tijm', priceCents: 350, category: 'GROWN', unit: 'BOSJE' },
    { title: 'Lavendel Plant', description: 'Gedroogde lavendel voor aromatherapie', priceCents: 850, category: 'GROWN', unit: 'STUK' },
    { title: 'Aloe Vera', description: 'Gezonde aloe vera plant voor binnen', priceCents: 1250, category: 'GROWN', unit: 'STUK' },
    { title: 'Munt Thee Mix', description: 'Verse munt voor verfrissende thee', priceCents: 250, category: 'GROWN', unit: 'BOSJE' }
  ];

  const designProducts = [
    { title: 'Handgemaakt Sieraad', description: 'Unieke hanger gemaakt van natuurlijke materialen', priceCents: 1850, category: 'DESIGNER', unit: 'STUK' },
    { title: 'Woven Tassen', description: 'Duurzame tas geweven van natuurlijke vezels', priceCents: 2250, category: 'DESIGNER', unit: 'STUK' },
    { title: 'Keramiek Schaal', description: 'Handgemaakte keramiek schaal voor decoratie', priceCents: 1450, category: 'DESIGNER', unit: 'STUK' },
    { title: 'Textiel Kunstwerk', description: 'Wanddecoratie gemaakt van gerecyclede materialen', priceCents: 1950, category: 'DESIGNER', unit: 'M2' },
    { title: 'Houten Beeldje', description: 'Handgesneden houten figuur voor interieur', priceCents: 1650, category: 'DESIGNER', unit: 'STUK' }
  ];

  let productCount = 0;
  for (const seller of sellerProfiles) {
    let dishes = [];
    if (seller.User.name?.includes('Maria')) {
      dishes = spanishDishes;
    } else if (seller.User.name?.includes('Ahmed')) {
      dishes = middleEasternDishes;
    } else if (seller.User.name?.includes('Lisa')) {
      dishes = asianDishes;
    } else if (seller.User.name?.includes('Emma')) {
      dishes = grownProducts;
    } else if (seller.User.name?.includes('Tom')) {
      dishes = grownProducts;
    } else if (seller.User.name?.includes('Sophie')) {
      dishes = grownProducts;
    } else if (seller.User.name?.includes('Alex')) {
      dishes = designProducts;
    } else if (seller.User.name?.includes('Maya')) {
      dishes = designProducts;
    }

    for (const dish of dishes) {
      // Choose appropriate image array based on category
      let imageArray = dishImages;
      if (dish.category === 'GROWN') {
        imageArray = gardenImages;
      } else if (dish.category === 'DESIGNER') {
        imageArray = designImages;
      }

      const product = await prisma.product.create({
        data: {
          id: crypto.randomUUID(),
          title: dish.title,
          description: dish.description,
          priceCents: dish.priceCents,
          category: dish.category as any,
          unit: dish.unit as any,
          delivery: 'BOTH',
          isActive: true,
          sellerId: seller.id,
          Image: {
            createMany: {
              data: [
                {
                  id: crypto.randomUUID(),
                  fileUrl: imageArray[Math.floor(Math.random() * imageArray.length)],
                  sortOrder: 1
                },
                {
                  id: crypto.randomUUID(),
                  fileUrl: imageArray[Math.floor(Math.random() * imageArray.length)],
                  sortOrder: 2
                },
                Math.random() > 0.5 ? {
                  id: crypto.randomUUID(),
                  fileUrl: imageArray[Math.floor(Math.random() * imageArray.length)],
                  sortOrder: 3
                } : null
              ].filter(Boolean)
            }
          }
        }
      });
      productCount++;
    }
  }

  console.log(`✅ Created ${productCount} sample products`);

  console.log('✅ Database seeded successfully!');
  console.log('📧 Test accounts created:');
  console.log('   Admin: admin@homecheff.nl / password123');
  console.log('   CHEFF Sellers: maria@test.nl, ahmed@test.nl, lisa@test.nl / password123');
  console.log('   GROWN Sellers: emma@garden.nl, tom@garden.nl, sophie@garden.nl / password123');
  console.log('   DESIGNER Sellers: alex@design.nl, maya@design.nl / password123');
  console.log('   Buyer: james@test.nl / password123');
  console.log(`🍽️  Created ${productCount} products with images across different categories`);
  console.log('   - Maria (Spanish CHEFF): 5 dishes');
  console.log('   - Ahmed (Middle Eastern CHEFF): 5 dishes');
  console.log('   - Lisa (Asian CHEFF): 5 dishes');
  console.log('   - Emma, Tom, Sophie (GROWN): 5 garden products each');
  console.log('   - Alex, Maya (DESIGNER): 5 design products each');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
