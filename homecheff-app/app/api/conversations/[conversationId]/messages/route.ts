import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptText, decryptText, generateKeyFromPassword, generateSalt } from '@/lib/encryption';
import { pusherServer } from '@/lib/pusher';
import { NotificationService } from '@/lib/notifications/notification-service';

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

    // Fetch messages with pagination - OPTIMIZED QUERY
    // Note: We don't filter on deletedAt anymore - conversation visibility is handled via isHidden on participant level
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        // Skip encrypted messages for faster loading (can be loaded separately if needed)
        isEncrypted: false
      },
      select: {
        id: true,
        text: true,
        messageType: true,
        createdAt: true,
        readAt: true,
        deliveredAt: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentType: true,
        senderId: true,
        isEncrypted: true,
        encryptedText: true,
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
      take: Math.min(parseInt(limit), 50), // Cap at 50 for performance
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

    // Mark messages as read and delivered
    const now = new Date();
    
    // Mark as delivered first
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        deliveredAt: null
      },
      data: { deliveredAt: now }
    });
    
    // Then mark as read
    const markedAsRead = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readAt: null
      },
      data: { readAt: now }
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
    console.log('[Messages API POST] 📤 Request started');
    
    const session = await auth();
    console.log('[Messages API POST] Session:', { 
      hasSession: !!session, 
      email: session?.user?.email 
    });
    
    if (!session?.user?.email) {
      console.log('[Messages API POST] ❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const body = await req.json();
    const { text, messageType = 'TEXT', attachmentUrl, attachmentName, attachmentType } = body;
    
    console.log('[Messages API POST] Body:', { 
      conversationId, 
      hasText: !!text,
      textLength: text?.length,
      messageType 
    });

    if (!text && !attachmentUrl) {
      console.log('[Messages API POST] ❌ No text or attachment');
      return NextResponse.json(
        { error: 'Message text or attachment is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true
      }
    });
    
    console.log('[Messages API POST] User lookup:', { 
      email: session.user.email,
      userId: user?.id,
      found: !!user 
    });

    if (!user) {
      console.log('[Messages API POST] ❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 🔒 WATERMARK VALIDATION: Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });
    
    console.log('[Messages API POST] 🔒 Participant validation:', { 
      conversationId,
      userId: user.id,
      isParticipant: !!participant 
    });

    if (!participant) {
      console.log('[Messages API POST] ❌ SECURITY: Access denied - user is NOT a participant in this conversation');
      console.log('[Messages API POST] 🔒 WATERMARK: Prevented unauthorized message creation');
      return NextResponse.json({ 
        error: 'Access denied - You are not a participant in this conversation',
        code: 'NOT_PARTICIPANT'
      }, { status: 403 });
    }

    // 🔒 ADDITIONAL VALIDATION: Verify conversation exists and is active
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, isActive: true }
    });

    if (!conversation) {
      console.log('[Messages API POST] ❌ SECURITY: Conversation does not exist');
      return NextResponse.json({ 
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      }, { status: 404 });
    }

    console.log('[Messages API POST] ✅ WATERMARK VALIDATED: User is legitimate participant, proceeding...');
    
    // 🔖 LOG WATERMARK INFO: Email and Username for audit trail
    console.log('[Messages API POST] 🔖 WATERMARK INFO:', {
      userId: user.id,
      email: user.email,
      username: user.username,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    });

    // Check if user has encryption enabled
    const senderUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { encryptionEnabled: true }
    });
    
    console.log('[Messages API POST] Encryption check:', { 
      userId: user.id,
      encryptionEnabled: senderUser?.encryptionEnabled 
    });

    let encryptedData: { encrypted: string; iv: string; tag: string } | null = null;
    let isEncrypted = false;
    let textToStore: string | null = text;

    // Only encrypt if user has it enabled
    if (senderUser?.encryptionEnabled && text) {
      console.log('[Messages API POST] 🔐 Encrypting message...');
      try {
        const conversationKey = await getConversationKey(conversationId);
        encryptedData = encryptText(text, conversationKey);
        isEncrypted = true;
        textToStore = null; // Don't store plaintext if encrypted
        console.log('[Messages API POST] ✅ Message encrypted');
      } catch (encError) {
        console.error('[Messages API POST] ❌ Encryption failed:', encError);
        // Continue without encryption on error
        console.log('[Messages API POST] ⚠️ Continuing without encryption');
      }
    }
    
    console.log('[Messages API POST] 📝 Creating message in database...');

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
    
    console.log('[Messages API POST] ✅ Message created:', {
      messageId: message.id,
      senderId: message.senderId,
      hasUser: !!message.User,
      userName: message.User?.name,
      userUsername: message.User?.username,
      hasDisplayOption: !!message.User?.displayNameOption
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
    
    console.log('[Messages API POST] 📦 Message payload prepared');

    // Update conversation last message time and reactivate if inactive
    console.log('[Messages API POST] 🕐 Updating conversation timestamp...');
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        lastMessageAt: new Date(),
        isActive: true // Reactivate conversation when new message is sent
      }
    });
    
    // Unhide conversation for ALL participants when a new message is sent
    console.log('[Messages API POST] 👁️ Unhiding conversation for all participants...');
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversationId
      },
      data: {
        isHidden: false
      }
    });
    console.log('[Messages API POST] ✅ Conversation updated, reactivated and unhidden for all participants');

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
      console.log('[Pusher] ⚠️ Continuing despite Pusher error (non-critical)');
      // Don't fail the request if Pusher fails
    }

    // Send notification to other participants
    try {
      console.log('[Notifications] 🔔 Sending chat notifications...');
      
      // Get all participants except sender
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: user.id }
        },
        select: { userId: true }
      });

      // Send notification to each participant
      for (const participant of otherParticipants) {
        try {
          await NotificationService.sendChatNotification(
            participant.userId,
            user.id,
            text?.substring(0, 100) || 'Nieuw bericht',
            conversationId
          );
        } catch (notifError) {
          console.error(`[Notifications] ❌ Failed to send notification to user ${participant.userId}:`, notifError);
          // Continue with other participants
        }
      }
      
      console.log(`[Notifications] ✅ Sent notifications to ${otherParticipants.length} participants`);
    } catch (notifError) {
      console.error('[Notifications] ❌ Error sending notifications:', notifError);
      // Don't fail the request if notifications fail
    }
    
    console.log('[Messages API POST] 🎉 Success! Returning message to client');

    return NextResponse.json({ message: messageToReturn });

  } catch (error) {
    console.error('[Messages API POST] ❌ Critical error:', error);
    console.error('[Messages API POST] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check server logs for details'
      },
      { status: 500 }
    );
  }
}



