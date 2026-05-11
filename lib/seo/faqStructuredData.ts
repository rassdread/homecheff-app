/** Curated FAQPage entities for JSON-LD (server-only; matches /faq themes). */
export function getFaqPageJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const pairs =
    lang === 'en'
      ? [
          {
            q: 'What is HomeCheff?',
            a: 'HomeCheff connects local makers with people nearby: homemade food, garden harvest, and handmade creations, with safe payments and chat on one platform.',
          },
          {
            q: 'What is the Village Square (Dorpsplein)?',
            a: 'The Village Square is your local marketplace feed to discover what makers near you sell today, with filters and profiles for trust and transparency.',
          },
          {
            q: 'What are HomeCheff Points (HCP)?',
            a: 'HCP reward constructive participation such as quality listings, orders, reviews, and community activity. They also power friendly leaderboards.',
          },
          {
            q: 'How do I sell from home on HomeCheff?',
            a: 'Create a seller profile, choose a role (kitchen, garden, or studio), add listings with clear photos and allergens, and receive payouts via Stripe Connect.',
          },
          {
            q: 'How do payouts and delivery work?',
            a: 'Buyers pay through Stripe; sellers ship or offer pickup as agreed in the listing. Payout timing depends on your account history and Stripe rules.',
          },
        ]
      : [
          {
            q: 'Wat is HomeCheff?',
            a: 'HomeCheff verbindt lokale makers met mensen in de buurt: thuisgemaakt eten, tuinoogst en creaties, met veilige betaling en chat op één platform.',
          },
          {
            q: 'Wat is het Dorpsplein?',
            a: 'Het Dorpsplein is je lokale marktplaats-feed om te zien wat makers bij jou in de buurt vandaag aanbieden, met filters en profielen voor vertrouwen.',
          },
          {
            q: 'Wat zijn HomeCheff Points (HCP)?',
            a: 'HCP belonen constructieve deelname zoals duidelijke aanbiedingen, bestellingen, reviews en community-activiteit. Ze voeden ook vriendelijke ranglijsten.',
          },
          {
            q: 'Hoe verkopen vanuit huis?',
            a: 'Maak een verkopersprofiel, kies een rol (keuken, tuin of atelier), voeg aanbiedingen met foto’s en allergenen toe, en ontvang uitbetalingen via Stripe Connect.',
          },
          {
            q: 'Hoe werken uitbetalingen en levering?',
            a: 'Kopers betalen via Stripe; verkopers bezorgen of halen af volgens de afspraak in de aanbieding. Uitbetalingstermijn hangt af van je accountgeschiedenis en Stripe-regels.',
          },
        ];

  const mainEntity = pairs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: a,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
