import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { resolveConversationContext } from '@/lib/communication/resolveConversationContext';
import { resolveConversationHeader } from '@/lib/communication/resolveConversationHeader';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { conversationId } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    // Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403, headers: cors });
    }

    // Fetch conversation with all details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
                displayFullName: true,
                displayNameOption: true,
                DeliveryProfile: {
                  select: { isVerified: true },
                },
              },
            },
          }
        },
        Product: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            category: true,
            Image: {
              select: {
                fileUrl: true,
                sortOrder: true
              },
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        Order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: cors });
    }

    const otherUserId = conversation.ConversationParticipant.find((p) => p.userId !== user.id)?.userId ?? null;

    const [youFollowThemRow, theyFollowYouRow, messageCount] = await Promise.all([
      otherUserId
        ? prisma.follow.findUnique({
            where: {
              followerId_sellerId: { followerId: user.id, sellerId: otherUserId },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      otherUserId
        ? prisma.follow.findUnique({
            where: {
              followerId_sellerId: { followerId: otherUserId, sellerId: user.id },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      prisma.message.count({
        where: { conversationId, deletedAt: null },
      }),
    ]);

    // Other row: keep stable id from participant even if User join is missing (deleted / inconsistent data).
    const otherRow = conversation.ConversationParticipant.find(
      (p) => p.userId !== user.id
    );
    const otherParticipantData = otherRow?.User ?? null;

    const otherParticipant = otherRow
      ? {
          id: otherParticipantData?.id ?? otherRow.userId,
          name: otherParticipantData?.name ?? null,
          username: otherParticipantData?.username ?? null,
          profileImage: otherParticipantData?.profileImage ?? null,
          displayFullName: otherParticipantData?.displayFullName ?? null,
          displayNameOption: otherParticipantData?.displayNameOption ?? null,
          sellerVerified:
            otherParticipantData?.DeliveryProfile?.isVerified === true,
        }
      : null;

    const participantsForClient =
      conversation.ConversationParticipant.filter((p) => p.userId !== user.id)
        .map((p) =>
          p.User
            ? {
                id: p.User.id,
                name: p.User.name,
                username: p.User.username,
                profileImage: p.User.profileImage,
                displayFullName: p.User.displayFullName,
                displayNameOption: p.User.displayNameOption,
              }
            : {
                id: p.userId,
                name: null,
                username: null,
                profileImage: null,
                displayFullName: null,
                displayNameOption: null,
              }
        );

    const safeMessageCount =
      typeof messageCount === "number" && Number.isFinite(messageCount)
        ? messageCount
        : 0;

    const context = resolveConversationContext(conversation);

    const contextHeader = await resolveConversationHeader({
      conversationId,
      currentUserId: user.id,
      peer: otherParticipant,
    });

    // Transform to match the expected format
    const conversationData = {
      id: conversation.id,
      title: conversation.title,
      contextType: context.contextType,
      contextId: context.contextId,
      status: conversation.status,
      product: conversation.Product
        ? {
            id: conversation.Product.id,
            title: conversation.Product.title,
            priceCents: conversation.Product.priceCents,
            category: conversation.Product.category,
            Image: conversation.Product.Image ?? [],
          }
        : null,
      otherParticipant,
      participants: participantsForClient,
      lastMessageAt: conversation.lastMessageAt,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      relationshipContext: {
        youFollowThem: Boolean(youFollowThemRow),
        theyFollowYou: Boolean(theyFollowYouRow),
        messageCount: safeMessageCount,
        productTitle: conversation.Product?.title?.trim() || null,
        productCategory: conversation.Product?.category ?? null,
      },
      contextHeader,
    };

    return NextResponse.json({ conversation: conversationData }, { headers: cors });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
