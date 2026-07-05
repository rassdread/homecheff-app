import { NextRequest, NextResponse } from 'next/server';
import {
  handleProposalServiceError,
  resolveProposalApiUser,
} from '@/lib/proposals/proposal-api';
import { ProposalService } from '@/lib/proposals/proposal-service';
import type { CreateProposalInput } from '@/lib/proposals/proposal-types';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  try {
    const authResult = await resolveProposalApiUser();
    if ('error' in authResult) return authResult.error;

    const [proposals, communityOrders, deliveryRequestsByProposalId] =
      await Promise.all([
      ProposalService.listProposalsForConversation(
        authResult.userId,
        params.conversationId,
      ),
      ProposalService.listCommunityOrdersForConversation(
        authResult.userId,
        params.conversationId,
      ),
      ProposalService.listDeliveryRequestsByProposalForConversation(
        authResult.userId,
        params.conversationId,
      ),
    ]);

    return NextResponse.json({
      proposals,
      communityOrders,
      deliveryRequestsByProposalId,
    });
  } catch (error) {
    return handleProposalServiceError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  try {
    const authResult = await resolveProposalApiUser();
    if ('error' in authResult) return authResult.error;

    const body = (await req.json()) as CreateProposalInput;
    const result = await ProposalService.createProposal(
      authResult.userId,
      params.conversationId,
      body,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleProposalServiceError(error);
  }
}
