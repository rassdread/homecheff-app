import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Simulate delivery availability check
    // In a real app, this would check against actual delivery zones
    const isAvailable = true; // For now, always available
    const estimatedTime = 30; // 30 minutes
    const deliveryFee = 2.50; // €2.50

    return NextResponse.json({
      isAvailable,
      estimatedTime,
      deliveryFee,
      message: isAvailable ? 'Bezorging beschikbaar' : 'Bezorging niet beschikbaar in dit gebied'
    });
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}