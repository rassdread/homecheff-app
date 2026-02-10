import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/unified
 * 
 * Unified analytics endpoint voor SPSS-achtige analyse
 * 
 * Query parameters:
 * - dataSource: orders|users|products|sellers|deliveries|financial|reviews (comma-separated)
 * - dimensions: comma-separated list of dimensions to group by
 * - metrics: comma-separated list of metrics to calculate
 * - filters: JSON string with filter configuration
 * - dateRange: startDate-endDate (YYYY-MM-DD format) or predefined (7d, 30d, etc.)
 * - limit: max results (default: 1000)
 * - offset: pagination offset (default: 0)
 * - orderBy: field to order by (default: createdAt)
 * - orderDirection: asc|desc (default: desc)
 * - export: csv|json (optional - triggers export)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    
    // Parse parameters
    const dataSources = (searchParams.get('dataSource') || 'orders').split(',').map(s => s.trim());
    const dimensionsParam = searchParams.get('dimensions') || '';
    const metricsParam = searchParams.get('metrics') || '';
    const filtersParam = searchParams.get('filters');
    const dateRangeParam = searchParams.get('dateRange') || '7d';
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 10000);
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const orderDirection = searchParams.get('orderDirection') || 'desc';
    const exportFormat = searchParams.get('export');

    // Parse date range
    const { startDate, endDate } = parseDateRange(dateRangeParam);

    // Parse dimensions and metrics
    const dimensions = dimensionsParam ? dimensionsParam.split(',').map(d => d.trim()).filter(Boolean) : [];
    const metrics = metricsParam ? metricsParam.split(',').map(m => m.trim()).filter(Boolean) : [];

    // Parse filters
    let filters: any = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (error) {
        console.error('Failed to parse filters:', error);
      }
    }

    // Fetch data from all requested sources
    const results: any = {};
    
    for (const source of dataSources) {
      switch (source.toLowerCase()) {
        case 'orders':
          results.orders = await fetchOrdersData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
        case 'users':
          results.users = await fetchUsersData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
        case 'products':
          results.products = await fetchProductsData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
        case 'sellers':
          results.sellers = await fetchSellersData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
        case 'deliveries':
          results.deliveries = await fetchDeliveriesData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
        case 'financial':
          results.financial = await fetchFinancialData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
        case 'reviews':
          results.reviews = await fetchReviewsData({ startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection });
          break;
      }
    }

    // If export is requested, format accordingly
    if (exportFormat === 'csv') {
      return exportToCSV(results, dateRangeParam);
    }

    if (exportFormat === 'json') {
      return NextResponse.json(results, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="unified-analytics-${startDate}-${endDate}.json"`,
        },
      });
    }

    return NextResponse.json({
      dateRange: { startDate, endDate },
      dataSources: dataSources,
      dimensions,
      metrics,
      ...results,
    });
  } catch (error: any) {
    console.error('Error fetching unified analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch unified analytics',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Parse date range
 */
function parseDateRange(range: string): { startDate: Date; endDate: Date } {
  let endDate = new Date();
  let startDate = new Date();

  // Check if it's a predefined range
  if (range.includes('-') && range.length === 10) {
    // Format: YYYY-MM-DD
    const parts = range.split('-');
    startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else if (range.includes('-') && range.length > 10) {
    // Format: YYYY-MM-DD-YYYY-MM-DD
    const [start, end] = range.split('-');
    const startParts = start.split('-');
    const endParts = end.split('-');
    startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  } else {
    // Predefined ranges
    switch (range) {
      case '24h':
      case '1d':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
      case '365d':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  return { startDate, endDate };
}

/**
 * Fetch orders data
 */
async function fetchOrdersData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {
    createdAt: { gte: startDate, lte: endDate },
    stripeSessionId: { not: null },
    NOT: { orderNumber: { startsWith: 'SUB-' } }
  };

  // Apply filters
  if (filters.status) where.status = filters.status;
  if (filters.userId) where.userId = filters.userId;
  if (filters.minAmount) {
    where.totalAmount = { gte: filters.minAmount };
  }
  if (filters.maxAmount) {
    if (where.totalAmount && typeof where.totalAmount === 'object') {
      where.totalAmount.lte = filters.maxAmount;
    } else {
      where.totalAmount = { lte: filters.maxAmount };
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          country: true,
          role: true,
        }
      },
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { [orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  // Transform to flat rows
  return orders.map(order => {
    const row: any = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt?.toISOString(),
      status: order.status,
      totalAmount: order.totalAmount,
      userId: order.userId,
      userName: order.User?.name,
      userEmail: order.User?.email,
      userCity: order.User?.city,
      userCountry: order.User?.country,
      userRole: order.User?.role,
      deliveryMode: order.deliveryMode,
      deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate?.toISOString(),
      pickupAddress: order.pickupAddress,
      pickupDate: order.pickupDate?.toISOString(),
      notes: order.notes,
      platformFeeCollected: order.platformFeeCollected,
      shippingCostCents: order.shippingCostCents,
      shippingLabelCostCents: order.shippingLabelCostCents,
      shippingTrackingNumber: order.shippingTrackingNumber,
      shippingCarrier: order.shippingCarrier,
      shippingMethod: order.shippingMethod,
      shippingStatus: order.shippingStatus,
      shippedAt: order.shippedAt?.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      paymentHeld: order.paymentHeld,
      payoutScheduled: order.payoutScheduled,
      payoutTrigger: order.payoutTrigger,
      itemCount: order.items.length,
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    };

    // Add product/seller dimensions
    if (order.items.length > 0) {
      const firstItem = order.items[0];
      row.productId = firstItem.productId;
      row.productTitle = firstItem.Product?.title;
      row.productCategory = firstItem.Product?.category;
      row.sellerId = firstItem.Product?.seller?.userId;
      row.sellerName = firstItem.Product?.seller?.User?.name;
    }

    return row;
  });
}

/**
 * Fetch users data
 */
async function fetchUsersData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {
    createdAt: { gte: startDate, lte: endDate }
  };

  if (filters.role) where.role = filters.role;
  if (filters.city) where.city = filters.city;
  if (filters.country) where.country = filters.country;

  const users = await prisma.user.findMany({
    where,
    include: {
      orders: {
        where: {
          stripeSessionId: { not: null }
        },
        select: {
          totalAmount: true,
          createdAt: true
        }
      },
      SellerProfile: {
        include: {
          products: {
            select: {
              id: true,
              priceCents: true
            }
          }
        }
      }
    },
    orderBy: { [orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  // Helper function to calculate age from dateOfBirth
  const calculateAge = (dateOfBirth: Date | null): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return users.map(user => {
    const age = calculateAge(user.dateOfBirth);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      role: user.role,
      city: user.city,
      country: user.country,
      postalCode: user.postalCode,
      address: user.address,
      place: user.place,
      lat: user.lat,
      lng: user.lng,
      dateOfBirth: user.dateOfBirth?.toISOString() || null,
      age: age,
      ageGroup: age !== null ? (age < 18 ? '0-17' : age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : age < 55 ? '45-54' : age < 65 ? '55-64' : '65+') : null,
      gender: user.gender,
      orderCount: user.orders.length,
      totalSpent: user.orders.reduce((sum, o) => sum + o.totalAmount, 0),
      productCount: user.SellerProfile?.products.length || 0,
      isSeller: !!user.SellerProfile,
    };
  });
}

/**
 * Fetch products data
 */
async function fetchProductsData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {
    createdAt: { gte: startDate, lte: endDate }
  };

  if (filters.category) where.category = filters.category;
  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const products = await prisma.product.findMany({
    where,
    include: {
      seller: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
      orderItems: {
        where: {
          Order: {
            stripeSessionId: { not: null }
          }
        },
        select: {
          priceCents: true,
          quantity: true
        }
      },
      reviews: {
        select: {
          rating: true
        }
      }
    },
    orderBy: { [orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  return products.map(product => ({
    id: product.id,
    title: product.title,
    category: product.category,
    subcategory: product.subcategory,
    description: product.description,
    priceCents: product.priceCents,
    unit: product.unit,
    delivery: product.delivery,
    createdAt: product.createdAt.toISOString(),
    isActive: product.isActive,
    stock: product.stock,
    maxStock: product.maxStock,
    availabilityDate: product.availabilityDate?.toISOString(),
    isFutureProduct: product.isFutureProduct,
    pickupAddress: product.pickupAddress,
    pickupLat: product.pickupLat,
    pickupLng: product.pickupLng,
    sellerCanDeliver: product.sellerCanDeliver,
    deliveryRadiusKm: product.deliveryRadiusKm,
    tags: product.tags?.join(',') || '',
    sellerId: product.sellerId,
    sellerName: product.seller?.User?.name,
    sellerEmail: product.seller?.User?.email,
    orderCount: product.orderItems.length,
    totalSold: product.orderItems.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0),
    totalQuantitySold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    averageRating: product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null,
    reviewCount: product.reviews.length,
  }));
}

/**
 * Fetch sellers data
 */
async function fetchSellersData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {};

  const sellers = await prisma.sellerProfile.findMany({
    where,
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          country: true,
          createdAt: true,
        }
      },
      products: {
        include: {
          orderItems: {
            where: {
              Order: {
                stripeSessionId: { not: null },
                createdAt: { gte: startDate, lte: endDate }
              }
            },
            select: {
              priceCents: true,
              quantity: true
            }
          }
        }
      }
    },
    orderBy: { [orderBy === 'createdAt' ? 'User' : orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  return sellers.map(seller => ({
    id: seller.id,
    userId: seller.userId,
    name: seller.User?.name,
    email: seller.User?.email,
    city: seller.User?.city,
    country: seller.User?.country,
    createdAt: seller.User?.createdAt.toISOString(),
    displayName: seller.displayName,
    bio: seller.bio,
    lat: seller.lat,
    lng: seller.lng,
    btw: seller.btw,
    companyName: seller.companyName,
    kvk: seller.kvk,
    deliveryMode: seller.deliveryMode,
    deliveryRadius: seller.deliveryRadius,
    deliveryRegions: seller.deliveryRegions?.join(',') || '',
    productCount: seller.products.length,
    totalRevenue: seller.products.reduce((sum, p) => 
      sum + p.orderItems.reduce((s, item) => s + (item.priceCents * item.quantity), 0), 0),
    totalOrders: seller.products.reduce((sum, p) => sum + p.orderItems.length, 0),
  }));
}

/**
 * Fetch deliveries data
 */
async function fetchDeliveriesData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {
    createdAt: { gte: startDate, lte: endDate }
  };

  if (filters.status) where.status = filters.status;
  if (filters.deliveryProfileId) where.deliveryProfileId = filters.deliveryProfileId;

  const deliveries = await prisma.deliveryOrder.findMany({
    where,
    include: {
      deliveryProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
      order: {
        select: {
          id: true,
          totalAmount: true,
          userId: true,
        }
      }
    },
    orderBy: { [orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  return deliveries.map(delivery => ({
    id: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    createdAt: delivery.createdAt.toISOString(),
    updatedAt: delivery.updatedAt?.toISOString(),
    deliveryProfileId: delivery.deliveryProfileId,
    delivererName: delivery.deliveryProfile?.user?.name,
    delivererEmail: delivery.deliveryProfile?.user?.email,
    deliveryFee: delivery.deliveryFee,
    estimatedTime: delivery.estimatedTime,
    pickedUpAt: delivery.pickedUpAt?.toISOString(),
    deliveredAt: delivery.deliveredAt?.toISOString(),
    currentLat: delivery.currentLat,
    currentLng: delivery.currentLng,
    notes: delivery.notes,
    deliveryAddress: delivery.deliveryAddress,
    deliveryDate: delivery.deliveryDate?.toISOString(),
    deliveryTime: delivery.deliveryTime,
    productId: delivery.productId,
    deliveryFeeCollected: delivery.deliveryFeeCollected,
    orderAmount: delivery.order?.totalAmount,
    buyerId: delivery.order?.userId,
  }));
}

/**
 * Fetch financial data (transactions, payouts, etc.)
 */
async function fetchFinancialData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {
    createdAt: { gte: startDate, lte: endDate }
  };

  if (filters.status) where.status = filters.status;
  if (filters.sellerId) where.sellerId = filters.sellerId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      Reservation: {
        select: {
          id: true,
          buyerId: true,
        }
      },
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: { [orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  return transactions.map(transaction => ({
    id: transaction.id,
    reservationId: transaction.reservationId,
    buyerId: transaction.Reservation?.buyerId,
    sellerId: transaction.sellerId,
    sellerName: transaction.User?.name,
    sellerEmail: transaction.User?.email,
    amountCents: transaction.amountCents,
    platformFeeBps: transaction.platformFeeBps,
    platformFee: Math.round((transaction.amountCents * transaction.platformFeeBps) / 10000),
    status: transaction.status,
    createdAt: transaction.createdAt.toISOString(),
  }));
}

/**
 * Fetch reviews data
 */
async function fetchReviewsData(params: any) {
  const { startDate, endDate, dimensions, metrics, filters, limit, offset, orderBy, orderDirection } = params;

  const where: any = {
    createdAt: { gte: startDate, lte: endDate }
  };

  if (filters.rating) where.rating = filters.rating;
  if (filters.productId) where.productId = filters.productId;

  const reviews = await prisma.productReview.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          title: true,
          category: true,
        }
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: { [orderBy]: orderDirection },
    take: limit,
    skip: offset,
  });

  return reviews.map(review => ({
    id: review.id,
    productId: review.productId,
    productTitle: review.product?.title,
    productCategory: review.product?.category,
    buyerId: review.buyerId,
    buyerName: review.buyer?.name,
    buyerEmail: review.buyer?.email,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isVerified: review.isVerified,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt?.toISOString(),
    orderId: review.orderId,
  }));
}

/**
 * Export data to CSV
 */
function exportToCSV(results: any, dateRange: string): NextResponse {
  // Combine all data sources into one CSV
  const allRows: any[] = [];
  const headers = new Set<string>();

  Object.entries(results).forEach(([source, data]: [string, any]) => {
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => {
        const rowWithSource = { dataSource: source, ...row };
        Object.keys(rowWithSource).forEach(key => headers.add(key));
        allRows.push(rowWithSource);
      });
    }
  });

  const headerArray = Array.from(headers);
  const csvRows = [headerArray.join(',')];

  allRows.forEach(row => {
    const values = headerArray.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  });

  const csv = csvRows.join('\n');
  const filename = `unified-analytics-${dateRange}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

