'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { readHcCampaignCodeFromSearch } from '@/lib/acquisition/hc-campaign-code';

type Offer = {
  visible: boolean;
  name?: string;
  hcAmount?: number;
  requireStripeConnect?: boolean;
  marketplaceSpendable?: boolean;
};

/** Shows a campaign only when Growth says it is active and still has budget. */
export default function HcCampaignOfferNotice() {
  const searchParams = useSearchParams();
  const code = readHcCampaignCodeFromSearch(searchParams);
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    void fetch(`/api/hc/campaign-public?code=${encodeURIComponent(code)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: Offer) => {
        if (!cancelled) setOffer(json);
      })
      .catch(() => {
        if (!cancelled) setOffer({ visible: false });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!offer?.visible || !offer.hcAmount) return null;
  const euros = (offer.hcAmount / 100).toFixed(2);
  return (
    <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
      {offer.name ? `${offer.name}: ` : ''}
      {`€${euros} HC na je eerste geldige aanbod.`}
      {offer.requireStripeConnect ? ' Stripe Connect-verificatie is vereist voordat de HC wordt bijgeschreven.' : ''}
      {offer.marketplaceSpendable
        ? ' Deze HC is besteedbaar in de Marketplace.'
        : ' Deze HC is niet automatisch besteedbaar in de Marketplace.'}
    </p>
  );
}
