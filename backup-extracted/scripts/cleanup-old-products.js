const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldProducts() {
  try {
    // Stap 1: Verwijder alle gerelateerde data in de juiste volgorde
    const orderItems = await prisma.orderItem.deleteMany({});
    const favorites = await prisma.favorite.deleteMany({});
    const images = await prisma.image.deleteMany({});
    const listingMedia = await prisma.listingMedia.deleteMany({});
    const products = await prisma.product.deleteMany({});
    const listings = await prisma.listing.deleteMany({});
    // Stap 2: Verwijder eventuele orphaned records
    // Controleer alle SellerProfiles en hun Users
    const allSellerProfiles = await prisma.sellerProfile.findMany({
      include: {
        User: true
      }
    });
    
    const orphanedSellerProfiles = allSellerProfiles.filter(profile => !profile.User);
    
    if (orphanedSellerProfiles.length > 0) {
      for (const profile of orphanedSellerProfiles) {
        await prisma.sellerProfile.delete({
          where: { id: profile.id }
        });
      }
    }

    // Controleer alle Business records en hun Users
    const allBusinesses = await prisma.business.findMany({
      include: {
        user: true
      }
    });
    
    const orphanedBusinesses = allBusinesses.filter(business => !business.user);
    
    if (orphanedBusinesses.length > 0) {
      for (const business of orphanedBusinesses) {
        await prisma.business.delete({
          where: { id: business.id }
        });
      }
    }

    // Stap 3: Finale verificatie
    const [finalProducts, finalListings, finalImages, finalListingMedia, finalFavorites] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
      prisma.image.count(),
      prisma.listingMedia.count(),
      prisma.favorite.count()
    ]);
    if (finalProducts === 0 && finalListings === 0 && finalImages === 0 && finalListingMedia === 0 && finalFavorites === 0) {
    } else {
    }

    // Stap 4: Toon gebruiker statistieken
    const userCount = await prisma.user.count();
    const sellerProfileCount = await prisma.sellerProfile.count();
    const businessCount = await prisma.business.count();
  } catch (error) {
    console.error('❌ Error tijdens cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldProducts();
