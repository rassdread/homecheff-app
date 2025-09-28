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
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join conversation room
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
      });

      // Leave conversation room
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`User ${socket.id} left conversation ${conversationId}`);
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
        try {
          // Save message to database
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();

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
                }
              }
            }
          });

          // Update conversation last message time
          await prisma.conversation.update({
            where: { id: data.conversationId },
            data: { lastMessageAt: new Date() }
          });

          // Broadcast message to all users in the conversation
          io.to(data.conversationId).emit('new-message', message);

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

          // Send notification to all participants in the conversation
          io.to(data.conversationId).emit('message-notification', {
            conversationId: data.conversationId,
            senderName: message.User.name || message.User.username,
            messageText: data.text,
            messageType: data.messageType
          });

          await prisma.$disconnect();
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('message-error', { error: 'Failed to send message' });
          try {
            await prisma.$disconnect();
          } catch (disconnectError) {
            console.error('Error disconnecting prisma:', disconnectError);
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

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  res.end();
};



