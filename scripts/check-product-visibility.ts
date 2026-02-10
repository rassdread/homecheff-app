import { PrismaClient } from '@prisma/client';
import { isStripeTestId } from '../lib/stripe';

const prisma = new PrismaClient();

async function checkProductVisibility() {
  try {
    // Find product by title containing "pindasoep"
    const product = await prisma.product.findFirst({
      where: {
        title: {
          contains: 'pindasoep',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        priceCents: true,
        stock: true,
        seller: {
          select: {
            id: true,
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                stripeConnectAccountId: true
              }
            }
          }
        },
        orderItems: {
          select: {
            id: true,
            Order: {
              select: {
                id: true,
                stripeSessionId: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('=== Product Details ===');
    console.log(`ID: ${product.id}`);
    console.log(`Title: ${product.title}`);
    console.log(`isActive: ${product.isActive}`);
    console.log(`Price: €${(product.priceCents / 100).toFixed(2)}`);
    console.log(`Stock: ${product.stock}`);
    console.log(`Pickup Location: Not available in database schema`);
    console.log(`Orders: ${product.orderItems.length}`);
    console.log('\n=== Seller Details ===');
    console.log(`Seller ID: ${product.seller?.id}`);
    console.log(`User: ${product.seller?.User?.name || product.seller?.User?.username}`);
    console.log(`Email: ${product.seller?.User?.email}`);
    console.log(`Stripe Connect Account ID: ${product.seller?.User?.stripeConnectAccountId || 'None'}`);
    
    if (product.seller?.User?.stripeConnectAccountId) {
      const isTest = isStripeTestId(product.seller.User.stripeConnectAccountId);
      console.log(`Stripe Account Type: ${isTest ? 'TEST' : 'LIVE'}`);
    }

    console.log('\n=== Visibility Check ===');
    
    // Check feed API filtering logic
    if (!product.isActive) {
      console.log('❌ Product is INACTIVE - will be filtered unless it has orders');
      if (product.orderItems.length === 0) {
        console.log('   ⚠️  Product has NO orders - will be filtered from feed');
      } else {
        console.log('   ✅ Product has orders - should be visible in feed');
      }
    } else {
      console.log('✅ Product is ACTIVE');
    }

    if (product.priceCents && product.priceCents > 0) {
      console.log('✅ Product has price');
      if (!product.seller?.User?.stripeConnectAccountId) {
        console.log('✅ No Stripe Connect account - product will be shown (created from recipe)');
      } else {
        const isTest = isStripeTestId(product.seller.User.stripeConnectAccountId);
        if (isTest) {
          console.log('❌ Stripe Connect account is TEST - product will be FILTERED from feed');
        } else {
          console.log('✅ Stripe Connect account is LIVE - product will be shown');
        }
      }
    } else {
      console.log('✅ Product has no price (inspiration) - will always be shown');
    }

    console.log('📍 Pickup location check skipped (column not in database schema)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductVisibility();

