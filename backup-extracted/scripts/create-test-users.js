const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('👥 Creating test users with products...');

    // Test users data
    const testUsers = [
      {
        name: "Anna Bakker",
        username: "anna_bakker_2",
        email: "anna2@test.com",
        password: "test123",
        bio: "Passionate home chef specializing in Dutch comfort food",
        place: "Amsterdam",
        role: "SELLER",
        products: [
          {
            title: "Hollandse Stamppot",
            description: "Traditionele stamppot met boerenkool, worst en jus. Perfect voor koude winterdagen!",
            priceCents: 1250,
            category: "CHEFF",
            subcategory: "Hoofdgerecht",
            delivery: "BOTH",
            unit: "PORTION",
            stock: 8,
            maxStock: 10,
            isActive: true,
            displayNameType: "FULL_NAME",
            images: [
              "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500",
              "https://images.unsplash.com/photo-1574484284002-952d92456975?w=500"
            ]
          },
          {
            title: "Appelgebak met Slagroom",
            description: "Huisgemaakte appelgebak met kaneel en verse slagroom. Oma's recept!",
            priceCents: 850,
            category: "CHEFF",
            subcategory: "Dessert",
            delivery: "PICKUP",
            unit: "STUK",
            stock: 6,
            maxStock: 8,
            isActive: true,
            displayNameType: "FULL_NAME",
            images: [
              "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500"
            ]
          }
        ]
      },
      {
        name: "Tom Groen",
        username: "tom_groen",
        email: "tom2@test.com",
        password: "test123",
        bio: "Urban gardener growing fresh herbs and vegetables in my backyard",
        place: "Utrecht",
        role: "SELLER",
        products: [
          {
            title: "Verse Kruiden Mix",
            description: "Biologische basilicum, peterselie, tijm en oregano. Vers geplukt uit eigen tuin!",
            priceCents: 450,
            category: "GROWN",
            subcategory: "Kruiden",
            delivery: "BOTH",
            unit: "BOSJE",
            stock: 12,
            maxStock: 15,
            isActive: true,
            displayNameType: "USERNAME",
            images: [
              "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
              "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500"
            ]
          },
          {
            title: "Cherry Tomaten",
            description: "Zoete cherry tomaten, perfect voor salades of als snack. Zonder pesticiden gekweekt.",
            priceCents: 350,
            category: "GROWN",
            subcategory: "Groenten",
            delivery: "PICKUP",
            unit: "STUK",
            stock: 10,
            maxStock: 12,
            isActive: true,
            displayNameType: "USERNAME",
            images: [
              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500"
            ]
          }
        ]
      },
      {
        name: "Lisa Design",
        username: "lisa_design",
        email: "lisa2@test.com",
        password: "test123",
        bio: "Creative designer making unique handmade items and home decor",
        place: "Rotterdam",
        role: "SELLER",
        products: [
          {
            title: "Handgemaakte Keramiek Schalen",
            description: "Unieke keramiek schalen in verschillende maten en kleuren. Perfect voor salades of decoratie!",
            priceCents: 2500,
            category: "DESIGNER",
            subcategory: "Keuken & Tafel",
            delivery: "BOTH",
            unit: "STUK",
            stock: 5,
            maxStock: 8,
            isActive: true,
            displayNameType: "FULL_NAME",
            images: [
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
              "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500"
            ]
          },
          {
            title: "Gehaakte Placemats",
            description: "Vintage gehaakte placemats in pastel kleuren. Uniek en duurzaam!",
            priceCents: 1800,
            category: "DESIGNER",
            subcategory: "Textiel",
            delivery: "BOTH",
            unit: "SET",
            stock: 3,
            maxStock: 5,
            isActive: true,
            displayNameType: "FULL_NAME",
            images: [
              "https://images.unsplash.com/photo-1586023492125-27b2c04ef4f7?w=500"
            ]
          }
        ]
      },
      {
        name: "Marco Italiaans",
        username: "marco_italiaans",
        email: "marco2@test.com",
        password: "test123",
        bio: "Italian chef bringing authentic flavors to the Netherlands",
        place: "Den Haag",
        role: "SELLER",
        products: [
          {
            title: "Verse Pasta Carbonara",
            description: "Authentieke Italiaanse carbonara met pancetta en pecorino kaas. Vers gemaakt!",
            priceCents: 1650,
            category: "CHEFF",
            subcategory: "Pasta",
            delivery: "BOTH",
            unit: "PORTION",
            stock: 15,
            maxStock: 20,
            isActive: true,
            displayNameType: "USERNAME",
            images: [
              "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500",
              "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500"
            ]
          },
          {
            title: "Tiramisu Dessert",
            description: "Klassieke tiramisu met mascarpone en espresso. Perfecte afsluiter!",
            priceCents: 950,
            category: "CHEFF",
            subcategory: "Dessert",
            delivery: "PICKUP",
            unit: "STUK",
            stock: 8,
            maxStock: 10,
            isActive: true,
            displayNameType: "USERNAME",
            images: [
              "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500"
            ]
          }
        ]
      },
      {
        name: "Sophie Bloemen",
        username: "sophie_bloemen",
        email: "sophie2@test.com",
        password: "test123",
        bio: "Flower enthusiast growing beautiful blooms and creating floral arrangements",
        place: "Eindhoven",
        role: "SELLER",
        products: [
          {
            title: "Zonnebloemen Boeket",
            description: "Vrolijke zonnebloemen uit eigen tuin. Perfect om iemand blij te maken!",
            priceCents: 1200,
            category: "GROWN",
            subcategory: "Bloemen",
            delivery: "BOTH",
            unit: "STUK",
            stock: 6,
            maxStock: 8,
            isActive: true,
            displayNameType: "FULL_NAME",
            images: [
              "https://images.unsplash.com/photo-1597848212624-e19a35c4c4b0?w=500",
              "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500"
            ]
          },
          {
            title: "Lavendel Zakjes",
            description: "Gedroogde lavendel in linnen zakjes. Perfect voor in de kast of onder het kussen!",
            priceCents: 650,
            category: "GROWN",
            subcategory: "Kruiden",
            delivery: "BOTH",
            unit: "SET",
            stock: 20,
            maxStock: 25,
            isActive: true,
            displayNameType: "FULL_NAME",
            images: [
              "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500"
            ]
          }
        ]
      }
    ];

    for (const userData of testUsers) {
      console.log(`\n👤 Creating user: ${userData.name}`);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          bio: userData.bio,
          place: userData.place,
          role: userData.role,
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          taxResponsibilityAccepted: true,
          taxResponsibilityAcceptedAt: new Date()
        }
      });

      console.log(`✅ User created: ${user.name} (${user.email})`);

      // Create seller profile
      const sellerProfile = await prisma.sellerProfile.create({
        data: {
          id: `sp_${user.id}`,
          userId: user.id,
          displayName: userData.displayNameType === "FULL_NAME" ? user.name : user.username,
          bio: userData.bio,
          lat: 52.3676 + (Math.random() - 0.5) * 0.1, // Random location around Netherlands
          lng: 4.9041 + (Math.random() - 0.5) * 0.1,
          btw: null,
          companyName: null,
          kvk: null,
          subscriptionId: null,
          subscriptionValidUntil: null
        }
      });

      console.log(`✅ Seller profile created for ${user.name}`);

      // Create products
      for (const productData of userData.products) {
        console.log(`  📦 Creating product: ${productData.title}`);
        
        const product = await prisma.product.create({
          data: {
            sellerId: sellerProfile.id,
            category: productData.category,
            title: productData.title,
            description: productData.description,
            priceCents: productData.priceCents,
            unit: productData.unit,
            delivery: productData.delivery,
            isActive: productData.isActive,
            stock: productData.stock,
            maxStock: productData.maxStock,
            displayNameType: productData.displayNameType
          }
        });

        // Create images for product
        for (let i = 0; i < productData.images.length; i++) {
          await prisma.image.create({
            data: {
              id: `img_${product.id}_${i}`,
              productId: product.id,
              fileUrl: productData.images[i],
              sortOrder: i
            }
          });
        }

        console.log(`    ✅ Product created: ${product.title} with ${productData.images.length} images`);
      }
    }

    console.log('\n🎉 All test users and products created successfully!');
    console.log('\n📊 Summary:');
    console.log('- 5 test users created');
    console.log('- 10 products created across different categories');
    console.log('- Mix of CHEFF, GROWN, and DESIGNER products');
    console.log('- Different display name preferences');
    console.log('- Various delivery options and stock levels');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
