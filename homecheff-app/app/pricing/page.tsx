'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRICING_TIERS, type PricingTier } from '@/lib/pricing';

export default function PricingPage() {
  const { data: session } = useSession();
  const [currentTier, setCurrentTier] = useState<PricingTier>('INDIVIDUAL');
  const [userRevenue, setUserRevenue] = useState({ yearly: 0, monthly: 0 });

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/revenue');
      if (response.ok) {
        const data = await response.json();
        setUserRevenue(data);
        setCurrentTier(data.pricingTier || 'INDIVIDUAL');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUpgrade = async (tier: PricingTier) => {
    if (!session?.user) {
      alert('Je moet ingelogd zijn om te upgraden');
      return;
    }

    try {
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });

      if (response.ok) {
        alert(`Upgrade naar ${PRICING_TIERS[tier].name} succesvol!`);
        fetchUserData();
      } else {
        const error = await response.json();
        alert(error.message || 'Upgrade mislukt');
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij het upgraden');
    }
  };

  const getTierIcon = (tier: PricingTier) => {
    switch (tier) {
      case 'INDIVIDUAL': return <Star className="w-6 h-6" />;
      case 'BUSINESS_BASIC': return <Check className="w-6 h-6" />;
      case 'BUSINESS_PRO': return <Crown className="w-6 h-6" />;
      case 'BUSINESS_PREMIUM': return <Zap className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier: PricingTier) => {
    switch (tier) {
      case 'INDIVIDUAL': return 'border-gray-200';
      case 'BUSINESS_BASIC': return 'border-green-200';
      case 'BUSINESS_PRO': return 'border-blue-200';
      case 'BUSINESS_PREMIUM': return 'border-purple-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            HomeCheff Verdienmodel
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Kies het pakket dat het beste bij jouw behoeften past. 
            Schaal op naarmate je groeit en profiteer van lagere fees.
          </p>
        </div>

        {/* Current Status */}
        {session?.user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Jouw Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  €{(userRevenue.yearly / 100).toFixed(2)}
                </div>
                <div className="text-gray-600">Jaaromzet</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  €{(userRevenue.monthly / 100).toFixed(2)}
                </div>
                <div className="text-gray-600">Maandomzet</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {PRICING_TIERS[currentTier].name}
                </div>
                <div className="text-gray-600">Huidig Pakket</div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(PRICING_TIERS).map(([key, tier]) => {
            const tierKey = key as PricingTier;
            const isCurrentTier = currentTier === tierKey;
            const isUpgrade = tierKey !== 'INDIVIDUAL' && !isCurrentTier;
            
            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl shadow-sm border-2 p-8 ${
                  isCurrentTier ? 'border-green-500 ring-2 ring-green-200' : getTierColor(tierKey)
                }`}
              >
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Huidig Pakket
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                    isCurrentTier ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getTierIcon(tierKey)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {tier.monthlyFee === 0 ? 'Gratis' : `€${tier.monthlyFee}/maand`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tier.feePercentage}% transactiefee
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {isCurrentTier ? (
                    <Button disabled className="w-full">
                      Huidig Pakket
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(tierKey)}
                      className={`w-full ${
                        isUpgrade 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {isUpgrade ? 'Upgraden' : 'Activeren'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Veelgestelde Vragen
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hoe werkt het verdienmodel?
              </h3>
              <p className="text-gray-600">
                Particulieren betalen alleen transactiefees over hun verkopen. Bedrijven betalen een maandelijks abonnement 
                plus lagere transactiefees. Hoe hoger je tier, hoe lager je fees.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kan ik upgraden of downgraden?
              </h3>
              <p className="text-gray-600">
                Ja, je kunt altijd upgraden naar een hogere tier voor lagere fees. Downgraden kan aan het einde van je 
                huidige factureringsperiode.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wat gebeurt er als ik de limiet bereik?
              </h3>
              <p className="text-gray-600">
                Individuele gebruikers kunnen maximaal €2000 per jaar verdienen. Als je deze limiet bereikt, 
                kun je upgraden naar een bedrijfspakket voor onbeperkte omzet.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wanneer worden fees berekend?
              </h3>
              <p className="text-gray-600">
                Fees worden automatisch berekend bij elke succesvolle transactie. Je ontvangt het netto bedrag 
                (na aftrek van fees) direct op je account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
