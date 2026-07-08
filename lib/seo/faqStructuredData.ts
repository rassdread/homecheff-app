/** Curated FAQPage entities for JSON-LD (server-only; matches /faq themes). */
export function getFaqPageJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const pairs =
    lang === 'en'
      ? [
          {
            q: 'What is HomeCheff?',
            a: 'HomeCheff is a local craft, exchange and community platform. Neighbours offer and discover food, garden harvest, creations, services and help — with secure checkout, direct contact, barter or proposals.',
          },
          {
            q: 'What is the Village Square (Dorpsplein)?',
            a: 'The Village Square is your local marketplace feed to discover what makers and neighbours offer nearby — products, services and help — with filters and profiles for trust and transparency.',
          },
          {
            q: 'What are HomeCheff Points (HCP)?',
            a: 'HCP reward constructive participation such as quality listings, orders, reviews, and community activity. They also power friendly leaderboards.',
          },
          {
            q: 'How do I offer from home on HomeCheff?',
            a: 'Create a seller profile, choose a category (food, garden, creations or services), add listings with clear photos, and receive payouts via Stripe Connect when you use HomeCheff Checkout.',
          },
          {
            q: 'How do payouts and agreements work?',
            a: 'Buyers can pay via HomeCheff Checkout when available, or arrange directly, barter or make a proposal. Payout timing for checkout depends on your account history and Stripe rules.',
          },
        ]
      : [
          {
            q: 'Wat is HomeCheff?',
            a: 'HomeCheff is een lokaal platform voor vakmanschap, waarde-uitwisseling en community. Buurtgenoten bieden en ontdekken eten, tuinoogst, creaties, diensten en hulp — met veilig afrekenen, direct contact, ruil of voorstellen.',
          },
          {
            q: 'Wat is het Dorpsplein?',
            a: 'Het Dorpsplein is je lokale marktplaats-feed om te zien wat makers en buren bij jou in de buurt aanbieden — producten, diensten en hulp — met filters en profielen voor vertrouwen.',
          },
          {
            q: 'Wat zijn HomeCheff Points (HCP)?',
            a: 'HCP belonen constructieve deelname zoals duidelijke aanbiedingen, bestellingen, reviews en community-activiteit. Ze voeden ook vriendelijke ranglijsten.',
          },
          {
            q: 'Hoe bied ik iets aan op HomeCheff?',
            a: 'Maak een verkopersprofiel, kies een categorie (eten, tuin, creaties of diensten), voeg aanbiedingen met foto’s toe, en ontvang uitbetalingen via Stripe Connect bij HomeCheff Checkout.',
          },
          {
            q: 'Hoe werken uitbetalingen en afspraken?',
            a: 'Kopers kunnen via HomeCheff Checkout betalen waar beschikbaar, of direct afspreken, ruilen of een voorstel doen. Uitbetalingstermijn bij checkout hangt af van je accountgeschiedenis en Stripe-regels.',
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
