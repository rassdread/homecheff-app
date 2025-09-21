const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllProducts() {
  try {
    console.log('🔍 Checking all products in database...');

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

    console.log(`\n📦 New Product Model (${newProducts.length} items):`);
    newProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   - ID: ${product.id}`);
      console.log(`   - Seller: ${product.seller?.User?.name || product.seller?.User?.email || 'Unknown'}`);
      console.log(`   - Price: €${(product.priceCents / 100).toFixed(2)}`);
      console.log(`   - Created: ${product.createdAt.toISOString()}`);
      console.log(`   - Active: ${product.isActive}`);
      console.log(`   - Images: ${product.Image.length}`);
      console.log('');
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

    console.log(`\n📋 Old Listing Model (${oldListings.length} items):`);
    oldListings.forEach((listing, index) => {
      console.log(`${index + 1}. ${listing.title}`);
      console.log(`   - ID: ${listing.id}`);
      console.log(`   - User: ${listing.User?.name || listing.User?.email || 'Unknown'}`);
      console.log(`   - Price: €${(listing.priceCents / 100).toFixed(2)}`);
      console.log(`   - Created: ${listing.createdAt.toISOString()}`);
      console.log(`   - Status: ${listing.status}`);
      console.log(`   - Images: ${listing.ListingMedia.length}`);
      console.log('');
    });

    // Check images
    const images = await prisma.image.findMany();
    console.log(`\n🖼️  Images (${images.length} items):`);
    images.forEach((image, index) => {
      console.log(`${index + 1}. ${image.fileUrl}`);
      console.log(`   - Product ID: ${image.productId}`);
      console.log(`   - Sort Order: ${image.sortOrder}`);
      console.log('');
    });

    // Check listing media
    const listingMedia = await prisma.listingMedia.findMany();
    console.log(`\n📸 Listing Media (${listingMedia.length} items):`);
    listingMedia.forEach((media, index) => {
      console.log(`${index + 1}. ${media.url}`);
      console.log(`   - Listing ID: ${media.listingId}`);
      console.log(`   - Order: ${media.order}`);
      console.log('');
    });

    console.log(`\n📊 Summary:`);
    console.log(`- New Products: ${newProducts.length}`);
    console.log(`- Old Listings: ${oldListings.length}`);
    console.log(`- Images: ${images.length}`);
    console.log(`- Listing Media: ${listingMedia.length}`);
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProducts();



