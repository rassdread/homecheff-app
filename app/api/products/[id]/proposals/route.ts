import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { assertAccountRequirementsOr403 } from '@/lib/account-requirements-server';
import { conversationContextFromProduct } from '@/lib/communication/resolveConversationContext';
import {
  handleProposalServiceError,
} from '@/lib/proposals/proposal-api';
import { ProposalService } from '@/lib/proposals/proposal-service';
import type { CreateProposalInput } from '@/lib/proposals/proposal-types';
import { tryAwardConversationStartedHcp } from '@/lib/gamification/interaction-hcp';

export const dynamic = 'force-dynamic';

/**
 * Submit a listing proposal.
 * The conversation is created or reused only here, after the buyer presses send.
 * A new conversation stays hidden from the seller until the proposal message exists.
 * If proposal creation fails, a conversation created by this request is removed.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const productId = params.id?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Account: { select: { provider: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reqBlock = assertAccountRequirementsOr403(user, 'sendMessage');
    if (reqBlock) return reqBlock;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        seller: { select: { User: { select: { id: true, messagePrivacy: true, role: true } } } },
      },
    });
    if (!product?.seller?.User) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const seller = product.seller.User;
    if (user.id === seller.id) {
      return NextResponse.json(
        { error: 'Cannot start conversation about your own product' },
        { status: 400 },
      );
    }

    if (seller.role !== 'ADMIN') {
      if (seller.messagePrivacy === 'NOBODY') {
        return NextResponse.json(
          { error: 'Deze gebruiker accepteert geen berichten' },
          { status: 403 },
        );
      }
      if (seller.messagePrivacy === 'FANS_ONLY') {
        const fanRelation = await prisma.follow.findFirst({
          where: { sellerId: seller.id, followerId: user.id },
        });
        if (!fanRelation) {
          return NextResponse.json(
            { error: 'Je moet een fan zijn van deze gebruiker om berichten te kunnen sturen' },
            { status: 403 },
          );
        }
      }
    }

    const body = (await req.json()) as CreateProposalInput;
    const headerKey = req.headers.get('idempotency-key')?.trim() || null;
    if (headerKey && !body.clientIdempotencyKey) {
      body.clientIdempotencyKey = headerKey;
    }
    body.productId = product.id;

    let createdConversationId: string | null = null;
    try {
      let conversation = await prisma.conversation.findFirst({
        where: {
          productId: product.id,
          AND: [
            { ConversationParticipant: { some: { userId: user.id } } },
            { ConversationParticipant: { some: { userId: seller.id } } },
          ],
        },
        select: { id: true, ConversationParticipant: { select: { userId: true } } },
      });
      if (conversation && conversation.ConversationParticipant.length !== 2) {
        conversation = null;
      }

      if (!conversation) {
        const ctxWrite = conversationContextFromProduct(product.id);
        const created = await prisma.conversation.create({
          data: {
            id: crypto.randomUUID(),
            productId: product.id,
            ...ctxWrite,
            title: `Gesprek over ${product.title}`,
            isActive: true,
            ConversationParticipant: {
              create: [
                { id: crypto.randomUUID(), userId: user.id, isHidden: true },
                { id: crypto.randomUUID(), userId: seller.id, isHidden: true },
              ],
            },
          },
          select: { id: true },
        });
        createdConversationId = created.id;
        conversation = { id: created.id, ConversationParticipant: [] };
      }

      const result = await ProposalService.createProposal(user.id, conversation.id, body);
      if (createdConversationId) {
        void tryAwardConversationStartedHcp(user.id, conversation.id).catch(() => undefined);
      }
      return NextResponse.json(
        { ...result, conversationId: conversation.id },
        { status: result.idempotentReplay ? 200 : 201 },
      );
    } catch (error) {
      if (createdConversationId) {
        const messages = await prisma.message.count({
          where: { conversationId: createdConversationId },
        });
        if (messages === 0) {
          await prisma.conversation.delete({ where: { id: createdConversationId } }).catch(() => undefined);
        }
      }
      return handleProposalServiceError(error);
    }
  } catch (error) {
    return handleProposalServiceError(error);
  }
}
