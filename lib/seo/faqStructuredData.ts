import { getPlatformDefinition } from './platform-definition';

/** Curated FAQPage entities for JSON-LD (server-only; matches /faq themes). */
export function getFaqPageJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const def = getPlatformDefinition(lang);
  const pairs =
    lang === 'en'
      ? [
          {
            q: 'What is HomeCheff?',
            a: def.faqWhatIsHomeCheff,
          },
          {
            q: 'What is the Village Square (Dorpsplein)?',
            a: 'The Village Square is where you discover what local makers and neighbours offer nearby — food, garden, creations, services and help — with profiles for trust. The person behind the offer is always visible.',
          },
          {
            q: 'What are HomeCheff Points (HCP)?',
            a: 'HCP reward constructive participation such as quality listings, orders, reviews, and community activity. They also power friendly leaderboards.',
          },
          {
            q: 'How do I offer from home on HomeCheff?',
            a: 'Create a profile, choose a category (food, garden, creations or services), add listings with clear photos, and receive payouts via Stripe Connect when you use HomeCheff Checkout.',
          },
          {
            q: 'How do payouts and agreements work?',
            a: 'Buyers can pay via HomeCheff Checkout when available, or arrange directly, barter or make a proposal. Payout timing for checkout depends on your account history and Stripe rules.',
          },
        ]
      : [
          {
            q: 'Wat is HomeCheff?',
            a: def.faqWhatIsHomeCheff,
          },
          {
            q: 'Wat is het Dorpsplein?',
            a: 'Het Dorpsplein is waar je ontdekt wat lokale makers en buren bij jou in de buurt aanbieden — eten, tuin, creaties, diensten en hulp — met profielen voor vertrouwen. De persoon achter het aanbod is altijd zichtbaar.',
          },
          {
            q: 'Wat zijn HomeCheff Points (HCP)?',
            a: 'HCP belonen constructieve deelname zoals duidelijke aanbiedingen, bestellingen, reviews en community-activiteit. Ze voeden ook vriendelijke ranglijsten.',
          },
          {
            q: 'Hoe bied ik iets aan op HomeCheff?',
            a: 'Maak een profiel aan, kies een categorie (eten, tuin, creaties of diensten), voeg aanbiedingen met foto’s toe, en ontvang uitbetalingen via Stripe Connect bij HomeCheff Checkout.',
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
