import type { CourierAssignmentStatus, SettlementMode } from '@prisma/client';
import type { DeliveryRequestDTO } from '@/lib/delivery/delivery-marketplace-types';
import type { DealUxState } from './deal-ux-state';
import type { ProposalPaymentPath } from './proposal-product-binding';
import type { CommunityOrderDTO, ProposalDTO } from './proposal-types';

export type ProfileDealUserRole = 'BUYER' | 'SELLER';

export type ProfileDealPaymentStatus =
  | 'NOT_APPLICABLE'
  | 'WAITING_HOMECHEFF'
  | 'PAID'
  | 'DIRECT_CONTACT'
  | 'VOLUNTARY'
  | 'FREE';

export type ProfileDealDeliveryStatus =
  | 'NOT_APPLICABLE'
  | 'AVAILABLE'
  | 'REQUESTED_PENDING'
  | 'OPEN'
  | 'CLAIMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProfileDealStatusBlockKind =
  | 'proposal'
  | 'payment'
  | 'exchange'
  | 'delivery'
  | 'nextAction';

export type ProfileDealStatusBlock = {
  kind: ProfileDealStatusBlockKind;
  labelKey: string;
  tone: 'neutral' | 'warning' | 'success' | 'info';
};

export type ProfileDealDTO = CommunityOrderDTO & {
  proposalTitle: string;
  counterpartName: string | null;
  myReviewSubmitted: boolean;
  canReview: boolean;
  userRoleInDeal: ProfileDealUserRole;
  settlementMode: SettlementMode;
  paymentPath: ProposalPaymentPath | null;
  paymentStatus: ProfileDealPaymentStatus;
  deliveryRequired: boolean;
  deliveryStatus: ProfileDealDeliveryStatus;
  deliveryRequestId: string | null;
  courierAssignmentStatus: CourierAssignmentStatus | null;
  courierName: string | null;
  courierUserId: string | null;
  pickupLabel: string | null;
  dropoffLabel: string | null;
  requestedWindowLabel: string | null;
  dealUx: DealUxState;
  statusBlocks: ProfileDealStatusBlock[];
  proposal: ProposalDTO;
  deliveryRequest: DeliveryRequestDTO | null;
  checkoutUrl: string | null;
  amountCents: number | null;
  acceptedValueTaxonomyIds: string[];
  requestedValueTaxonomyIds: string[];
};
