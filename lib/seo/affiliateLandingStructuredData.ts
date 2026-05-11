/** FAQPage JSON-LD for /affiliate — short answers for crawlers; full copy lives in i18n on the page. */
export function getAffiliateLandingFaqJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const pairs =
    lang === 'en'
      ? [
          {
            q: 'How does the HomeCheff affiliate program work?',
            a: 'You get a personal referral link and optional promo codes. When people join or subscribe via your attribution, you earn a share of platform fees or subscriptions for a defined period, with weekly payouts through Stripe Connect.',
          },
          {
            q: 'How much commission can I earn?',
            a: 'Up to 25% of the HomeCheff fee per transaction for each referred buyer or seller, and up to 50% when you refer both sides of a transaction. For referred business subscriptions, you can earn up to 50% of the subscription fee for up to 12 months per business, within the program rules.',
          },
          {
            q: 'How long does commission run?',
            a: 'Transaction-based commissions follow active referred usage. The standard subscription model runs per referred business for up to twelve months while the subscription remains active, as described in your affiliate terms.',
          },
          {
            q: 'What happens after 12 months?',
            a: 'The first twelve months are guaranteed under the current commission model per active referred business subscription. After that, the partnership may be extended or expanded through future incentives, performance milestones, and community goals — without a promise of lifetime payouts. HomeCheff may change rates or terms with notice as set out in your agreement.',
          },
          {
            q: 'Can partnership models expand over time?',
            a: 'Possibly. HomeCheff may evolve partnership structures over time. Any changes are communicated clearly in advance and reflected in your affiliate terms.',
          },
          {
            q: 'When do I get paid?',
            a: 'Eligible commissions are tracked in your dashboard and paid out on a weekly rhythm via Stripe Connect, subject to verification and minimum payout rules.',
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
            a: 'For subscriptions you refer, you can receive a recurring share of the subscription fee each month the business stays subscribed, for up to twelve months per referred business under the standard model, as defined in your affiliate terms.',
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
            a: 'Je krijgt een persoonlijke referral-link en optioneel promocodes. Als mensen via jouw attributie joinen of een zakelijk abonnement afsluiten, verdien je een deel van platformfees of abonnementsgelden gedurende de in de voorwaarden beschreven periode, met wekelijkse uitbetaling via Stripe Connect.',
          },
          {
            q: 'Hoeveel commissie kan ik verdienen?',
            a: 'Tot 25% van de HomeCheff-fee per transactie per aangebrachte koper of verkoper, en tot 50% als je beide kanten van een transactie aanbrengt. Voor zakelijke abonnementen kan dat tot 50% van het abonnementsbedrag zijn, tot twaalf maanden per bedrijf, volgens programmaregels.',
          },
          {
            q: 'Hoe lang loopt commissie?',
            a: 'Transactiecommissie volgt actief gebruik van door jou aangebrachte gebruikers. Het standaardmodel voor abonnementscommissie loopt per aangebracht bedrijf tot twaalf maanden zolang het abonnement actief is, zoals in je affiliatevoorwaarden staat.',
          },
          {
            q: 'Wat gebeurt er na 12 maanden?',
            a: 'De eerste twaalf maanden zijn gegarandeerd binnen het huidige commissiemodel per actief aangebracht bedrijfsabonnement. Daarna kan de samenwerking verlengd of uitgebreid worden met toekomstige incentives, prestaties en community-doelen — zonder belofte op lifetime-uitbetalingen. Tarieven of voorwaarden kunnen wijzigen met kennisgeving zoals in je overeenkomst.',
          },
          {
            q: 'Kunnen samenwerkingen later uitbreiden?',
            a: 'Dat kan. HomeCheff kan partnermodellen in de toekomst uitbreiden. Eventuele wijzigingen communiceren we vooraf en leggen we vast in de affiliatevoorwaarden.',
          },
          {
            q: 'Wanneer krijg ik uitbetaald?',
            a: 'Rechte commissies zie je in je dashboard en worden wekelijks uitbetaald via Stripe Connect, afhankelijk van verificatie en minimumuitbetalingsregels.',
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
            a: 'Voor door jou aangebrachte zakelijke abonnementen ontvang je binnen het standaardmodel maandelijks een deel van het abonnementsbedrag zolang het bedrijf actief geabonneerd blijft, tot twaalf maanden per bedrijf, zoals in je affiliatevoorwaarden staat.',
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
