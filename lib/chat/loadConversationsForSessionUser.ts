import { prisma } from "@/lib/prisma";
import { sortConversationsByActivity } from "@/lib/chat/conversationListSort";
import { reportMessagingDiagnostic } from "@/lib/chat/messagingDiagnostics";

export type LoadedConversation = {
  id: string;
  title: string;
  product: {
    id: string;
    title: string;
    priceCents: number;
    Image: Array<{ fileUrl: string; sortOrder: number }>;
  } | null;
  order: {
    id: string;
    orderNumber: string | null;
    status: string;
    totalAmount: number;
    createdAt: Date;
  } | null;
  lastMessage: {
    id: string;
    text: string | null;
    messageType: string;
    createdAt: Date;
    readAt: Date | null;
    senderId: string;
    orderNumber?: string | null;
    User: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
      displayFullName: boolean | null;
      displayNameOption: string | null;
    };
  } | null;
  participants: Array<{
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName: boolean | null;
    displayNameOption: string | null;
  }>;
  otherParticipant: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName: boolean | null;
    displayNameOption: string | null;
  } | null;
  lastMessageAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Zelfde dataset als GET /api/conversations (source of truth voor ConversationsList).
 */
export async function loadConversationsForSessionUser(
  email: string
): Promise<{ userId: string; conversations: LoadedConversation[] } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      ConversationParticipant: {
        where: { isHidden: false },
        select: {
          Conversation: {
            select: {
              id: true,
              title: true,
              lastMessageAt: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              Product: {
                select: {
                  id: true,
                  title: true,
                  priceCents: true,
                  Image: {
                    select: { fileUrl: true, sortOrder: true },
                    take: 1,
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
              Order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  totalAmount: true,
                  createdAt: true,
                },
              },
              Message: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  text: true,
                  messageType: true,
                  createdAt: true,
                  readAt: true,
                  senderId: true,
                  orderNumber: true,
                  User: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      profileImage: true,
                      displayFullName: true,
                      displayNameOption: true,
                    },
                  },
                },
              },
              ConversationParticipant: {
                select: {
                  userId: true,
                  User: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      profileImage: true,
                      displayFullName: true,
                      displayNameOption: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const conversations: LoadedConversation[] = user.ConversationParticipant.map(
    (participant) => {
      const conversation = participant.Conversation;
      const otherParticipants = conversation.ConversationParticipant.filter(
        (p) => p.userId !== user.id
      ).map((p) => {
        if (p.User) {
          const u = p.User;
          return {
            id: u.id,
            name: u.name,
            username: u.username,
            profileImage: u.profileImage,
            displayFullName: u.displayFullName,
            displayNameOption: u.displayNameOption,
          };
        }
        reportMessagingDiagnostic("conv_participant_stub", {
          reason: "no_user_row",
        });
        return {
          id: p.userId,
          name: null,
          username: null,
          profileImage: null,
          displayFullName: null,
          displayNameOption: null,
        };
      });
      const otherParticipant = otherParticipants[0] || null;

      const rawMsg = conversation.Message[0] ?? null;
      const lastMessage = rawMsg
        ? {
            id: rawMsg.id,
            text: rawMsg.text,
            messageType: rawMsg.messageType,
            createdAt: rawMsg.createdAt,
            readAt: rawMsg.readAt,
            senderId: rawMsg.senderId,
            orderNumber: rawMsg.orderNumber,
            User: rawMsg.User
              ? {
                  id: rawMsg.User.id,
                  name: rawMsg.User.name,
                  username: rawMsg.User.username,
                  profileImage: rawMsg.User.profileImage,
                  displayFullName: rawMsg.User.displayFullName,
                  displayNameOption: rawMsg.User.displayNameOption,
                }
              : {
                  id: rawMsg.senderId,
                  name: null,
                  username: null,
                  profileImage: null,
                  displayFullName: null,
                  displayNameOption: null,
                },
          }
        : null;

      return {
        id: conversation.id,
        title:
          conversation.title ||
          (conversation.Product
            ? conversation.Product.title
            : otherParticipant
              ? otherParticipant.name ||
                otherParticipant.username ||
                "Gesprek"
              : "Gesprek"),
        product: conversation.Product,
        order: conversation.Order,
        lastMessage,
        participants: otherParticipants,
        otherParticipant,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    }
  );

  const conversationsSorted = sortConversationsByActivity(conversations);

  return { userId: user.id, conversations: conversationsSorted };
}
