export type PropositionFaq = { q: string; a: string };

export function affiliatePropositionFaqs(lang: 'nl' | 'en'): PropositionFaq[] {
  if (lang === 'en') {
    return [
      {
        q: 'What do I build as a HomeCheff affiliate?',
        a: 'Your own customer portfolio inside the HomeCheff ecosystem: customers you introduce, your own promo tools where a product supports them, and recurring qualifying commission. You do not own HomeCheff.',
      },
      {
        q: 'How long can I receive commission?',
        a: 'For as long as a customer you referred keeps using qualifying paid HomeCheff products. A customer you refer today can remain part of your portfolio for years. If they stay qualifying for 2, 5 or 20 years, commission can continue through that period under that product’s rules.',
      },
      {
        q: 'Do I start over every month?',
        a: 'No. Customers who remain qualifying can keep contributing. New customers can be added on top. The first months can still be modest.',
      },
      {
        q: 'Can I do this alongside a job?',
        a: 'Yes. You can start with a few hours a week alongside your current work. Hours do not equal a fixed number of customers or a fixed income.',
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
        q: 'What if my customer uses several HomeCheff products?',
        a: 'An existing customer can later use another eligible product, such as Growth, Marketplace or Studio. Commission can arise there under that product’s own rules. Not every product qualifies.',
      },
      {
        q: 'Can I use my own promo codes?',
        a: 'You get your own affiliate link. For Growth and for Marketplace business subscriptions you can create a promo code where the dashboard offers it. The discount comes from your share. Not every product has a promo code.',
      },
      {
        q: 'Can I build other affiliates?',
        a: 'An active affiliate without a parent can invite one sub-affiliate from the dashboard. That sub builds their own portfolio. You receive the main share on their qualifying revenue. A sub cannot invite another layer.',
      },
      {
        q: 'Can I help build HomeCheff in another country?',
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
      q: 'Wat bouw ik op als HomeCheff-affiliate?',
      a: 'Je eigen klantenportefeuille binnen het HomeCheff-ecosysteem: klanten die jij aanbrengt, je eigen promotiemiddelen waar een product dat ondersteunt, en terugkerende kwalificerende commissie. Je wordt geen eigenaar van HomeCheff.',
    },
    {
      q: 'Hoe lang kan ik commissie ontvangen?',
      a: 'Zolang een klant die jij hebt aangebracht kwalificerende betaalde HomeCheff-producten blijft gebruiken. Een klant die je vandaag aanbrengt, kan jaren onderdeel blijven van je portefeuille. Blijft die klant 2, 5 of 20 jaar kwalificerend actief, dan kan de commissie gedurende die periode blijven doorlopen volgens de regels van dat product.',
    },
    {
      q: 'Begin ik iedere maand opnieuw?',
      a: 'Nee. Klanten die kwalificerend blijven, kunnen blijven meetellen. Nieuwe klanten kunnen daar bovenop komen. De eerste maanden kunnen nog bescheiden zijn.',
    },
    {
      q: 'Kan ik dit naast mijn baan doen?',
      a: 'Ja. Je kunt bijvoorbeeld een paar uur per week naast je huidige werk beginnen. Uren staan niet gelijk aan een vast aantal klanten of een vast inkomen.',
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
      q: 'Wat gebeurt er als mijn klant meerdere HomeCheff-producten gebruikt?',
      a: 'Een bestaande klant kan later ook een ander in aanmerking komend product gebruiken, zoals Growth, Marketplace of Studio. Ook daar kan commissie ontstaan volgens de regels van dat product. Niet elk product kwalificeert.',
    },
    {
      q: 'Kan ik mijn eigen promocodes gebruiken?',
      a: 'Je krijgt een eigen affiliatelink. Voor Growth en voor zakelijke Marketplace-abonnementen kun je een actiecode maken waar het dashboard dat aanbiedt. De korting komt uit jouw deel. Niet elk product heeft een actiecode.',
    },
    {
      q: 'Kan ik andere affiliates opbouwen?',
      a: 'Een actieve affiliate zonder parent kan vanuit het dashboard één sub-affiliate uitnodigen. Die sub bouwt een eigen portefeuille. Jij ontvangt het main-aandeel op hun kwalificerende omzet. Een sub kan zelf geen laag daaronder uitnodigen.',
    },
    {
      q: 'Kan ik HomeCheff in een ander land helpen opbouwen?',
      a: 'Als HomeCheff in dat land nog niet volledig actief is, kun je je interesse doorgeven. Die aanvraag is geen goedkeuring en activeert het land niet.',
    },
    {
      q: 'Kan ik €10.000 of €20.000 per maand verdienen?',
      a: 'Dat zijn scenario’s, geen belofte. De catalogus en het voorbeeld laten zien hoeveel kwalificerende Growth Starter-klanten daar bij de huidige commissie voor nodig zijn. Bij een grote succesvolle portefeuille kunnen duizenden euro’s per maand ontstaan, alleen als die aannames kloppen.',
    },
  ];
}
