const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllData() {
  try {
    console.log('🔍 Checking all data in database...');

    // Check all tables
    const tables = [
      'User',
      'SellerProfile', 
      'Product',
      'Listing',
      'Image',
      'ListingMedia',
      'Favorite',
      'OrderItem',
      'Order',
      'Transaction',
      'Business',
      'Subscription',
      'Follow',
      'Message',
      'Conversation',
      'Notification',
      'AuditLog',
      'Report',
      'Review',
      'Reservation',
      'Coupon',
      'DeviceToken',
      'VerificationToken',
      'Session',
      'Account'
    ];

    console.log('\n📊 Database Overview:');
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        if (count > 0) {
          console.log(`${table}: ${count} records`);
        }
      } catch (error) {
        console.log(`${table}: Error - ${error.message}`);
      }
    }

    // Check specific product-related data
    console.log('\n🛍️  Product Related Data:');
    
    const products = await prisma.product.findMany({
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
    });

    const listings = await prisma.listing.findMany({
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
    });

    const images = await prisma.image.findMany();
    const listingMedia = await prisma.listingMedia.findMany();
    const favorites = await prisma.favorite.findMany();

    console.log(`Products: ${products.length}`);
    console.log(`Listings: ${listings.length}`);
    console.log(`Images: ${images.length}`);
    console.log(`Listing Media: ${listingMedia.length}`);
    console.log(`Favorites: ${favorites.length}`);

    // Show details if any exist
    if (products.length > 0) {
      console.log('\n📦 Product Details:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} (${product.id})`);
        console.log(`   - Seller: ${product.seller?.User?.name || product.seller?.User?.email || 'Unknown'}`);
        console.log(`   - Price: €${(product.priceCents / 100).toFixed(2)}`);
        console.log(`   - Created: ${product.createdAt.toISOString()}`);
        console.log(`   - Images: ${product.Image.length}`);
      });
    }

    if (listings.length > 0) {
      console.log('\n📋 Listing Details:');
      listings.forEach((listing, index) => {
        console.log(`${index + 1}. ${listing.title} (${listing.id})`);
        console.log(`   - User: ${listing.User?.name || listing.User?.email || 'Unknown'}`);
        console.log(`   - Price: €${(listing.priceCents / 100).toFixed(2)}`);
        console.log(`   - Created: ${listing.createdAt.toISOString()}`);
        console.log(`   - Media: ${listing.ListingMedia.length}`);
      });
    }

    if (images.length > 0) {
      console.log('\n🖼️  Image Details:');
      images.forEach((image, index) => {
        console.log(`${index + 1}. ${image.fileUrl}`);
        console.log(`   - Product ID: ${image.productId}`);
        console.log(`   - Sort Order: ${image.sortOrder}`);
      });
    }

    if (listingMedia.length > 0) {
      console.log('\n📸 Listing Media Details:');
      listingMedia.forEach((media, index) => {
        console.log(`${index + 1}. ${media.url}`);
        console.log(`   - Listing ID: ${media.listingId}`);
        console.log(`   - Order: ${media.order}`);
      });
    }

    if (favorites.length > 0) {
      console.log('\n❤️  Favorites Details:');
      favorites.forEach((favorite, index) => {
        console.log(`${index + 1}. User: ${favorite.userId}`);
        console.log(`   - Product ID: ${favorite.productId || 'None'}`);
        console.log(`   - Listing ID: ${favorite.listingId || 'None'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();



