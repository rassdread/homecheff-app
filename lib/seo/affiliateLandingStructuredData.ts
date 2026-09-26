/** FAQPage JSON-LD for /affiliate — short answers for crawlers; full copy lives in i18n on the page. */
export function getAffiliateLandingFaqJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const pairs =
    lang === 'en'
      ? [
          {
            q: 'How does the HomeCheff affiliate program work?',
            a: 'You get a personal referral link and optional promo codes. When people join or subscribe via your attribution, you earn a share of platform fees or subscriptions for a defined period, paid out through Stripe Connect.',
          },
          {
            q: 'How much commission can I earn?',
            a: 'On Marketplace orders the affiliate pool is at most 50% of the HomeCheff platform fee, not of the order amount. One affiliate can receive the whole pool. Two different affiliates split it 25% + 25%. A Marketplace business subscription can pay 50% of the subscription fee, or 40% to SUB and 10% to MAIN. Growth pays 50% of the margin after the HC reserve, not 50% of the customer price. Studio uses its own residual. No guaranteed income.',
          },
          {
            q: 'How long does commission run?',
            a: 'Transaction-based commissions follow qualifying paid referred usage. Subscription commission continues for each qualifying paid period while a valid origin exists and the subscription remains paid, as described in your affiliate terms. No guaranteed income.',
          },
          {
            q: 'Does commission stop after one calendar year?',
            a: 'A valid original partner relationship does not stop merely because a calendar year has passed. Commission is generated when qualifying paid revenue exists and that product’s commission rules say the revenue is eligible. HomeCheff may change rates or terms with notice as set out in your agreement. No guaranteed income.',
          },
          {
            q: 'Can partnership models expand over time?',
            a: 'Possibly. HomeCheff may evolve partnership structures over time. Any changes are communicated clearly in advance and reflected in your affiliate terms.',
          },
          {
            q: 'When do I get paid?',
            a: 'Eligible commissions are tracked in your dashboard: pending for 14 days, then available. Payouts go through Stripe Connect under the payout rules in your dashboard, after onboarding.',
          },
          {
            q: 'Can I create my own discount codes?',
            a: 'Yes. Main affiliates can create promo codes for business subscriptions; discounts come from your commission share, not from HomeCheff’s fixed platform share, within the limits shown in your dashboard.',
          },
          {
            q: 'Can I promote internationally?',
            a: 'You can share your link globally; where users can sign up and transact depends on HomeCheff availability and local rules. Always follow honest, compliant marketing.',
          },
          {
            q: 'Do I need to be a seller on HomeCheff?',
            a: 'No. Affiliates are separate from selling on the marketplace. Many partners are creators, community organisers, or agencies who do not list products themselves.',
          },
          {
            q: 'What is recurring commission?',
            a: 'Commission can recur on each qualifying paid period while the customer keeps paying and your partner relationship stays valid. The percentage depends on the product. A calendar year does not by itself stop it. No guaranteed income.',
          },
          {
            q: 'How does Stripe Connect work here?',
            a: 'Stripe Connect handles identity, compliance, and payouts to your bank account. You complete onboarding in the affiliate dashboard before receiving payouts.',
          },
          {
            q: 'Can I use multiple links or channels?',
            a: 'You have one primary referral link; you may share it across channels (social, email, QR, events). Promo codes are an additional tool for business subscriptions.',
          },
          {
            q: 'What am I allowed to promote?',
            a: 'Promote HomeCheff as a local community marketplace for homemade food, garden, and handmade creations. No misleading income claims, no spam, and respect platform and advertising rules.',
          },
        ]
      : [
          {
            q: 'Hoe werkt het HomeCheff-affiliateprogramma?',
            a: 'Je krijgt een persoonlijke referral-link en optioneel promocodes. Als mensen via jouw attributie joinen of een zakelijk abonnement afsluiten, verdien je een deel van platformfees of abonnementsgelden gedurende de in de voorwaarden beschreven periode, uitbetaald via Stripe Connect.',
          },
          {
            q: 'Hoeveel commissie kan ik verdienen?',
            a: 'Bij Marketplace-bestellingen is de affiliatepool maximaal 50% van de HomeCheff-platformfee, niet van het orderbedrag. Eén affiliate kan de hele pool krijgen. Twee verschillende affiliates delen 25% + 25%. Een zakelijk Marketplace-abonnement kan 50% van de abonnementsfee opleveren, of 40% voor SUB en 10% voor MAIN. Growth betaalt 50% van de marge na de HC-reserve, niet 50% van de klantprijs. Studio rekent over een eigen restant. Geen gegarandeerd inkomen.',
          },
          {
            q: 'Hoe lang loopt commissie?',
            a: 'Transactiecommissie volgt kwalificerende betaalde omzet van door jou aangebrachte gebruikers. Abonnementscommissie loopt per kwalificerende betaalde periode zolang een geldige herkomst bestaat en het abonnement betaald blijft, zoals in je affiliatevoorwaarden staat. Geen gegarandeerd inkomen.',
          },
          {
            q: 'Stopt commissie na één kalenderjaar?',
            a: 'Een geldige oorspronkelijke partnerrelatie stopt niet alleen omdat er een kalenderjaar voorbij is. Commissie ontstaat wanneer er kwalificerende betaalde omzet is en de commissieregels van dat product die omzet als eligible zien. Tarieven of voorwaarden kunnen wijzigen met kennisgeving zoals in je overeenkomst. Geen gegarandeerd inkomen.',
          },
          {
            q: 'Kunnen samenwerkingen later uitbreiden?',
            a: 'Dat kan. HomeCheff kan partnermodellen in de toekomst uitbreiden. Eventuele wijzigingen communiceren we vooraf en leggen we vast in de affiliatevoorwaarden.',
          },
          {
            q: 'Wanneer krijg ik uitbetaald?',
            a: 'Commissies zie je in je dashboard: eerst 14 dagen pending, daarna beschikbaar. Uitbetalen gaat via Stripe Connect volgens de uitbetalingsregels in je dashboard, na onboarding.',
          },
          {
            q: 'Kan ik eigen kortingscodes maken?',
            a: 'Ja. Hoofd-affiliates kunnen promocodes voor zakelijke abonnementen maken; korting gaat uit jouw commissiedeel, niet uit het vaste platformdeel van HomeCheff, binnen de limieten in je dashboard.',
          },
          {
            q: 'Kan ik internationaal promoten?',
            a: 'Je mag je link wereldwijd delen; waar mensen zich kunnen registreren en transacties doen hangt af van beschikbaarheid en lokale regels. Houd marketing eerlijk en compliant.',
          },
          {
            q: 'Moet ik verkoper zijn op HomeCheff?',
            a: 'Nee. Affiliate zijn is los van verkopen op de marktplaats. Veel partners zijn creators, communitybeheerders of agencies zonder eigen aanbod.',
          },
          {
            q: 'Hoe werkt terugkerende commissie?',
            a: 'Zolang jouw aangebrachte klant kwalificerende betaalde producten gebruikt, ontvang je volgens de commissieregels van het betreffende product terugkerende commissie. Geen gegarandeerd inkomen.',
          },
          {
            q: 'Hoe werkt Stripe Connect hier?',
            a: 'Stripe Connect regelt identiteit, compliance en uitbetaling naar je bankrekening. Je rondt onboarding af in het affiliate-dashboard voordat uitbetalingen starten.',
          },
          {
            q: 'Kan ik meerdere links of kanalen gebruiken?',
            a: 'Je hebt één primaire referral-link; je deelt die op social, mail, QR of events. Promocodes zijn een extra instrument voor zakelijke abonnementen.',
          },
          {
            q: 'Wat mag ik promoten?',
            a: 'HomeCheff als lokale community-marktplaats voor thuisgemaakt eten, tuin en creaties. Geen misleidende inkomensclaims, geen spam, respecteer platform- en reclameregels.',
          },
        ];

  const mainEntity = pairs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
