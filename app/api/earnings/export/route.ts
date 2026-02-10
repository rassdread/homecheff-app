/**
 * Earnings Export API
 * 
 * GET /api/earnings/export?format=csv|pdf
 * Exports combined earnings overview for all user roles
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommissionLedgerStatus } from "@prisma/client";
import { matchesCurrentMode } from "@/lib/stripe";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';

    if (format !== 'csv' && format !== 'pdf') {
      return NextResponse.json({ error: "Invalid format. Use 'csv' or 'pdf'" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        SellerProfile: {
          include: {
            Subscription: true
          }
        },
        DeliveryProfile: true,
        affiliate: {
          include: {
            commissionLedgers: true,
            attributions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Collect all earnings data
    const exportData: {
      period: string;
      roles: string[];
      seller?: any;
      delivery?: any;
      affiliate?: any;
      totals: any;
    } = {
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      roles: [],
      totals: {
        totalEarnings: 0,
        totalAvailable: 0,
        totalPaid: 0
      }
    };

    // Seller data
    if (user.SellerProfile) {
      exportData.roles.push('Verkoper');
      const sellerProfile = user.SellerProfile;
      
      const allOrders = await prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          },
          items: {
            some: {
              Product: {
                sellerId: sellerProfile.id
              }
            }
          }
        },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          stripeSessionId: true,
          items: {
            where: {
              Product: {
                sellerId: sellerProfile.id
              }
            },
            select: {
              priceCents: true,
              quantity: true,
              Product: {
                select: {
                  title: true
                }
              }
            }
          }
        },
        take: 1000
      });

      const orders = allOrders.filter(order => 
        order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)
      );

      const totalEarnings = orders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => {
          return itemSum + (item.priceCents * item.quantity);
        }, 0);
      }, 0);

      let platformFeePercentage = 12;
      if (sellerProfile.Subscription) {
        platformFeePercentage = sellerProfile.Subscription.feeBps / 100;
      }
      const platformFee = Math.round((totalEarnings * platformFeePercentage) / 100);
      const netEarnings = totalEarnings - platformFee;

      const payouts = await prisma.payout.findMany({
        where: {
          toUserId: user.id,
          transactionId: {
            not: {
              contains: 'delivery'
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const paidPayout = payouts.reduce((sum, p) => sum + p.amountCents, 0);
      const availablePayout = Math.max(0, netEarnings - paidPayout);

      exportData.seller = {
        totalEarnings,
        platformFee,
        netEarnings,
        availablePayout,
        paidPayout,
        totalOrders: orders.length,
        orders: orders.map(order => ({
          orderNumber: order.orderNumber,
          date: order.createdAt,
          status: order.status,
          amount: order.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0),
          items: order.items.map(item => ({
            product: item.Product?.title || 'Onbekend',
            quantity: item.quantity,
            price: item.priceCents
          }))
        }))
      };

      exportData.totals.totalEarnings += totalEarnings;
      exportData.totals.totalAvailable += availablePayout;
      exportData.totals.totalPaid += paidPayout;
    }

    // Delivery data
    if (user.DeliveryProfile) {
      exportData.roles.push('Bezorger');
      const deliveryProfile = user.DeliveryProfile;
      
      const payouts = await prisma.payout.findMany({
        where: {
          toUserId: user.id,
          OR: [
            { transactionId: { contains: 'delivery' } },
            { transactionId: { contains: 'txn_delivery' } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalEarnings = payouts.reduce((sum, p) => sum + p.amountCents, 0);

      const deliveryOrders = await prisma.deliveryOrder.findMany({
        where: {
          deliveryProfileId: deliveryProfile.id
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      exportData.delivery = {
        totalEarnings,
        totalDeliveries: deliveryOrders.length,
        completedDeliveries: deliveryOrders.filter(o => o.status === 'DELIVERED').length,
        deliveries: deliveryOrders.map(deliveryOrder => ({
          orderNumber: deliveryOrder.order.orderNumber,
          date: deliveryOrder.createdAt,
          status: deliveryOrder.status,
          deliveryFee: deliveryOrder.deliveryFee || 0
        }))
      };

      exportData.totals.totalEarnings += totalEarnings;
      exportData.totals.totalAvailable += totalEarnings;
      exportData.totals.totalPaid += totalEarnings;
    }

    // Affiliate data
    if (user.affiliate) {
      exportData.roles.push('Affiliate');
      const affiliate = user.affiliate;
      const allCommissions = affiliate.commissionLedgers;
      
      const pendingCents = allCommissions
        .filter((c) => c.status === CommissionLedgerStatus.PENDING)
        .reduce((sum, c) => sum + c.amountCents, 0);
      
      const availableCents = allCommissions
        .filter((c) => c.status === CommissionLedgerStatus.AVAILABLE)
        .reduce((sum, c) => sum + c.amountCents, 0);
      
      const paidCents = allCommissions
        .filter((c) => c.status === CommissionLedgerStatus.PAID)
        .reduce((sum, c) => sum + c.amountCents, 0);

      const totalEarnings = pendingCents + availableCents + paidCents;

      exportData.affiliate = {
        totalEarnings,
        pendingCents,
        availableCents,
        paidCents,
        totalReferrals: affiliate.attributions.length,
        commissions: allCommissions.map(c => ({
          date: c.createdAt,
          amount: c.amountCents,
          status: c.status,
          eventType: c.eventType,
          description: `Commissie van ${c.eventType}`
        }))
      };

      exportData.totals.totalEarnings += totalEarnings;
      exportData.totals.totalAvailable += availableCents;
      exportData.totals.totalPaid += paidCents;
    }

    // Generate export based on format
    if (format === 'csv') {
      return generateCSV(exportData, user);
    } else {
      return generatePDF(exportData, user);
    }
  } catch (error) {
    console.error("Error exporting earnings:", error);
    return NextResponse.json(
      { error: "Failed to export earnings" },
      { status: 500 }
    );
  }
}

function generateCSV(data: any, user: any): NextResponse {
  const lines: string[] = [];
  
  // Header
  lines.push('HomeCheff Verdiensten Overzicht');
  lines.push(`Gebruiker: ${user.name} (${user.email})`);
  lines.push(`Periode: ${data.period}`);
  lines.push(`Datum Export: ${new Date().toLocaleDateString('nl-NL')}`);
  lines.push('');
  lines.push('=== TOTAAL OVERZICHT ===');
  lines.push(`Totaal Verdiend,${(data.totals.totalEarnings / 100).toFixed(2)}`);
  lines.push(`Beschikbaar,${(data.totals.totalAvailable / 100).toFixed(2)}`);
  lines.push(`Uitbetaald,${(data.totals.totalPaid / 100).toFixed(2)}`);
  lines.push('');
  
  // Seller section
  if (data.seller) {
    lines.push('=== VERKOPER ===');
    lines.push(`Bruto Omzet,${(data.seller.totalEarnings / 100).toFixed(2)}`);
    lines.push(`Platform Fee,${(data.seller.platformFee / 100).toFixed(2)}`);
    lines.push(`Netto Verdiend,${(data.seller.netEarnings / 100).toFixed(2)}`);
    lines.push(`Beschikbaar,${(data.seller.availablePayout / 100).toFixed(2)}`);
    lines.push(`Uitbetaald,${(data.seller.paidPayout / 100).toFixed(2)}`);
    lines.push(`Totaal Bestellingen,${data.seller.totalOrders}`);
    lines.push('');
    lines.push('Bestellingen:');
    lines.push('Ordernummer,Datum,Status,Bedrag');
    data.seller.orders.forEach((order: any) => {
      lines.push(`${order.orderNumber || order.id},${new Date(order.date).toLocaleDateString('nl-NL')},${order.status},${(order.amount / 100).toFixed(2)}`);
    });
    lines.push('');
  }
  
  // Delivery section
  if (data.delivery) {
    lines.push('=== BEZORGER ===');
    lines.push(`Totaal Verdiend,${(data.delivery.totalEarnings / 100).toFixed(2)}`);
    lines.push(`Totaal Bezorgingen,${data.delivery.totalDeliveries}`);
    lines.push(`Voltooid,${data.delivery.completedDeliveries}`);
    lines.push('');
    lines.push('Bezorgingen:');
    lines.push('Ordernummer,Datum,Status,Bezorg Fee');
    data.delivery.deliveries.forEach((delivery: any) => {
      lines.push(`${delivery.orderNumber || delivery.id},${new Date(delivery.date).toLocaleDateString('nl-NL')},${delivery.status},${(delivery.deliveryFee / 100).toFixed(2)}`);
    });
    lines.push('');
  }
  
  // Affiliate section
  if (data.affiliate) {
    lines.push('=== AFFILIATE ===');
    lines.push(`Totaal Verdiend,${(data.affiliate.totalEarnings / 100).toFixed(2)}`);
    lines.push(`In Afwachting,${(data.affiliate.pendingCents / 100).toFixed(2)}`);
    lines.push(`Beschikbaar,${(data.affiliate.availableCents / 100).toFixed(2)}`);
    lines.push(`Uitbetaald,${(data.affiliate.paidCents / 100).toFixed(2)}`);
    lines.push(`Totaal Referrals,${data.affiliate.totalReferrals}`);
    lines.push('');
    lines.push('Commissies:');
    lines.push('Datum,Bedrag,Status,Type');
    data.affiliate.commissions.forEach((commission: any) => {
      lines.push(`${new Date(commission.date).toLocaleDateString('nl-NL')},${(commission.amount / 100).toFixed(2)},${commission.status},${commission.eventType}`);
    });
    lines.push('');
  }
  
  const csvContent = lines.join('\n');
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="verdiensten-${data.period}.csv"`,
    },
  });
}

function generatePDF(data: any, user: any): NextResponse {
  // For now, return CSV as PDF is more complex
  // In production, you'd use a library like pdfkit or puppeteer
  const csvContent = generateCSV(data, user);
  
  return new NextResponse(csvContent.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="verdiensten-${data.period}.pdf"`,
    },
  });
}

