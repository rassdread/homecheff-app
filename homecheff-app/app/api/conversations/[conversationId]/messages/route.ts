import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { encryptText, decryptText, generateKeyFromPassword, generateSalt } from '@/lib/encryption';

const prisma = new PrismaClient();

// System encryption key (stored securely in env)
const SYSTEM_KEY = process.env.ENCRYPTION_SYSTEM_KEY || 'change-this-in-production-to-secure-key';

// Get or create encryption key for conversation
async function getConversationKey(conversationId: string): Promise<Buffer> {
  let keyRecord = await prisma.conversationKey.findUnique({
    where: { conversationId }
  });

  if (!keyRecord) {
    // Generate new key for this conversation
    const salt = generateSalt();
    const conversationSecret = generateSalt(); // Random secret for this conversation
    const key = generateKeyFromPassword(conversationSecret, salt);
    
    // Encrypt the conversation secret with system key for storage
    const systemKey = generateKeyFromPassword(SYSTEM_KEY, salt);
    const encryptedSecret = encryptText(conversationSecret, systemKey);
    
    // Store encrypted key
    keyRecord = await prisma.conversationKey.create({
      data: {
        conversationId,
        encryptionKey: JSON.stringify({ encryptedSecret, salt })
      }
    });
    
    return key;
  }

  // Decrypt stored key
  const { encryptedSecret, salt } = JSON.parse(keyRecord.encryptionKey);
  const systemKey = generateKeyFromPassword(SYSTEM_KEY, salt);
  const conversationSecret = decryptText(encryptedSecret, systemKey);
  const key = generateKeyFromPassword(conversationSecret, salt);
  
  return key;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { page = '1', limit = '50' } = Object.fromEntries(req.nextUrl.searchParams);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    // Decrypt messages automatically
    const conversationKey = await getConversationKey(conversationId);
    const decryptedMessages = messages.map(msg => {
      if (msg.isEncrypted && msg.encryptedText) {
        try {
          const encryptedData = JSON.parse(msg.encryptedText);
          const decryptedText = decryptText(encryptedData, conversationKey);
          return { ...msg, text: decryptedText, _wasEncrypted: true };
        } catch (error) {
          console.error('Decryption failed for message:', msg.id, error);
          return { ...msg, text: '[Ontsleuteling mislukt]', _decryptionError: true };
        }
      }
      return msg;
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readAt: null
      },
      data: { readAt: new Date() }
    });

    return NextResponse.json({ messages: decryptedMessages.reverse() });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { text, messageType = 'TEXT', attachmentUrl, attachmentName, attachmentType } = await req.json();

    if (!text && !attachmentUrl) {
      return NextResponse.json(
        { error: 'Message text or attachment is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has encryption enabled
    const senderUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { encryptionEnabled: true }
    });

    let encryptedData: { encrypted: string; iv: string; tag: string } | null = null;
    let isEncrypted = false;
    let textToStore: string | null = text;

    // Only encrypt if user has it enabled
    if (senderUser?.encryptionEnabled && text) {
      const conversationKey = await getConversationKey(conversationId);
      encryptedData = encryptText(text, conversationKey);
      isEncrypted = true;
      textToStore = null; // Don't store plaintext if encrypted
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        text: textToStore,
        encryptedText: encryptedData ? JSON.stringify(encryptedData) : null,
        isEncrypted: isEncrypted,
        messageType,
        attachmentUrl,
        attachmentName,
        attachmentType
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        }
      }
    });

    // Return decrypted message to sender
    const messageToReturn = {
      ...message,
      text: text, // Return original text to sender
      _autoEncrypted: true
    };

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return NextResponse.json({ message: messageToReturn });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}



