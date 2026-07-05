import { NextRequest, NextResponse } from 'next/server';
import {
  handleProposalServiceError,
  resolveProposalApiUser,
} from '@/lib/proposals/proposal-api';
import { ProposalService } from '@/lib/proposals/proposal-service';
import type { CounterProposalInput } from '@/lib/proposals/proposal-types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { proposalId: string } },
) {
  try {
    const authResult = await resolveProposalApiUser();
    if ('error' in authResult) return authResult.error;

    const body = (await req.json()) as CounterProposalInput;
    const result = await ProposalService.counterProposal(
      authResult.userId,
      params.proposalId,
      body,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleProposalServiceError(error);
  }
}
