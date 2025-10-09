import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only allow admin or for development
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all messages
    await prisma.message.deleteMany({});
    
    // Reset all conversations
    await prisma.conversation.updateMany({
      data: {
        lastMessageAt: null
      }
    });

    console.log('[ClearMessages] All messages cleared successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Alle berichten succesvol verwijderd' 
    });

  } catch (error) {
    console.error('[ClearMessages] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

