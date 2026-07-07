import { listProfileDealsForUser } from '@/lib/proposals/profile-deal-service';
import {
  isDeliveryDeal,
  resolveAgreementDisplayKind,
  type AgreementProductContext,
} from './agreement-display-kind';
import {
  attachDealFacets,
  countByFilter,
  itemMatchesFilter,
} from './agreements-hub-filters';
import {
  buildAgendaSummary,
  buildDealAgenda,
  groupAgenda,
} from './agreement-agenda';
import type {
  AgreementHubDealItem,
  AgreementHubItem,
  AgreementsHubFilter,
  AgreementsHubResponse,
} from './agreements-hub-types';
import { listPendingProposalsForUser } from './list-pending-proposals-for-user';
import { prisma } from '@/lib/prisma';

async function loadProductContexts(
  productIds: string[],
): Promise<Map<string, AgreementProductContext>> {
  if (productIds.length === 0) return new Map();

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      marketplaceCategory: true,
      listingIntent: true,
      specializations: true,
      subcategory: true,
      category: true,
    },
  });

  return new Map(
    products.map((p) => [
      p.id,
      {
        marketplaceCategory: p.marketplaceCategory,
        listingIntent: p.listingIntent,
        specializations: p.specializations,
        subcategory: p.subcategory,
        category: p.category,
      },
    ]),
  );
}

export async function listAgreementsHubForUser(
  userId: string,
  filter?: AgreementsHubFilter,
): Promise<AgreementsHubResponse> {
  const [proposals, deals] = await Promise.all([
    listPendingProposalsForUser(userId),
    listProfileDealsForUser(userId),
  ]);

  const productIds = [
    ...new Set(
      deals
        .map((d) => d.proposal.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const productContexts = await loadProductContexts(productIds);

  const dealItems: AgreementHubDealItem[] = deals.map((deal) => {
    const product = deal.proposal.productId
      ? productContexts.get(deal.proposal.productId) ?? null
      : null;
    const deliveryRequired = isDeliveryDeal(deal);
    const displayKind = resolveAgreementDisplayKind({
      proposal: deal.proposal,
      product,
      deliveryRequired,
    });

    return attachDealFacets({
      kind: 'deal',
      id: deal.id,
      updatedAt: deal.updatedAt,
      displayKind,
      deal,
      timeline: [],
      facets: [],
      agenda: buildDealAgenda(deal),
    });
  });

  const allItems: AgreementHubItem[] = [...proposals, ...dealItems].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const counts = countByFilter(allItems);
  const agenda = groupAgenda(allItems);
  const summary = buildAgendaSummary(allItems, agenda);
  const items = filter
    ? allItems.filter((item) => itemMatchesFilter(item, filter))
    : allItems;

  return { items, counts, agenda, summary };
}

export async function getAgreementHubDealForUser(
  userId: string,
  communityOrderId: string,
): Promise<AgreementHubDealItem | null> {
  const deals = await listProfileDealsForUser(userId);
  const deal = deals.find((row) => row.id === communityOrderId);
  if (!deal) return null;

  const productContexts = deal.proposal.productId
    ? await loadProductContexts([deal.proposal.productId])
    : new Map();
  const product = deal.proposal.productId
    ? productContexts.get(deal.proposal.productId) ?? null
    : null;

  return attachDealFacets({
    kind: 'deal',
    id: deal.id,
    updatedAt: deal.updatedAt,
    displayKind: resolveAgreementDisplayKind({
      proposal: deal.proposal,
      product,
      deliveryRequired: isDeliveryDeal(deal),
    }),
    deal,
    timeline: [],
    facets: [],
    agenda: buildDealAgenda(deal),
  });
}
