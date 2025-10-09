import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
// import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const SocketHandler = (req: any, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('[Socket] Server already running');
  } else {
    console.log('[Socket] Initializing Socket.IO server...');
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: [
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'https://homecheff-app.vercel.app',
          'https://homecheff-app-git-main-rassdread.vercel.app',
          'https://homecheff-app-*.vercel.app' // Allow all Vercel preview deployments
        ],
        methods: ['GET', 'POST'],
        credentials: true // Enable credentials for Vercel PRO
      },
      transports: ['websocket', 'polling'], // Websockets first for Vercel PRO
      pingTimeout: 60000, // Longer timeout for Vercel PRO
      pingInterval: 25000, // Standard ping interval
      upgradeTimeout: 10000, // Longer upgrade timeout for Vercel PRO
      allowEIO3: true,
      allowUpgrades: true,
      perMessageDeflate: true, // Enable compression for Vercel PRO
      maxHttpBufferSize: 1e6, // 1MB buffer for larger messages
      connectTimeout: 45000 // 45 second connection timeout
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('[Socket] ✅ New client connected:', socket.id);
      console.log('[Socket] Total connected clients:', io.engine.clientsCount);

      // Join conversation room
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`[Socket] User ${socket.id} joined conversation ${conversationId}`);
        console.log(`[Socket] Room ${conversationId} now has ${io.sockets.adapter.rooms.get(conversationId)?.size || 0} members`);
      });

      // Leave conversation room
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`[Socket] User ${socket.id} left conversation ${conversationId}`);
      });

      // Handle new message
      socket.on('send-message', async (data: {
        conversationId: string;
        senderId: string;
        text: string;
        messageType: 'TEXT' | 'IMAGE' | 'FILE';
        attachmentUrl?: string;
        attachmentName?: string;
        attachmentType?: string;
      }) => {
        let prisma: any;
        try {
          // Save message to database
          const { PrismaClient } = await import('@prisma/client');
          prisma = new PrismaClient();

          console.log('[Socket] Creating message for conversation:', data.conversationId);

          const message = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderId: data.senderId,
              text: data.text,
              messageType: data.messageType,
              attachmentUrl: data.attachmentUrl,
              attachmentName: data.attachmentName,
              attachmentType: data.attachmentType,
            },
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true,
                  displayFullName: true,
                  displayNameOption: true,
                }
              }
            }
          });

          console.log('[Socket] Message created:', message.id);

          // Update conversation last message time
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: { lastMessageAt: new Date() }
          });

                  console.log('[Socket] Broadcasting message to room:', data.conversationId);
                  
                  // Get room members count for debugging
                  const room = io.sockets.adapter.rooms.get(data.conversationId);
                  const roomSize = room ? room.size : 0;
                  console.log(`[Socket] Room ${data.conversationId} has ${roomSize} members`);

                  // Broadcast message to all users in the conversation (including sender)
                  const broadcastResult = io.to(data.conversationId).emit('new-message', message);
                  console.log(`[Socket] Broadcasted to room ${data.conversationId}, result:`, broadcastResult);

                  // Also send to the sender's socket directly to ensure they see it immediately
                  socket.emit('new-message', message);
                  console.log(`[Socket] Sent directly to sender ${socket.id}`);

                  // Send acknowledgment to sender
                  socket.emit('message-sent', { 
                    messageId: message.id, 
                    conversationId: data.conversationId,
                    timestamp: new Date().toISOString()
                  });
                  console.log(`[Socket] Sent acknowledgment to sender`);

          console.log('[Socket] ✅ Message broadcasted successfully');

          // Send notification to other participants
          const participants = await prisma.conversationParticipant.findMany({
            where: {
              conversationId: data.conversationId,
              userId: { not: data.senderId }
            },
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                }
              }
            }
          });

          console.log('[Socket] Sending notifications to', participants.length, 'participants');

          // Send notification to all participants in the conversation
          io.to(data.conversationId).emit('message-notification', {
            conversationId: data.conversationId,
            senderName: message.User.name || message.User.username,
            messageText: data.text,
            messageType: data.messageType
          });

          await prisma.$disconnect();
        } catch (error) {
          console.error('[Socket] Error sending message:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          socket.emit('message-error', { error: 'Failed to send message', details: errorMessage });
          if (prisma) {
            try {
              await prisma.$disconnect();
            } catch (disconnectError) {
              console.error('[Socket] Error disconnecting prisma:', disconnectError);
            }
          }
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { conversationId: string; userId: string }) => {
        socket.to(data.conversationId).emit('user-typing', {
          userId: data.userId,
          isTyping: true
        });
      });

      socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
        socket.to(data.conversationId).emit('user-typing', {
          userId: data.userId,
          isTyping: false
        });
      });

      // Handle message read status
      socket.on('mark-message-read', async (data: { messageId: string; userId: string }) => {
        try {
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();

          await prisma.message.update({
            where: { id: data.messageId },
            data: { readAt: new Date() }
          });

          await prisma.$disconnect();
        } catch (error) {
          console.error('Error marking message as read:', error);
          try {
            await prisma.$disconnect();
          } catch (disconnectError) {
            console.error('Error disconnecting prisma:', disconnectError);
          }
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket] ❌ Client disconnected: ${socket.id}, reason: ${reason}`);
        console.log('[Socket] Remaining connected clients:', io.engine.clientsCount);
      });
    });
  }
  res.end();
};



