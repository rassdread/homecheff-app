import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStripeTestId } from "@/lib/stripe";
import { sanitizeInput } from "@/lib/security";
import { sanitizeProductForPublic } from "@/lib/data-isolation";

// BALANCED CACHING - snel maar compleet
// Cache for 30 seconds - balance between freshness and performance
// Temporarily disabled for debugging
export const revalidate = 0; // Disable cache temporarily to debug product visibility
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const startTime = Date.now();
  
  try {
    console.log('[Products API] ========== REQUEST START ==========');
    console.log('[Products API] Request received');
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? 0), 0);
    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 10), 1), 100);
    const isMobile = searchParams.get("mobile") === "true";
    const skip = page * take;
    const userId = searchParams.get("userId");
    
    console.log('[Products API] Query params:', { page, take, skip, isMobile, userId });

    // BALANCED OPTIMIZATION - snel maar compleet
    // Filter: products with price must have live Stripe Connect account, inspiration (no price) always visible
    console.log('[Products API] Starting database query...');
    let allProducts: any[] = []; // Initialize as empty array to prevent errors
    try {
      // SIMPLIFIED QUERY - Start with minimal fields to isolate the problem
      console.log('[Products API] Executing Prisma query...');
      allProducts = await prisma.product.findMany({
        where: { 
          // isActive: true // TEMPORARILY DISABLED FOR DEBUGGING
        },
        orderBy: [
          { createdAt: "desc" }
        ],
        skip: skip,
        take: take,
        select: {
          id: true,
          title: true,
          description: isMobile ? false : true,
          priceCents: true,
          category: true,
          delivery: true,
          createdAt: true,
          isActive: true,
          stock: true,
          maxStock: true,
          seller: {
            select: {
              id: true,
              lat: true,
              lng: true,
              kvk: true,
              companyName: true,
              User: {
                select: { 
                  id: true, 
                  username: true,
                  name: true,
                  profileImage: true,
                  place: true,
                  buyerRoles: true,
                  displayFullName: true,
                  displayNameOption: true,
                  stripeConnectAccountId: true
                },
              }
            }
          },
          Image: {
            select: {
              fileUrl: true,
              sortOrder: true
            },
            orderBy: { sortOrder: 'asc' }
          },
          Video: {
            select: {
              id: true,
              url: true,
              thumbnail: true,
              duration: true,
              createdAt: true
            }
            // Note: Video is a one-to-one relation (ProductVideo?), not an array
            // So we don't use orderBy or take
          },
        },
      });
      console.log('[Products API] ✅ Database query completed, fetched', allProducts.length, 'products');
    } catch (dbError: any) {
      console.error('[Products API] Database query error:', dbError);
      console.error('[Products API] Error message:', dbError?.message);
      console.error('[Products API] Error stack:', dbError?.stack);
      // Do not throw, continue with empty array
      allProducts = [];
    }
    
    // Debug: Log all products and their isActive status (only log first 10 to avoid spam)
    allProducts.slice(0, 10).forEach((product: any) => {
      console.log(`[Products API] Product ${product.id}: isActive=${product.isActive}, priceCents=${product.priceCents}, hasSeller=${!!product.seller}, hasUser=${!!product.seller?.User}, stripeAccount=${product.seller?.User?.stripeConnectAccountId ? 'yes' : 'no'}`);
    });
    
    // Special debug for the specific product mentioned by user
    const specificProduct = allProducts.find((p: any) => p.id === '8111cfa9-fa4f-43da-877a-fa1eea6899e6');
    if (specificProduct) {
      console.log(`[Products API] 🔍 SPECIFIC PRODUCT FOUND: ${specificProduct.id}`);
      console.log(`[Products API]   - isActive: ${specificProduct.isActive}`);
      console.log(`[Products API]   - priceCents: ${specificProduct.priceCents}`);
      console.log(`[Products API]   - stock: ${specificProduct.stock}`);
      console.log(`[Products API]   - maxStock: ${specificProduct.maxStock}`);
      console.log(`[Products API]   - hasSeller: ${!!specificProduct.seller}`);
      console.log(`[Products API]   - hasUser: ${!!specificProduct.seller?.User}`);
      console.log(`[Products API]   - stripeConnectAccountId: ${specificProduct.seller?.User?.stripeConnectAccountId || 'none'}`);
    } else {
      console.log(`[Products API] ⚠️ SPECIFIC PRODUCT NOT FOUND IN QUERY: 8111cfa9-fa4f-43da-877a-fa1eea6899e6`);
      console.log(`[Products API]   This means isActive=false OR product doesn't exist`);
      
      // Try to find it without the isActive filter to see what the actual status is
      try {
        const productWithoutFilter = await prisma.product.findUnique({
          where: { id: '8111cfa9-fa4f-43da-877a-fa1eea6899e6' },
          select: {
            id: true,
            isActive: true,
            stock: true,
            maxStock: true,
            priceCents: true
          }
        });
        if (productWithoutFilter) {
          console.log(`[Products API] 🔍 PRODUCT EXISTS BUT FILTERED OUT:`);
          console.log(`[Products API]   - isActive: ${productWithoutFilter.isActive} (THIS IS THE PROBLEM!)`);
          console.log(`[Products API]   - stock: ${productWithoutFilter.stock}`);
          console.log(`[Products API]   - maxStock: ${productWithoutFilter.maxStock}`);
          console.log(`[Products API]   - priceCents: ${productWithoutFilter.priceCents}`);
        }
      } catch (err) {
        console.log(`[Products API]   Could not check product status: ${err}`);
      }
    }

    // Filter out products with price that were created with test Stripe Connect accounts
    // Inspiration content (without price) always visible
    // Products with live Stripe Connect accounts are always shown
    // Products without seller are also shown (shouldn't happen but handle gracefully)
    console.log(`[Products API] 📊 Total products from DB: ${allProducts.length}`);
    
    let products: any[] = [];
    try {
      console.log(`[Products API] 📊 Products breakdown by isActive:`);
      const activeCount = allProducts.filter(p => p.isActive).length;
      const inactiveCount = allProducts.filter(p => !p.isActive).length;
      console.log(`[Products API]   - Active: ${activeCount}`);
      console.log(`[Products API]   - Inactive: ${inactiveCount}`);
      
      products = allProducts.filter(product => {
      // CRITICAL: First check if product is active - inactive products should never be shown
      if (!product.isActive) {
        console.log(`[Products API] ❌ Filtering product ${product.id} - isActive=false (title: "${product.title}")`);
        return false;
      }
      
      console.log(`[Products API] ✅ Product ${product.id} is ACTIVE (title: "${product.title}")`);
      
      // If product has no price (inspiration), always show
      if (!product.priceCents || product.priceCents === 0) {
        console.log(`[Products API] ✅ Product ${product.id} - no price, showing (inspiration)`);
        return true;
      }
      
      // If product has no seller, show it (shouldn't happen but handle gracefully)
      if (!product.seller || !product.seller.User) {
        console.warn(`[Products API] Product ${product.id} has no seller, showing anyway`);
        return true;
      }
      
      // If product has price, check if seller has Stripe Connect account
      const seller = product.seller.User;
      if (!seller.stripeConnectAccountId) {
        // Show products without Stripe Connect account (e.g., created from recipes)
        console.log(`[Products API] Product ${product.id} - no Stripe Connect account, showing (created from recipe)`);
        return true;
      }
      
      // Only hide products with price if seller has test Stripe Connect account
      // Live accounts (acct_xxx, not acct_test_xxx) are always allowed
      const isTest = isStripeTestId(seller.stripeConnectAccountId);
      if (isTest) {
        console.log(`[Products API] Filtering product ${product.id} - test Stripe account: ${seller.stripeConnectAccountId}`);
      }
      return !isTest;
      });
    } catch (filterError) {
      console.error('[Products API] Error filtering products:', filterError);
      console.error('[Products API] Filter error details:', {
        message: filterError instanceof Error ? filterError.message : String(filterError),
        name: filterError instanceof Error ? filterError.name : 'Unknown',
        stack: filterError instanceof Error ? filterError.stack : 'No stack trace'
      });
      // Set products to empty array if filtering fails
      products = [];
    }

    // Get user's favorited products if userId provided
    let userFavorites: Set<string> = new Set();
    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
          productId: { in: products.map(p => p.id) }
        },
        select: {
          productId: true
        }
      });
      userFavorites = new Set(favorites.map(f => f.productId).filter(Boolean) as string[]);
    }

    // Get review counts, average ratings, view counts, and favorite counts for products
    const productIds = products.map(p => p.id);
    console.log('[Products API] Product IDs to fetch stats for:', productIds.length);
    
    // If no products, return empty arrays for stats
    let reviewCounts: any[] = [];
    let avgRatings: any[] = [];
    let viewCounts: any[] = [];
    let favoriteCounts: any[] = [];
    
    if (productIds.length > 0) {
      try {
        console.log('[Products API] Fetching stats for products...');
        // Wrap each query individually to catch errors better
        try {
          // @ts-expect-error - Prisma groupBy type inference issue
          reviewCounts = await prisma.productReview.groupBy({
            by: ['productId'],
            where: {
              productId: { in: productIds },
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 }
            },
            _count: {
              productId: true
            }
          });
        } catch (err) {
          console.error('[Products API] Error fetching review counts:', err);
          reviewCounts = [];
        }
        
        try {
          // @ts-expect-error - Prisma groupBy type inference issue
          avgRatings = await prisma.productReview.groupBy({
            by: ['productId'],
            where: {
              productId: { in: productIds },
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 }
            },
            _avg: {
              rating: true
            }
          });
        } catch (err) {
          console.error('[Products API] Error fetching avg ratings:', err);
          avgRatings = [];
        }
        
        try {
          // @ts-expect-error - Prisma groupBy type inference issue
          viewCounts = await prisma.analyticsEvent.groupBy({
            by: ['entityId'],
            where: {
              entityId: { in: productIds },
              eventType: { in: ['VIEW', 'PRODUCT_VIEW'] },
              entityType: 'PRODUCT'
            },
            _count: {
              entityId: true
            }
          });
        } catch (err) {
          console.error('[Products API] Error fetching view counts:', err);
          viewCounts = [];
        }
        
        try {
          // @ts-expect-error - Prisma groupBy type inference issue
          favoriteCounts = await prisma.favorite.groupBy({
            by: ['productId'],
            where: {
              productId: { in: productIds }
            },
            _count: {
              productId: true
            }
          });
        } catch (err) {
          console.error('[Products API] Error fetching favorite counts:', err);
          favoriteCounts = [];
        }
        
        console.log('[Products API] Stats fetched successfully');
      } catch (error) {
        console.error('[Products API] Error in stats fetch:', error);
        console.error('[Products API] Stats error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        // Continue with empty arrays
      }
    } else {
      console.log('[Products API] No products, skipping stats fetch');
    }

    const reviewCountMap = new Map<string, number>();
    (reviewCounts as Array<{ productId: string; _count: { productId: number } }>).forEach(item => {
      reviewCountMap.set(item.productId, item._count.productId);
    });

    const avgRatingMap = new Map<string, number>();
    (avgRatings as Array<{ productId: string; _avg: { rating: number | null } }>).forEach(item => {
      if (item._avg.rating) {
        avgRatingMap.set(item.productId, Math.round(item._avg.rating * 10) / 10);
      }
    });

    const viewCountMap = new Map<string, number>();
    (viewCounts as Array<{ entityId: string; _count: { entityId: number } }>).forEach(item => {
      viewCountMap.set(item.entityId, item._count.entityId);
    });

    const favoriteCountMap = new Map<string, number>();
    (favoriteCounts as Array<{ productId: string; _count: { productId: number } }>).forEach(item => {
      favoriteCountMap.set(item.productId, item._count.productId);
    });

    // COMPLETE RESPONSE - alle data terug
    const items = products.map((p: any) => {
      // Get all images, filter out null/undefined/empty
      const allImages = (p.Image || [])
        .map((img: any) => img?.fileUrl)
        .filter((url: string) => url && url.trim().length > 0);
      
      // Get video if available - Video is a one-to-one relation, not an array
      const video = p.Video || null;
      
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        image: allImages[0] || undefined,
        images: allImages,
        video: video ? {
          id: video.id,
          url: video.url,
          thumbnail: video.thumbnail,
          duration: video.duration
        } : null,
        createdAt: p.createdAt,
        category: p.category,
        subcategory: null,
        delivery: p.delivery,
        tags: (p as any).tags || [],
        location: {
          place: p.seller?.User?.place || 'Locatie onbekend',
          city: 'Nederland',
          // Use product pickup location if available, otherwise use seller location
          // Note: pickupLat/pickupLng columns don't exist in database yet
          lat: (p as any).pickupLat ?? p.seller?.lat ?? null,
          lng: (p as any).pickupLng ?? p.seller?.lng ?? null,
        },
        seller: {
          id: p.seller?.User?.id ?? null,
          name: p.seller?.User?.name ?? null,
          avatar: p.seller?.User?.profileImage ?? null,
          username: p.seller?.User?.username ?? null,
          buyerTypes: p.seller?.User?.buyerRoles ?? [],
          followerCount: 0, // Skip expensive count for now
          displayFullName: p.seller?.User?.displayFullName ?? undefined,
          displayNameOption: p.seller?.User?.displayNameOption ?? undefined,
          isBusiness: !!(p.seller?.kvk && p.seller?.companyName),
          companyName: p.seller?.companyName ?? null,
          kvk: p.seller?.kvk ?? null,
        },
        favoriteCount: favoriteCountMap.get(p.id) || 0,
        isFavorited: userId ? userFavorites.has(p.id) : undefined,
        reviewCount: reviewCountMap.get(p.id) || 0,
        averageRating: avgRatingMap.get(p.id) || 0,
        viewCount: viewCountMap.get(p.id) || 0,
      };
    });

    const hasNext = items.length === take;

    // Debug logging
    console.log(`[Products API] 📊 SUMMARY:`);
    console.log(`[Products API]   - Total from DB: ${allProducts.length}`);
    console.log(`[Products API]   - After isActive filter: ${products.length}`);
    console.log(`[Products API]   - Final items returned: ${items.length}`);
    
    // Create summary for client
    const summary = {
      totalFromDB: allProducts.length,
      activeCount: allProducts.filter(p => p.isActive).length,
      inactiveCount: allProducts.filter(p => !p.isActive).length,
      afterFilter: products.length,
      finalItems: items.length
    };
    console.log(`[Products API] 📊 Summary:`, summary);
    
    // Check if specific product is in final items list
    const specificProductInItems = items.find((item: any) => item.id === '8111cfa9-fa4f-43da-877a-fa1eea6899e6');
    if (specificProductInItems) {
      console.log(`[Products API] ✅ SPECIFIC PRODUCT IN FINAL ITEMS LIST: 8111cfa9-fa4f-43da-877a-fa1eea6899e6`);
    } else {
      const specificProductInFiltered = products.find((p: any) => p.id === '8111cfa9-fa4f-43da-877a-fa1eea6899e6');
      if (specificProductInFiltered) {
        console.log(`[Products API] ⚠️ SPECIFIC PRODUCT IN FILTERED LIST BUT NOT IN ITEMS (mapping issue?)`);
      } else {
        console.log(`[Products API] ❌ SPECIFIC PRODUCT NOT IN FILTERED LIST (was filtered out)`);
      }
    }

    // Include debug info in response for client-side debugging (only in development or when debug=true)
    const debugInfo: any = {};
    const url = new URL(req.url);
    const debugMode = url.searchParams.get('debug') === 'true';
    
    if (debugMode) {
      debugInfo.summary = summary;
      debugInfo.specificProductFound = !!specificProduct;
      debugInfo.specificProductInFiltered = !!products.find((p: any) => p.id === '8111cfa9-fa4f-43da-877a-fa1eea6899e6');
      debugInfo.specificProductInItems = !!items.find((item: any) => item.id === '8111cfa9-fa4f-43da-877a-fa1eea6899e6');
      if (specificProduct) {
        debugInfo.specificProductDetails = {
          id: specificProduct.id,
          isActive: specificProduct.isActive,
          priceCents: specificProduct.priceCents,
          stock: specificProduct.stock,
          maxStock: specificProduct.maxStock,
          hasSeller: !!specificProduct.seller,
          hasUser: !!specificProduct.seller?.User,
          stripeAccount: specificProduct.seller?.User?.stripeConnectAccountId ? 'yes' : 'no'
        };
      }
    }

    return NextResponse.json({ 
      items,
      hasNext,
      totalCount: null,
      ...(Object.keys(debugInfo).length > 0 && { debugInfo })
    });

  } catch (error) {
    console.error('[Products API] ========== REQUEST ERROR ==========');
    console.error('❌ Products API Error:', error);
    console.error('❌ Products API Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Products API Error Details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
    });
    
    // Return detailed error for debugging - ALWAYS include message
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    // Log full error for debugging
    try {
      console.error('[Products API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      console.error('[Products API] Could not stringify error:', e);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        message: errorMessage,
        name: errorName,
        stack: errorStack ? errorStack.substring(0, 1000) : 'No stack trace', // Limit stack trace length
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}