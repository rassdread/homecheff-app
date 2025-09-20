const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findOldProducts() {
  try {
    console.log('🔍 Zoeken naar oude producten...');

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

    console.log('\n📊 Huidige Database Status:');
    console.log(`- Products (nieuw): ${products.length}`);
    console.log(`- Listings (oud): ${listings.length}`);
    console.log(`- Images (Product): ${images.length}`);
    console.log(`- ListingMedia (Listing): ${listingMedia.length}`);
    console.log(`- Favorites: ${favorites.length}`);

    if (listings.length > 0) {
      console.log('\n📋 Oude Listings gevonden:');
      listings.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.title} (${listing.id})`);
        console.log(`   - Eigenaar: ${listing.User?.name || listing.User?.email || 'Onbekend'}`);
        console.log(`   - Prijs: €${(listing.priceCents / 100).toFixed(2)}`);
        console.log(`   - Status: ${listing.status}`);
        console.log(`   - Gemaakt: ${listing.createdAt.toISOString()}`);
        console.log(`   - Media: ${listing.ListingMedia.length} items`);
        console.log('');
      });
    }

    if (listingMedia.length > 0) {
      console.log('\n📸 ListingMedia items:');
      listingMedia.forEach((media, index) => {
        console.log(`${index + 1}. ${media.url} (Listing: ${media.listingId})`);
      });
    }

    if (favorites.length > 0) {
      console.log('\n❤️  Favorites:');
      favorites.forEach((favorite, index) => {
        console.log(`${index + 1}. User: ${favorite.userId}`);
        console.log(`   - Product ID: ${favorite.productId || 'Geen'}`);
        console.log(`   - Listing ID: ${favorite.listingId || 'Geen'}`);
      });
    }

    if (listings.length === 0 && listingMedia.length === 0 && favorites.length === 0) {
      console.log('\n✅ Geen oude producten gevonden! Database is schoon.');
    } else {
      console.log('\n⚠️  Er zijn nog oude producten aanwezig.');
      console.log('💡 Gebruik het cleanup script om deze te verwijderen zonder gebruikers te raken.');
    }
    
  } catch (error) {
    console.error('❌ Error bij het zoeken:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findOldProducts();
