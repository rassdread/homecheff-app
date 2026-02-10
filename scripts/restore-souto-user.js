const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreSoutoUser() {
  try {
    // Check if Souto user already exists
    let soutoUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'souto@example.com' },
          { name: 'Souto' },
          { username: 'souto_chef' }
        ]
      }
    });

    if (!soutoUser) {
      // Create Souto user
      soutoUser = await prisma.user.create({
        data: {
          email: 'souto@example.com',
          name: 'Souto',
          username: 'souto_chef',
          role: 'SELLER',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          termsAccepted: true,
          privacyPolicyAccepted: true,
        }
      });
    } else {
    }

    // Check if seller profile already exists
    let sellerProfile = await prisma.sellerProfile.findFirst({
      where: { userId: soutoUser.id }
    });

    if (!sellerProfile) {
      // Create seller profile for Souto
      sellerProfile = await prisma.sellerProfile.create({
        data: {
          id: `seller-${soutoUser.id}`,
          userId: soutoUser.id,
          displayName: 'Souto',
          bio: 'Passionate home chef sharing delicious meals',
          lat: 52.3676,
          lng: 4.9041,
          deliveryMode: 'BOTH',
          deliveryRadius: 10,
        }
      });
    } else {
    }

    // Check if product already exists
    let product = await prisma.product.findFirst({
      where: {
        title: 'Huisgemaakte Pasta Carbonara',
        sellerId: sellerProfile.id
      }
    });

    if (!product) {
      // Create a sample product
      product = await prisma.product.create({
        data: {
          id: `product-${Date.now()}`,
          title: 'Huisgemaakte Pasta Carbonara',
          description: 'Verse pasta carbonara gemaakt met echte pancetta en Parmezaanse kaas. Perfect voor een romige, smaakvolle maaltijd.',
          priceCents: 1250, // €12.50
          category: 'CHEFF',
          unit: 'PORTION',
          delivery: 'BOTH',
          stock: 3,
          maxStock: 5,
          isActive: true,
          sellerId: sellerProfile.id
        }
      });
      // Add product images
      const images = [
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop'
      ];

      for (let i = 0; i < images.length; i++) {
        await prisma.image.create({
          data: {
            id: `image-${product.id}-${i}`,
            fileUrl: images[i],
            productId: product.id,
          }
        });
      }
    } else {
    }
  } catch (error) {
    console.error('❌ Error restoring Souto user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreSoutoUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
