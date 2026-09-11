#!/usr/bin/env npx tsx
/**
 * READ-ONLY production integrity audit for Proposal → Agreement → CommunityOrder.
 * Prints anonymized counts only. Never mutates.
 *
 * Usage: npx tsx scripts/audit-proposal-agreement-integrity.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const [
    totalProposals,
    accepted,
    acceptedWithoutAgreement,
    acceptedWithoutOrder,
    counteredParents,
    duplicateOrders,
  ] = await Promise.all([
    prisma.proposal.count(),
    prisma.proposal.count({ where: { status: 'ACCEPTED' } }),
    prisma.proposal.count({
      where: { status: 'ACCEPTED', Agreement: { is: null } },
    }),
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c
      FROM "Proposal" p
      WHERE p.status = 'ACCEPTED'
        AND NOT EXISTS (
          SELECT 1 FROM "CommunityOrder" co WHERE co."proposalId" = p.id
        )
    `.then((r) => Number(r[0]?.c ?? 0)),
    prisma.proposal.count({
      where: { status: 'COUNTERED' },
    }),
    prisma.$queryRaw<{ proposalId: string; c: bigint }[]>`
      SELECT "proposalId", COUNT(*)::bigint AS c
      FROM "CommunityOrder"
      GROUP BY "proposalId"
      HAVING COUNT(*) > 1
    `,
  ]);

  const proposalsWithoutConversation = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM "Proposal" p
    LEFT JOIN "Conversation" c ON c.id = p."conversationId"
    WHERE c.id IS NULL
  `.then((r) => Number(r[0]?.c ?? 0));

  const supersededActionable = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM "Proposal" p
    WHERE p.status = 'COUNTERED'
      AND EXISTS (
        SELECT 1 FROM "Proposal" child
        WHERE child."parentProposalId" = p.id
          AND child.status = 'PENDING'
      )
  `.then((r) => Number(r[0]?.c ?? 0));

  // COUNTERED should never be accept-actionable; count any that somehow stayed PENDING incorrectly is 0 by status.
  // Report how many COUNTERED parents exist (historical) vs wrongly PENDING with a child.
  const pendingWithChild = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint AS c
    FROM "Proposal" parent
    WHERE parent.status = 'PENDING'
      AND EXISTS (
        SELECT 1 FROM "Proposal" child
        WHERE child."parentProposalId" = parent.id
      )
  `.then((r) => Number(r[0]?.c ?? 0));

  console.log(
    JSON.stringify(
      {
        PRODUCTION_PROPOSALS_AUDITED: totalProposals,
        ORPHAN_PROPOSALS: proposalsWithoutConversation,
        ACCEPTED_WITHOUT_AGREEMENT: acceptedWithoutAgreement,
        ACCEPTED_WITHOUT_APPOINTMENT: acceptedWithoutOrder,
        DUPLICATE_APPOINTMENTS: duplicateOrders.length,
        SUPERSEDED_STILL_ACTIONABLE: pendingWithChild,
        COUNTERED_PARENTS: counteredParents,
        ACCEPTED_TOTAL: accepted,
        SUPERSEDED_WITH_PENDING_CHILD: supersededActionable,
        note: 'Appointment = CommunityOrder; dry-run only',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
