/**
 * LEGAL-1 — server-side commerce declaration enforcement for paid publish.
 */

import { NextResponse } from 'next/server';
import {
  COMMERCE_DECLARATION_REQUIRED_CODE,
  offerRequiresCommerceDeclaration,
  type CommerceDeclarationGateInput,
} from '@/lib/legal/commerce-declaration-gate';
import { applyCommerceDeclarationUpdate } from '@/lib/legal/seller-commerce-context';
import {
  isSelectableCommerceDeclaration,
  parseSellerCommerceDeclaration,
} from '@/lib/legal/seller-commerce-types';
import { prisma } from '@/lib/prisma';

export async function assertOrApplyCommerceDeclarationForPaidOffer(input: {
  sellerProfileId: string;
  gate: CommerceDeclarationGateInput;
  /** Optional body.commerceDeclaration from client after modal */
  bodyDeclaration?: unknown;
}): Promise<NextResponse | null> {
  if (!offerRequiresCommerceDeclaration(input.gate)) {
    return null;
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { id: input.sellerProfileId },
    select: {
      id: true,
      commerceDeclaration: true,
      commerceDeclaredAt: true,
      commerceReviewState: true,
      commerceReviewRequiredAt: true,
      commerceReviewReasons: true,
    },
  });

  if (!seller) {
    return NextResponse.json(
      { error: 'Verkopersprofiel niet gevonden' },
      { status: 404 },
    );
  }

  let declaration = parseSellerCommerceDeclaration(seller.commerceDeclaration);

  if (
    declaration === 'UNDECLARED' &&
    isSelectableCommerceDeclaration(input.bodyDeclaration)
  ) {
    const update = applyCommerceDeclarationUpdate({
      previous: seller,
      nextDeclaration: input.bodyDeclaration,
    });
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: update,
    });
    declaration = input.bodyDeclaration;
  }

  if (declaration === 'UNDECLARED') {
    return NextResponse.json(
      {
        error: 'Kies hoe je aanbiedt voordat je een betaald aanbod plaatst.',
        errorKey: 'commerce.declaration.required',
        code: COMMERCE_DECLARATION_REQUIRED_CODE,
      },
      { status: 400 },
    );
  }

  return null;
}
