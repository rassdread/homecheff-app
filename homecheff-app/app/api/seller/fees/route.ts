import { NextRequest, NextResponse } from 'next/server';
import { calculateSellerFees } from '@/lib/cart';

export async function POST(req: NextRequest) {
  try {
    const { totalAmount } = await req.json();

    if (!totalAmount || typeof totalAmount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    const fees = calculateSellerFees(totalAmount);

    return NextResponse.json({
      stripeFee: fees.stripeFee,
      homecheffFee: fees.homecheffFee,
      netAmount: fees.netAmount,
      breakdown: {
        totalAmount: totalAmount,
        stripeFee: fees.stripeFee,
        homecheffFee: fees.homecheffFee,
        netAmount: fees.netAmount,
        stripeFeePercentage: ((fees.stripeFee / totalAmount) * 100).toFixed(2),
        homecheffFeePercentage: ((fees.homecheffFee / totalAmount) * 100).toFixed(2),
      }
    });

  } catch (error) {
    console.error('Error calculating seller fees:', error);
    return NextResponse.json(
      { error: 'Failed to calculate seller fees' },
      { status: 500 }
    );
  }
}


