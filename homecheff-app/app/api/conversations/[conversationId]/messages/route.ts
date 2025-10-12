import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptText, decryptText, generateKeyFromPassword, generateSalt } from '@/lib/encryption';
import { pusherServer } from '@/lib/pusher';

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
    console.log('[Messages API] 📡 GET Request started');
    
    const session = await auth();
    console.log('[Messages API] Session check:', { 
      hasSession: !!session, 
      email: session?.user?.email 
    });
    
    if (!session?.user?.email) {
      console.log('[Messages API] ❌ Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { page = '1', limit = '50' } = Object.fromEntries(req.nextUrl.searchParams);
    
    console.log('[Messages API] Parameters:', { conversationId, page, limit });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    console.log('[Messages API] User lookup:', { 
      email: session.user.email,
      userId: user?.id,
      found: !!user 
    });

    if (!user) {
      console.log('[Messages API] ❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    console.log('[Messages API] Participant check:', { 
      conversationId,
      userId: user.id,
      isParticipant: !!participant 
    });

    if (!participant) {
      console.log('[Messages API] ❌ Access denied - not a participant');
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
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });
    
    console.log('[Messages API] 📨 Fetched messages:', {
      count: messages.length,
      encrypted: messages.filter(m => m.isEncrypted).length,
      plaintext: messages.filter(m => !m.isEncrypted).length,
      messageIds: messages.map(m => m.id)
    });

    // Decrypt messages automatically
    let decryptedMessages = messages;
    
    // Only try to decrypt if there are encrypted messages
    if (messages.some(m => m.isEncrypted)) {
      try {
        const conversationKey = await getConversationKey(conversationId);
        console.log('[Messages API] 🔐 Decryption key obtained');
        
        decryptedMessages = messages.map(msg => {
          if (msg.isEncrypted && msg.encryptedText) {
            try {
              const encryptedData = JSON.parse(msg.encryptedText);
              const decryptedText = decryptText(encryptedData, conversationKey);
              console.log('[Messages API] ✅ Decrypted message:', msg.id);
              return { ...msg, text: decryptedText, _wasEncrypted: true };
            } catch (error) {
              console.error('[Messages API] ❌ Decryption failed for message:', msg.id, error);
              return { ...msg, text: '[Ontsleuteling mislukt]', _decryptionError: true };
            }
          }
          return msg;
        });
      } catch (keyError) {
        console.error('[Messages API] ❌ Error getting encryption key:', keyError);
        // Continue without decryption - return plaintext messages
      }
    }

    // Mark messages as read
    const markedAsRead = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readAt: null
      },
      data: { readAt: new Date() }
    });
    
    console.log('[Messages API] 📖 Marked as read:', markedAsRead.count);

    const finalMessages = decryptedMessages.reverse();
    console.log('[Messages API] ✅ Returning messages:', {
      count: finalMessages.length,
      firstMessage: finalMessages[0]?.text?.substring(0, 50),
      lastMessage: finalMessages[finalMessages.length - 1]?.text?.substring(0, 50),
      userDataSample: finalMessages[0]?.User ? {
        hasName: !!finalMessages[0].User.name,
        hasUsername: !!finalMessages[0].User.username,
        hasDisplayOption: !!finalMessages[0].User.displayNameOption,
        displayNameOption: finalMessages[0].User.displayNameOption
      } : 'No user data'
    });

    return NextResponse.json({ messages: finalMessages });

  } catch (error) {
    console.error('[Messages API] ❌ Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
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

    // Create message with full user display info
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
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          }
        }
      }
    });

    // Return decrypted message to sender
    const messageToReturn = {
      id: message.id,
      text: text, // Return original text to sender
      createdAt: message.createdAt,
      readAt: message.readAt,
      senderId: message.senderId,
      conversationId: message.conversationId,
      User: message.User,
      _autoEncrypted: true
    };

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Trigger Pusher event for real-time delivery
    try {
      console.log('[Pusher] 📤 Sending message payload:', {
        conversationId,
        messageId: messageToReturn.id,
        hasText: !!messageToReturn.text,
        hasUser: !!messageToReturn.User,
        userName: messageToReturn.User?.name,
        userUsername: messageToReturn.User?.username,
        displayNameOption: messageToReturn.User?.displayNameOption,
        displayFullName: messageToReturn.User?.displayFullName,
        payloadKeys: Object.keys(messageToReturn)
      });
      
      await pusherServer.trigger(
        `conversation-${conversationId}`,
        'new-message',
        messageToReturn
      );
      console.log(`[Pusher] ✅ Message sent to conversation-${conversationId}`);
    } catch (pusherError) {
      console.error('[Pusher] ❌ Error sending message:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({ message: messageToReturn });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



