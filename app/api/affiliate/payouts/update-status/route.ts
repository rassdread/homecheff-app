/**
 * Update Commission Ledger Status
 * 
 * POST /api/affiliate/payouts/update-status
 * 
 * Moves PENDING commissions to AVAILABLE after pending period
 * Should be called daily by cron
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommissionLedgerStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check for cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Update PENDING commissions where availableAt <= now
    const result = await prisma.commissionLedger.updateMany({
      where: {
        status: CommissionLedgerStatus.PENDING,
        availableAt: {
          lte: now,
        },
      },
      data: {
        status: CommissionLedgerStatus.AVAILABLE,
      },
    });

    return NextResponse.json({
      message: "Commission statuses updated",
      updated: result.count,
    });
  } catch (error: any) {
    console.error("Error updating commission statuses:", error);
    return NextResponse.json(
      { error: "Failed to update commission statuses" },
      { status: 500 }
    );
  }
}








