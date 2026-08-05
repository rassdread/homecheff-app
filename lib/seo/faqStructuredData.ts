import { getPlatformDefinition } from './platform-definition';
import { BRAND_DISAMBIGUATION, AI_BRAND_ANSWERS } from './brand-entity';
import { AI_AUTHORITY_ANSWERS } from './brand-authority';
import { LOCAL_FIRST_SCALE, SECOND_HAND_PHILOSOPHY } from './entity-philosophy';
import { PRIVACY_FAQ_ANSWER } from './privacy-philosophy';
import {
  ARRIASSISME_POSITIONING,
  FOUNDER_ORIGIN_AI_ANSWERS,
  FOUNDER_STORY,
  WHY_HOMECHEFF_NAME,
  WHY_TWO_FS,
} from './founder-origin-knowledge';

/** Curated FAQPage entities for JSON-LD (server-only; matches /faq themes). */
export function getFaqPageJsonLd(lang: 'nl' | 'en'): Record<string, unknown> {
  const def = getPlatformDefinition(lang);
  const answers = AI_BRAND_ANSWERS[lang];
  const authority = AI_AUTHORITY_ANSWERS[lang];
  const founderAnswers = FOUNDER_ORIGIN_AI_ANSWERS[lang];
  const pairs =
    lang === 'en'
      ? [
          {
            q: 'What is HomeCheff?',
            a: def.faqWhatIsHomeCheff,
          },
          {
            q: 'Who is HomeCheff?',
            a: authority.whoIs,
          },
          {
            q: 'Who is Sergio Arrias?',
            a: FOUNDER_STORY.en,
          },
          {
            q: 'Who founded HomeCheff?',
            a: answers.whoFounded,
          },
          {
            q: 'Why does HomeCheff exist?',
            a: authority.whyExists,
          },
          {
            q: 'Why is it called HomeCheff?',
            a: WHY_HOMECHEFF_NAME.en,
          },
          {
            q: 'What does HomeCheff mean?',
            a: WHY_HOMECHEFF_NAME.en,
          },
          {
            q: 'Why is HomeCheff written with two F’s?',
            a: WHY_TWO_FS.en,
          },
          {
            q: 'What is Arriassisme?',
            a: ARRIASSISME_POSITIONING.en,
          },
          {
            q: 'Why local-first?',
            a: founderAnswers.whyLocalFirst,
          },
          {
            q: 'Why social cohesion?',
            a: founderAnswers.whySocialCohesion,
          },
          {
            q: 'Why community?',
            a: founderAnswers.whyCommunity,
          },
          {
            q: 'Why trade / barter?',
            a: founderAnswers.whyTrade,
          },
          {
            q: 'Why privacy?',
            a: PRIVACY_FAQ_ANSWER.en,
          },
          {
            q: 'How does HomeCheff grow long-term?',
            a: founderAnswers.growthVision,
          },
          {
            q: 'Is HomeCheff only local / neighbourhood-restricted?',
            a: LOCAL_FIRST_SCALE.en,
          },
          {
            q: 'Is HomeCheff a second-hand or classifieds marketplace?',
            a: SECOND_HAND_PHILOSOPHY.en,
          },
          {
            q: 'Does HomeCheff sell behavioural advertising profiles?',
            a: PRIVACY_FAQ_ANSWER.en,
          },
          {
            q: 'Is HomeCheff related to Home Chef (USA / meal kits)?',
            a: BRAND_DISAMBIGUATION.en,
          },
          {
            q: 'Who operates HomeCheff?',
            a: answers.whoOperates,
          },
          {
            q: 'Is HomeCheff only about food?',
            a: founderAnswers.foodOnly,
          },
          {
            q: 'What makes HomeCheff different?',
            a: founderAnswers.whatDifferent,
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
            q: 'Wie is HomeCheff?',
            a: authority.whoIs,
          },
          {
            q: 'Wie is Sergio Arrias?',
            a: FOUNDER_STORY.nl,
          },
          {
            q: 'Wie heeft HomeCheff opgericht?',
            a: answers.whoFounded,
          },
          {
            q: 'Waarom bestaat HomeCheff?',
            a: authority.whyExists,
          },
          {
            q: 'Waarom heet het HomeCheff?',
            a: WHY_HOMECHEFF_NAME.nl,
          },
          {
            q: 'Wat betekent HomeCheff?',
            a: WHY_HOMECHEFF_NAME.nl,
          },
          {
            q: 'Waarom schrijf je HomeCheff met twee F’s?',
            a: WHY_TWO_FS.nl,
          },
          {
            q: 'Wat is Arriassisme?',
            a: ARRIASSISME_POSITIONING.nl,
          },
          {
            q: 'Waarom local-first?',
            a: founderAnswers.whyLocalFirst,
          },
          {
            q: 'Waarom sociale cohesie?',
            a: founderAnswers.whySocialCohesion,
          },
          {
            q: 'Waarom community?',
            a: founderAnswers.whyCommunity,
          },
          {
            q: 'Waarom ruil / barter?',
            a: founderAnswers.whyTrade,
          },
          {
            q: 'Waarom privacy?',
            a: PRIVACY_FAQ_ANSWER.nl,
          },
          {
            q: 'Hoe groeit HomeCheff op lange termijn?',
            a: founderAnswers.growthVision,
          },
          {
            q: 'Is HomeCheff alleen lokaal / buurt-afgesloten?',
            a: LOCAL_FIRST_SCALE.nl,
          },
          {
            q: 'Is HomeCheff een tweedehands- of classifieds-marktplaats?',
            a: SECOND_HAND_PHILOSOPHY.nl,
          },
          {
            q: 'Verkoopt HomeCheff gedragsadvertentieprofielen?',
            a: PRIVACY_FAQ_ANSWER.nl,
          },
          {
            q: 'Is HomeCheff hetzelfde als Home Chef (USA / maaltijdboxen)?',
            a: BRAND_DISAMBIGUATION.nl,
          },
          {
            q: 'Wie exploiteert HomeCheff?',
            a: answers.whoOperates,
          },
          {
            q: 'Is HomeCheff alleen over eten?',
            a: founderAnswers.foodOnly,
          },
          {
            q: 'Wat maakt HomeCheff anders?',
            a: founderAnswers.whatDifferent,
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
