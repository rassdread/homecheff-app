import { NextResponse } from 'next/server';
import { loadProductProposalHeader } from '@/lib/communication/resolveConversationHeader';

export const dynamic = 'force-dynamic';

/** Listing context for a private proposal draft. No conversation and no seller notification. */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const contextHeader = await loadProductProposalHeader(params.id);
  if (!contextHeader) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  return NextResponse.json({ contextHeader });
}
