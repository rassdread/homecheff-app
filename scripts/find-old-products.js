const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findOldProducts() {
  try {
    // Check alle product-gerelateerde tabellen
    const [products, listings, images, listingMedia, favorites] = await Promise.all([
      prisma.product.findMany({
        include: {
          seller: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true
                }
              }
            }
          },
          Image: true
        }
      }),
      prisma.listing.findMany({
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          },
          ListingMedia: true
        }
      }),
      prisma.image.findMany(),
      prisma.listingMedia.findMany(),
      prisma.favorite.findMany()
    ]);
    if (listings.length > 0) {
      listings.forEach((listing, index) => {
      });
    }

    if (listingMedia.length > 0) {
      listingMedia.forEach((media, index) => {
      });
    }

    if (favorites.length > 0) {
      favorites.forEach((favorite, index) => {
      });
    }

    if (listings.length === 0 && listingMedia.length === 0 && favorites.length === 0) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error bij het zoeken:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findOldProducts();

