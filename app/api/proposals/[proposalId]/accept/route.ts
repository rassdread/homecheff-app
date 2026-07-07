import { NextRequest, NextResponse } from 'next/server';
import {
  handleProposalServiceError,
  resolveProposalApiUser,
} from '@/lib/proposals/proposal-api';
import { ProposalService } from '@/lib/proposals/proposal-service';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { proposalId: string } },
) {
  try {
    const authResult = await resolveProposalApiUser();
    if ('error' in authResult) return authResult.error;

    let commitmentAccepted = false;
    try {
      const body = (await req.json()) as { commitmentAccepted?: unknown };
      commitmentAccepted = body?.commitmentAccepted === true;
    } catch {
      commitmentAccepted = false;
    }

    const result = await ProposalService.acceptProposal(
      authResult.userId,
      params.proposalId,
      { commitmentAccepted },
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleProposalServiceError(error);
  }
}
