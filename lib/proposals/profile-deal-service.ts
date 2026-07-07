import { prisma } from '@/lib/prisma';
import { serializeDeliveryRequest } from '@/lib/delivery/serialize-delivery-marketplace';
import type { DeliveryRequestDTO } from '@/lib/delivery/delivery-marketplace-types';
import { serializeCommunityOrder, serializeProposal } from './serialize-proposal';
import { resolveProfileDealPresentation } from './profile-deal-status';
import type { ProfileDealDTO, ProfileDealUserRole } from './profile-deal-types';

export async function listProfileDealsForUser(
  userId: string,
  status?: 'OPEN' | 'COMPLETED' | 'CANCELLED',
): Promise<ProfileDealDTO[]> {
  const rows = await prisma.communityOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      Proposal: true,
      Buyer: { select: { name: true, username: true } },
      Seller: { select: { name: true, username: true } },
      DealReviews: {
        where: { reviewerId: userId },
        select: { id: true },
      },
      DeliveryRequests: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          Assignments: {
            where: { status: { in: ['PENDING', 'ACCEPTED'] } },
            orderBy: { assignedAt: 'desc' },
            take: 1,
            include: {
              Courier: { select: { id: true, name: true, username: true } },
            },
          },
        },
      },
    },
  });

  return rows.map((row) => {
    const isBuyer = row.buyerId === userId;
    const counterpart = isBuyer ? row.Seller : row.Buyer;
    const userRoleInDeal: ProfileDealUserRole = isBuyer ? 'BUYER' : 'SELLER';
    const canReview =
      row.status === 'COMPLETED' && row.DealReviews.length === 0;

    const proposal = serializeProposal(row.Proposal);
    const communityOrder = serializeCommunityOrder(row);

    const deliveryRow = row.DeliveryRequests[0] ?? null;
    let deliveryRequest: DeliveryRequestDTO | null = null;
    if (deliveryRow) {
      const assignment = deliveryRow.Assignments[0] ?? null;
      const courierUser = assignment?.Courier ?? null;
      deliveryRequest = serializeDeliveryRequest(
        deliveryRow,
        assignment,
        courierUser,
      );
    }

    const presentation = resolveProfileDealPresentation({
      proposal,
      communityOrder,
      deliveryRequest,
      userRoleInDeal,
      canReview,
    });

    return {
      ...communityOrder,
      proposalTitle: row.Proposal.title,
      counterpartName: counterpart.name ?? counterpart.username,
      myReviewSubmitted: row.DealReviews.length > 0,
      canReview,
      userRoleInDeal,
      settlementMode: proposal.settlementMode,
      paymentPath: presentation.paymentPath,
      paymentStatus: presentation.paymentStatus,
      deliveryRequired: presentation.deliveryRequired,
      deliveryStatus: presentation.deliveryStatus,
      deliveryRequestId: presentation.deliveryRequestId,
      courierAssignmentStatus: presentation.courierAssignmentStatus,
      courierName: presentation.courierName,
      courierUserId: presentation.courierUserId,
      pickupLabel: presentation.pickupLabel,
      dropoffLabel: presentation.dropoffLabel,
      requestedWindowLabel: presentation.requestedWindowLabel,
      dealUx: presentation.dealUx,
      statusBlocks: presentation.statusBlocks,
      proposal,
      deliveryRequest,
      checkoutUrl: presentation.checkoutUrl,
      amountCents: proposal.amountCents,
      acceptedValueTaxonomyIds: proposal.acceptedValueTaxonomyIds,
      requestedValueTaxonomyIds: proposal.requestedValueTaxonomyIds,
    };
  });
}
