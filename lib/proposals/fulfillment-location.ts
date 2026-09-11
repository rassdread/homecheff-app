/**
 * Post-accept fulfillment location + schedule completion.
 * Exact street address is operational (CommunityOrder), not a pre-accept proposal term.
 * Agreed fulfillment method + optional proposal date/time stay on Proposal/Agreement snapshot.
 */
import type {
  CommunityOrderFulfillmentMode,
  ProposalFulfillmentType,
} from '@prisma/client';

export type FulfillmentLocationState =
  | 'LOCATION_NOT_REQUIRED'
  | 'LOCATION_AND_SCHEDULE_PENDING'
  | 'LOCATION_PENDING'
  | 'SCHEDULE_PENDING'
  | 'COMPLETE';

export type FulfillmentLocationOwner = 'SELLER' | 'BUYER' | null;

export type AddressParts = {
  address?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  place?: string | null;
  country?: string | null;
};

export function formatOperationalAddress(parts: AddressParts): string | null {
  const street = [parts.address?.trim(), parts.houseNumber?.trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  const cityLine = [parts.postalCode?.trim(), parts.city?.trim() || parts.place?.trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  const line = [street, cityLine, parts.country?.trim()].filter(Boolean).join(', ');
  return line || null;
}

export function isPhysicalFulfillment(
  mode: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined,
): boolean {
  if (!mode) return false;
  return (
    mode === 'PICKUP' ||
    mode === 'DELIVERY' ||
    mode === 'ON_SITE_PROVIDER' ||
    mode === 'ON_SITE_CLIENT'
  );
}

export function isDigitalFulfillment(
  mode: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined,
): boolean {
  return mode === 'DIGITAL' || (!mode && false);
}

/** Who must confirm the exact operational address after accept. */
export function resolveLocationOwner(
  mode: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined,
): FulfillmentLocationOwner {
  if (mode === 'PICKUP' || mode === 'ON_SITE_PROVIDER') return 'SELLER';
  if (mode === 'DELIVERY' || mode === 'ON_SITE_CLIENT') return 'BUYER';
  return null;
}

export function resolveOperationalAddress(input: {
  mode?: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined;
  fulfillmentMode?: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  deliveryRequestPickup?: string | null;
  deliveryRequestDelivery?: string | null;
}): string | null {
  const owner = resolveLocationOwner(input.mode ?? input.fulfillmentMode);
  if (owner === 'SELLER') {
    return (
      input.pickupAddress?.trim() ||
      input.deliveryRequestPickup?.trim() ||
      null
    );
  }
  if (owner === 'BUYER') {
    return (
      input.deliveryAddress?.trim() ||
      input.deliveryRequestDelivery?.trim() ||
      null
    );
  }
  return null;
}

export function resolveEffectiveSchedule(input: {
  proposalDate?: string | Date | null;
  proposalTimeWindow?: string | null;
  confirmedDate?: string | Date | null;
  confirmedTimeWindow?: string | null;
}): { date: string | null; timeWindow: string | null; fromProposal: boolean } {
  const propDate = toIsoDate(input.proposalDate);
  const propTime = input.proposalTimeWindow?.trim() || null;
  if (propDate || propTime) {
    return { date: propDate, timeWindow: propTime, fromProposal: true };
  }
  return {
    date: toIsoDate(input.confirmedDate),
    timeWindow: input.confirmedTimeWindow?.trim() || null,
    fromProposal: false,
  };
}

export function deriveFulfillmentLocationState(input: {
  fulfillmentMode: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  deliveryRequestPickup?: string | null;
  deliveryRequestDelivery?: string | null;
  proposalDate?: string | Date | null;
  proposalTimeWindow?: string | null;
  confirmedDate?: string | Date | null;
  confirmedTimeWindow?: string | null;
  locationCompletedAt?: string | Date | null;
}): FulfillmentLocationState {
  if (!isPhysicalFulfillment(input.fulfillmentMode)) {
    return 'LOCATION_NOT_REQUIRED';
  }

  const address = resolveOperationalAddress({
    fulfillmentMode: input.fulfillmentMode,
    // Operational SoT is CommunityOrder; DeliveryRequest is a sync target, not completion alone.
    pickupAddress: input.pickupAddress,
    deliveryAddress: input.deliveryAddress,
  });
  const schedule = resolveEffectiveSchedule(input);
  const hasAddress = Boolean(address && address.length >= 5);
  const hasSchedule = Boolean(schedule.date && schedule.timeWindow);

  if (hasAddress && hasSchedule) return 'COMPLETE';
  if (!hasAddress && !hasSchedule) return 'LOCATION_AND_SCHEDULE_PENDING';
  if (!hasAddress) return 'LOCATION_PENDING';
  return 'SCHEDULE_PENDING';
}

/** UI mode for location card — never render empty "Label:" rows. */
export function resolveLocationPanelPresentation(input: {
  state: FulfillmentLocationState;
  exactAddress?: string | null;
  scheduleDate?: string | null;
  scheduleTimeWindow?: string | null;
  viewerCanComplete: boolean;
}): 'hidden' | 'not_recorded' | 'panel' {
  if (input.state === 'LOCATION_NOT_REQUIRED') return 'hidden';
  const hasAddress = Boolean(input.exactAddress?.trim());
  const hasSchedule = Boolean(
    input.scheduleDate?.trim() || input.scheduleTimeWindow?.trim(),
  );
  if (!hasAddress && !hasSchedule && !input.viewerCanComplete) {
    return 'not_recorded';
  }
  return 'panel';
}

export function toIsoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function fulfillmentDateLabelKey(
  mode: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined,
): string {
  if (mode === 'DELIVERY' || mode === 'ON_SITE_CLIENT') {
    return 'proposal.fields.deliveryDateLabel';
  }
  if (mode === 'PICKUP' || mode === 'ON_SITE_PROVIDER') {
    return 'proposal.fields.pickupDateLabel';
  }
  return 'marketplace.form.dateLabel';
}

export function fulfillmentTimeLabelKey(
  mode: CommunityOrderFulfillmentMode | ProposalFulfillmentType | null | undefined,
): string {
  if (mode === 'DELIVERY' || mode === 'ON_SITE_CLIENT') {
    return 'proposal.fields.deliveryTimeLabel';
  }
  if (mode === 'PICKUP' || mode === 'ON_SITE_PROVIDER') {
    return 'proposal.fields.pickupTimeLabel';
  }
  return 'marketplace.form.timeLabel';
}
