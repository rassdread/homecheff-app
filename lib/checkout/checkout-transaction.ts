import { Prisma } from '@prisma/client';

/**
 * Lock the seller user and the listing before checkout decides or reserves stock.
 * The checkout route has a one-connection pool on the Neon pooler, so every query
 * in the interactive transaction must use this transaction client.
 */
export async function lockCheckoutListings(
  tx: Prisma.TransactionClient,
  productIds: string[],
): Promise<void> {
  const ids = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))].sort();
  if (ids.length === 0) return;

  await tx.$queryRaw`
    SELECT u.id
    FROM "User" u
    INNER JOIN "SellerProfile" s ON s."userId" = u.id
    INNER JOIN "Product" p ON p."sellerId" = s.id
    WHERE p.id IN (${Prisma.join(ids)})
    ORDER BY u.id
    FOR UPDATE OF u
  `;
  await tx.$queryRaw`
    SELECT p.id
    FROM "Product" p
    WHERE p.id IN (${Prisma.join(ids)})
    ORDER BY p.id
    FOR UPDATE OF p
  `;
}
