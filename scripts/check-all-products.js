const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllProducts() {
  try {
    // Check Product model (new)
    const newProducts = await prisma.product.findMany({
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
        Image: {
          select: { fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    newProducts.forEach((product, index) => {
    });

    // Check Listing model (old)
    const oldListings = await prisma.listing.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        ListingMedia: {
          select: { url: true, order: true },
          orderBy: { order: 'asc' }
        }
      }
    });
    oldListings.forEach((listing, index) => {
    });

    // Check images
    const images = await prisma.image.findMany();
    images.forEach((image, index) => {
    });

    // Check listing media
    const listingMedia = await prisma.listingMedia.findMany();
    listingMedia.forEach((media, index) => {
    });
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProducts();

