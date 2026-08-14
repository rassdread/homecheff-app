import { NextRequest, NextResponse } from 'next/server';
import {
  handleProposalServiceError,
  resolveProposalApiUser,
} from '@/lib/proposals/proposal-api';
import { ProposalService } from '@/lib/proposals/proposal-service';
import {
  assertProductAllergenConfirmationOrThrow,
  FoodAllergensRequiredError,
} from '@/lib/legal/assert-food-allergens-for-transaction';
import { foodAllergensBlockResponseBody } from '@/lib/legal/food-allergen-context';
import { prisma } from '@/lib/prisma';

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

    const existing = await prisma.proposal.findUnique({
      where: { id: params.proposalId },
      select: { productId: true },
    });
    try {
      await assertProductAllergenConfirmationOrThrow(existing?.productId);
    } catch (e) {
      if (e instanceof FoodAllergensRequiredError) {
        return NextResponse.json(foodAllergensBlockResponseBody(), {
          status: 400,
        });
      }
      throw e;
    }

    const result = await ProposalService.acceptProposal(
      authResult.userId,
      params.proposalId,
      { commitmentAccepted },
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FoodAllergensRequiredError) {
      return NextResponse.json(foodAllergensBlockResponseBody(), { status: 400 });
    }
    return handleProposalServiceError(error);
  }
}
