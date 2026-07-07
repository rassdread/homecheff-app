import type { SettlementMode } from '@prisma/client';
import type { ProposalPaymentPath } from './proposal-product-binding';

export type ProposalFormValues = {
  title: string;
  description: string;
  quantity: string;
  amountEuros: string;
  requestedDate: string;
  requestedTimeWindow: string;
  fulfillmentType: '' | 'PICKUP' | 'DELIVERY';
  settlementMode: SettlementMode;
  paymentPath: ProposalPaymentPath;
  acceptedValueTaxonomyIds: string[];
  requestedValueTaxonomyIds: string[];
};

export const EMPTY_PROPOSAL_FORM: ProposalFormValues = {
  title: '',
  description: '',
  quantity: '1',
  amountEuros: '',
  requestedDate: '',
  requestedTimeWindow: '',
  fulfillmentType: '',
  settlementMode: 'MONEY',
  paymentPath: 'NONE',
  acceptedValueTaxonomyIds: [],
  requestedValueTaxonomyIds: [],
};
