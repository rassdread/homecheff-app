import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptText, generateKeyFromPassword, hashSensitiveData } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { messageId, encryptionKey, salt } = await req.json();

    if (!messageId || !encryptionKey || !salt) {
      return NextResponse.json({ error: 'Message ID, encryption key, and salt required' }, { status: 400 });
    }

    // Get the encrypted message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { 
        id: true, 
        encryptedText: true, 
        encryptionKey: true, 
        isEncrypted: true,
        senderId: true,
        conversationId: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (!message.isEncrypted || !message.encryptedText) {
      return NextResponse.json({ error: 'Message is not encrypted' }, { status: 400 });
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId: user.id
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Unauthorized to decrypt this message' }, { status: 403 });
    }

    // Verify encryption key
    const keyHash = hashSensitiveData(encryptionKey);
    if (keyHash !== message.encryptionKey) {
      return NextResponse.json({ error: 'Invalid encryption key' }, { status: 401 });
    }

    // Generate decryption key
    const key = generateKeyFromPassword(encryptionKey, salt);

    // Decrypt the message
    const encryptedData = JSON.parse(message.encryptedText);
    const decryptedText = decryptText(encryptedData, key);

    return NextResponse.json({ 
      success: true, 
      decryptedText: decryptedText
    });

  } catch (error) {
    console.error('Decryption error:', error);
    return NextResponse.json({ error: 'Failed to decrypt message' }, { status: 500 });
  }
}
