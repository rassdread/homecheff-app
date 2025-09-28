import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptText, generateKeyFromPassword, generateSalt, hashSensitiveData } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, encryptionEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { messageId, encryptionKey } = await req.json();

    if (!messageId || !encryptionKey) {
      return NextResponse.json({ error: 'Message ID and encryption key required' }, { status: 400 });
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, text: true, senderId: true, isEncrypted: true }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to encrypt this message' }, { status: 403 });
    }

    if (message.isEncrypted) {
      return NextResponse.json({ error: 'Message already encrypted' }, { status: 400 });
    }

    if (!message.text) {
      return NextResponse.json({ error: 'No text to encrypt' }, { status: 400 });
    }

    // Generate encryption key from user input
    const salt = generateSalt();
    const key = generateKeyFromPassword(encryptionKey, salt);
    const keyHash = hashSensitiveData(encryptionKey);

    // Encrypt the message
    const encryptedData = encryptText(message.text, key);

    // Update message with encrypted data
    await prisma.message.update({
      where: { id: messageId },
      data: {
        encryptedText: JSON.stringify(encryptedData),
        encryptionKey: keyHash,
        isEncrypted: true,
        text: null // Remove plain text
      }
    });

    // Store encryption key (hashed)
    await prisma.encryptionKey.create({
      data: {
        userId: user.id,
        keyHash: keyHash,
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Message encrypted successfully',
      salt: salt // Return salt for client-side decryption
    });

  } catch (error) {
    console.error('Encryption error:', error);
    return NextResponse.json({ error: 'Failed to encrypt message' }, { status: 500 });
  }
}
