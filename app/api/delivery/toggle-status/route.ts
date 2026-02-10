import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { isOnline } = body;

    // Get delivery profile to check availability
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        availableDays: true,
        availableTimeSlots: true,
        isOnline: true
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'Delivery profile not found' }, { status: 404 });
    }

    // Check if going online is within available times (for warning, not blocking)
    let isWithinAvailableTimes = true;
    let warningMessage: string | null = null;

    if (isOnline) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const currentHour = now.getHours();

      // Check if current day is in available days
      if (deliveryProfile.availableDays.length > 0 && !deliveryProfile.availableDays.includes(currentDay)) {
        isWithinAvailableTimes = false;
        const dayNames: Record<string, string> = {
          'MONDAY': 'maandag',
          'TUESDAY': 'dinsdag',
          'WEDNESDAY': 'woensdag',
          'THURSDAY': 'donderdag',
          'FRIDAY': 'vrijdag',
          'SATURDAY': 'zaterdag',
          'SUNDAY': 'zondag'
        };
        const currentDayName = dayNames[currentDay] || currentDay.toLowerCase();
        warningMessage = `Je gaat online buiten je opgegeven beschikbare dagen. Vandaag is ${currentDayName} en je hebt deze dag niet opgegeven als beschikbaar.`;
      }

      // Check if current time is in available time slots
      if (deliveryProfile.availableTimeSlots.length > 0) {
        const timeSlotAvailable = deliveryProfile.availableTimeSlots.some((slot: string) => {
          // Handle different time slot formats
          if (slot.includes('-')) {
            // Format: "09:00-12:00" or "9-12"
            const parts = slot.split('-');
            const startTime = parts[0].includes(':') 
              ? parseInt(parts[0].split(':')[0])
              : parseInt(parts[0]);
            const endTime = parts[1].includes(':')
              ? parseInt(parts[1].split(':')[0])
              : parseInt(parts[1]);
            
            // Check if current hour is within the time slot
            return currentHour >= startTime && currentHour < endTime;
          } else if (slot.includes(':')) {
            // Format: "09:00" - single time point, check if within 1 hour window
            const slotHour = parseInt(slot.split(':')[0]);
            return currentHour >= slotHour && currentHour < slotHour + 1;
          } else {
            // Format: "morning", "afternoon", "evening" - map to hours
            const timeSlotMap: Record<string, { start: number; end: number }> = {
              'morning': { start: 6, end: 12 },
              'afternoon': { start: 12, end: 18 },
              'evening': { start: 18, end: 23 }
            };
            const mapped = timeSlotMap[slot.toLowerCase()];
            if (mapped) {
              return currentHour >= mapped.start && currentHour < mapped.end;
            }
          }
          return false;
        });

        if (!timeSlotAvailable) {
          isWithinAvailableTimes = false;
          if (!warningMessage) {
            warningMessage = 'Je gaat online buiten je opgegeven beschikbare tijdsloten.';
          }
        }
      }
    }

    // Update delivery profile online status
    const updatedProfile = await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        isOnline: isOnline,
        lastOnlineAt: isOnline ? new Date() : undefined,
        lastOfflineAt: !isOnline ? new Date() : undefined
      }
    });
    
    return NextResponse.json({
      success: true,
      isOnline: updatedProfile.isOnline,
      message: isOnline 
        ? 'Je bent nu online en ontvangt bestellingen' 
        : 'Je bent nu offline en ontvangt geen bestellingen',
      warning: warningMessage || undefined,
      isWithinAvailableTimes
    });

  } catch (error) {
    console.error('Error toggling delivery status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle delivery status' },
      { status: 500 }
    );
  }
}

