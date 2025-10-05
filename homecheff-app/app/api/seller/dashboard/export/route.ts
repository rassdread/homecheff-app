import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const period = searchParams.get('period') || '30d';

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, username: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, displayName: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;

    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get detailed data for export
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        items: {
          some: {
            Product: {
              sellerId: sellerProfile.id
            }
          }
        }
      },
      include: {
        User: {
          select: {
            name: true,
            username: true,
            email: true
          }
        },
        items: {
          include: {
            Product: {
              select: {
                title: true,
                priceCents: true,
                sellerId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get products data
    const products = await prisma.product.findMany({
      where: {
        sellerId: sellerProfile.id
      },
      include: {
        orderItems: {
          where: {
            Order: {
              createdAt: {
                gte: startDate,
                lte: now
              }
            }
          },
          include: {
            Order: true
          }
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      }
    });

    // Filter orders to only include items from this seller
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter((item: any) => item.Product?.sellerId === sellerProfile.id)
    })).filter(order => order.items.length > 0);

    if (format === 'csv') {
      return generateCSV(filteredOrders, products, sellerProfile, period);
    } else if (format === 'pdf') {
      return generatePDF(filteredOrders, products, sellerProfile, period);
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function generateCSV(orders: any[], products: any[], sellerProfile: any, period: string) {
  // Create CSV content
  let csvContent = 'Verkoper Rapport - ' + period + '\n\n';
  
  // Summary
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum: number, item: any) => {
      return itemSum + (item.priceCents * item.quantity);
    }, 0);
  }, 0);

  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(order => order.userId)).size;

  csvContent += 'SAMENVATTING\n';
  csvContent += `Verkoper,${sellerProfile.displayName || 'Onbekend'}\n`;
  csvContent += `Periode,${period}\n`;
  csvContent += `Totale Omzet,€${(totalRevenue / 100).toFixed(2)}\n`;
  csvContent += `Totaal Bestellingen,${totalOrders}\n`;
  csvContent += `Unieke Klanten,${uniqueCustomers}\n\n`;

  // Orders detail
  csvContent += 'BESTELLINGEN\n';
  csvContent += 'Datum,Klant,Product,Aantal,Prijs per stuk,Totaal\n';
  
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('nl-NL');
    const customerName = order.User?.name || order.User?.username || 'Onbekend';
    
    order.items.forEach((item: any) => {
      if (item.Product) {
        csvContent += `${orderDate},${customerName},${item.Product.title},${item.quantity},€${(item.priceCents / 100).toFixed(2)},€${((item.priceCents * item.quantity) / 100).toFixed(2)}\n`;
      }
    });
  });

  csvContent += '\nPRODUCTEN\n';
  csvContent += 'Product,Verkocht,Aantal,Omzet,Gemiddelde Beoordeling\n';
  
  products.forEach(product => {
    const sales = product.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const revenue = product.orderItems.reduce((sum: number, item: any) => {
      return sum + (item.priceCents * item.quantity);
    }, 0);
    
    const averageRating = product.reviews.length > 0
      ? (product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
      : '0.0';

    csvContent += `${product.title},${sales > 0 ? 'Ja' : 'Nee'},${sales},€${(revenue / 100).toFixed(2)},${averageRating}\n`;
  });

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="verkoper-rapport-${period}.csv"`
    }
  });
}

function generatePDF(orders: any[], products: any[], sellerProfile: any, period: string) {
  // For now, return a simple text response
  // In a real implementation, you would use a PDF library like puppeteer or jsPDF
  const pdfContent = `
VERKOPER RAPPORT
================

Verkoper: ${sellerProfile.displayName || 'Onbekend'}
Periode: ${period}
Datum: ${new Date().toLocaleDateString('nl-NL')}

SAMENVATTING
============
${generateSummary(orders)}

BESTELLINGEN
============
${generateOrdersDetail(orders)}

PRODUCTEN
=========
${generateProductsDetail(products)}
  `;

  return new NextResponse(pdfContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="verkoper-rapport-${period}.txt"`
    }
  });
}

function generateSummary(orders: any[]) {
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum: number, item: any) => {
      return itemSum + (item.priceCents * item.quantity);
    }, 0);
  }, 0);

  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(order => order.userId)).size;

  return `
Totale Omzet: €${(totalRevenue / 100).toFixed(2)}
Totaal Bestellingen: ${totalOrders}
Unieke Klanten: ${uniqueCustomers}
  `;
}

function generateOrdersDetail(orders: any[]) {
  return orders.map(order => {
    const orderDate = new Date(order.createdAt).toLocaleDateString('nl-NL');
    const customerName = order.User?.name || order.User?.username || 'Onbekend';
    
    return order.items.map((item: any) => {
      if (item.Product) {
        return `${orderDate} - ${customerName} - ${item.Product.title} - ${item.quantity}x €${(item.priceCents / 100).toFixed(2)}`;
      }
      return '';
    }).filter(Boolean).join('\n');
  }).join('\n');
}

function generateProductsDetail(products: any[]) {
  return products.map(product => {
    const sales = product.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const revenue = product.orderItems.reduce((sum: number, item: any) => {
      return sum + (item.priceCents * item.quantity);
    }, 0);
    
    const averageRating = product.reviews.length > 0
      ? (product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
      : '0.0';

    return `${product.title} - Verkocht: ${sales} - Omzet: €${(revenue / 100).toFixed(2)} - Beoordeling: ${averageRating}`;
  }).join('\n');
}
