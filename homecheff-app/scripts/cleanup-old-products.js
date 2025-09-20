const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldProducts() {
  try {
    console.log('🧹 Cleanup van alle oude product data...');

    // Stap 1: Verwijder alle gerelateerde data in de juiste volgorde
    console.log('\n1️⃣ Verwijderen van OrderItems...');
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`   ✅ ${orderItems.count} OrderItems verwijderd`);

    console.log('\n2️⃣ Verwijderen van Favorites...');
    const favorites = await prisma.favorite.deleteMany({});
    console.log(`   ✅ ${favorites.count} Favorites verwijderd`);

    console.log('\n3️⃣ Verwijderen van Images (Product gerelateerd)...');
    const images = await prisma.image.deleteMany({});
    console.log(`   ✅ ${images.count} Images verwijderd`);

    console.log('\n4️⃣ Verwijderen van ListingMedia...');
    const listingMedia = await prisma.listingMedia.deleteMany({});
    console.log(`   ✅ ${listingMedia.count} ListingMedia verwijderd`);

    console.log('\n5️⃣ Verwijderen van Products (nieuw model)...');
    const products = await prisma.product.deleteMany({});
    console.log(`   ✅ ${products.count} Products verwijderd`);

    console.log('\n6️⃣ Verwijderen van Listings (oud model)...');
    const listings = await prisma.listing.deleteMany({});
    console.log(`   ✅ ${listings.count} Listings verwijderd`);

    // Stap 2: Verwijder eventuele orphaned records
    console.log('\n7️⃣ Controleren op orphaned records...');
    
    // Controleer alle SellerProfiles en hun Users
    const allSellerProfiles = await prisma.sellerProfile.findMany({
      include: {
        User: true
      }
    });
    
    const orphanedSellerProfiles = allSellerProfiles.filter(profile => !profile.User);
    
    if (orphanedSellerProfiles.length > 0) {
      console.log(`   🧹 ${orphanedSellerProfiles.length} orphaned SellerProfiles gevonden, verwijderen...`);
      for (const profile of orphanedSellerProfiles) {
        await prisma.sellerProfile.delete({
          where: { id: profile.id }
        });
      }
      console.log('   ✅ Orphaned SellerProfiles verwijderd');
    }

    // Controleer alle Business records en hun Users
    const allBusinesses = await prisma.business.findMany({
      include: {
        user: true
      }
    });
    
    const orphanedBusinesses = allBusinesses.filter(business => !business.user);
    
    if (orphanedBusinesses.length > 0) {
      console.log(`   🧹 ${orphanedBusinesses.length} orphaned Business records gevonden, verwijderen...`);
      for (const business of orphanedBusinesses) {
        await prisma.business.delete({
          where: { id: business.id }
        });
      }
      console.log('   ✅ Orphaned Business records verwijderd');
    }

    // Stap 3: Finale verificatie
    console.log('\n8️⃣ Finale verificatie...');
    const [finalProducts, finalListings, finalImages, finalListingMedia, finalFavorites] = await Promise.all([
      prisma.product.count(),
      prisma.listing.count(),
      prisma.image.count(),
      prisma.listingMedia.count(),
      prisma.favorite.count()
    ]);

    console.log('\n📊 Finale Status:');
    console.log(`- Products: ${finalProducts}`);
    console.log(`- Listings: ${finalListings}`);
    console.log(`- Images: ${finalImages}`);
    console.log(`- ListingMedia: ${finalListingMedia}`);
    console.log(`- Favorites: ${finalFavorites}`);

    if (finalProducts === 0 && finalListings === 0 && finalImages === 0 && finalListingMedia === 0 && finalFavorites === 0) {
      console.log('\n🎉 Cleanup succesvol voltooid!');
      console.log('✅ Alle oude product data is verwijderd');
      console.log('✅ Gebruikers zijn onaangeroerd gebleven');
      console.log('✅ Je kunt nu nieuwe producten toevoegen zonder conflicten');
    } else {
      console.log('\n⚠️  Er zijn nog steeds enkele records aanwezig');
    }

    // Stap 4: Toon gebruiker statistieken
    const userCount = await prisma.user.count();
    const sellerProfileCount = await prisma.sellerProfile.count();
    const businessCount = await prisma.business.count();

    console.log('\n👥 Gebruiker Status:');
    console.log(`- Gebruikers: ${userCount}`);
    console.log(`- SellerProfiles: ${sellerProfileCount}`);
    console.log(`- Business records: ${businessCount}`);
    
  } catch (error) {
    console.error('❌ Error tijdens cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldProducts();
