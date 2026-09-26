export type PropositionFaq = { q: string; a: string };

export function affiliatePropositionFaqs(lang: 'nl' | 'en'): PropositionFaq[] {
  if (lang === 'en') {
    return [
      {
        q: 'When do I receive commission?',
        a: 'When a customer you referred makes qualifying paid use of a HomeCheff service. No qualifying payment means no commission. A refund can reverse the commission on that transaction.',
      },
      {
        q: 'How long can I keep earning from a customer?',
        a: 'For as long as that customer keeps using qualifying paid HomeCheff products. If they stay qualifying for 2, 5 or 20 years, commission can continue through that period under that product’s rules. There is no guaranteed income.',
      },
      {
        q: 'Do I start over every month?',
        a: 'No. Customers who remain qualifying can keep contributing. New customers can be added on top. The first months can still be modest.',
      },
      {
        q: 'Do I need a company?',
        a: 'No. You can start as a person. A company path exists for teams and campaigns. Affiliate participation is not employment, a salary or a franchise.',
      },
      {
        q: 'Can commission grow over time?',
        a: 'It can, if you keep acquiring customers, those customers stay qualifying, and they use eligible products. Time by itself does not increase the amount.',
      },
      {
        q: 'What if my customer still uses HomeCheff after two years?',
        a: 'If that customer still generates qualifying paid activity, that activity can still create commission under the rules of that product.',
      },
      {
        q: 'Can I promote several HomeCheff services?',
        a: 'An existing customer can later use another eligible product, such as Growth, Marketplace or Studio. Commission can arise there under that product’s own rules. Not every product qualifies.',
      },
      {
        q: 'How do promo codes work?',
        a: 'You get your own affiliate link. For Growth and for Marketplace business subscriptions you can create a promo code where the dashboard offers it. The discount comes from your share. Not every product has a promo code.',
      },
      {
        q: 'Can I invite other partners?',
        a: 'Where the partner network is open, an active affiliate without a parent can invite one sub-affiliate from the dashboard. You receive the MAIN share on their qualifying revenue. A SUB cannot invite another layer. MAIN/SUB is not the starting point for a new affiliate.',
      },
      {
        q: 'Can I build HomeCheff in another country?',
        a: 'If HomeCheff is not fully active in that country yet, you can send an interest request. That request is not an approval and does not activate the country.',
      },
      {
        q: 'Can I earn €10,000 or €20,000 a month?',
        a: 'Those amounts are scenarios, not a promise. The catalog and the example show how many qualifying Growth Starter customers that would require at the current commission. A large successful portfolio can reach thousands of euros a month only if the assumptions hold.',
      },
    ];
  }
  return [
      {
        q: 'Wanneer krijg ik commissie?',
        a: 'Wanneer een klant die jij hebt aangebracht kwalificerend betaald gebruikmaakt van een HomeCheff-dienst. Geen kwalificerende betaling, geen commissie. Een terugbetaling kan de commissie op die transactie terugdraaien.',
      },
      {
        q: 'Hoe lang kan ik aan een klant blijven verdienen?',
        a: 'Zolang die klant kwalificerende betaalde HomeCheff-producten blijft gebruiken. Blijft die klant 2, 5 of 20 jaar kwalificerend actief, dan kan de commissie gedurende die periode blijven doorlopen volgens de regels van dat product. Geen gegarandeerd inkomen.',
      },
    {
      q: 'Begin ik iedere maand opnieuw?',
      a: 'Nee. Klanten die kwalificerend blijven, kunnen blijven meetellen. Nieuwe klanten kunnen daar bovenop komen. De eerste maanden kunnen nog bescheiden zijn.',
    },
      {
        q: 'Moet ik een bedrijf hebben?',
        a: 'Nee. Je kunt als persoon starten. Er is een bedrijfsroute voor teams en campagnes. Affiliate-deelname is geen dienstverband, salaris of franchise.',
      },
    {
      q: 'Kan mijn commissie in de loop van de tijd groeien?',
      a: 'Dat kan, als je klanten blijft aanbrengen, die klanten kwalificerend blijven en in aanmerking komende producten gebruiken. De tijd zelf laat het bedrag niet stijgen.',
    },
    {
      q: 'Wat gebeurt er als mijn klant na twee jaar nog steeds HomeCheff gebruikt?',
      a: 'Blijft die klant kwalificerende betaalde activiteit genereren, dan kan daar volgens de regels van dat product nog steeds commissie uit ontstaan.',
    },
    {
      q: 'Kan ik meerdere HomeCheff-diensten promoten?',
      a: 'Een bestaande klant kan later ook een ander in aanmerking komend product gebruiken, zoals Growth, Marketplace of Studio. Ook daar kan commissie ontstaan volgens de regels van dat product. Niet elk product kwalificeert.',
    },
      {
        q: 'Hoe werken promotiecodes?',
        a: 'Je krijgt een eigen affiliatelink. Voor Growth en voor zakelijke Marketplace-abonnementen kun je een actiecode maken waar het dashboard dat aanbiedt. De korting komt uit jouw deel. Niet elk product heeft een actiecode.',
      },
      {
        q: 'Kan ik andere partners uitnodigen?',
        a: 'Waar het partnernetwerk openstaat, kan een actieve affiliate zonder parent vanuit het dashboard één sub-affiliate uitnodigen. Jij ontvangt het main-aandeel op hun kwalificerende omzet. Een SUB kan zelf geen laag daaronder uitnodigen. MAIN/SUB is niet het startpunt voor een nieuwe affiliate.',
      },
      {
        q: 'Kan ik HomeCheff in een ander land opbouwen?',
      a: 'Als HomeCheff in dat land nog niet volledig actief is, kun je je interesse doorgeven. Die aanvraag is geen goedkeuring en activeert het land niet.',
    },
    {
      q: 'Kan ik €10.000 of €20.000 per maand verdienen?',
      a: 'Dat zijn scenario’s, geen belofte. De catalogus en het voorbeeld laten zien hoeveel kwalificerende Growth Starter-klanten daar bij de huidige commissie voor nodig zijn. Bij een grote succesvolle portefeuille kunnen duizenden euro’s per maand ontstaan, alleen als die aannames kloppen.',
    },
  ];
}
