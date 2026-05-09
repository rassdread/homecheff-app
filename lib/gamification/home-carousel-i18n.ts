/**
 * Server-side copy for homepage carousel (NL/EN). HCP terminology only; cautious promo wording.
 */
export type CarouselLang = 'nl' | 'en';

export function carouselStrings(lang: CarouselLang) {
  const L = lang === 'en';
  return {
    rankWeekWorld: {
      title: L ? '🏆 Top this week' : '🏆 Top deze week',
      subtitle: L ? 'Worldwide · top 5 by HCP this week' : 'Wereldwijd · top 5 op HCP deze week',
    },
    rankMonthWorld: {
      title: L ? '🌍 Worldwide this month' : '🌍 Wereldwijd deze maand',
      subtitle: L ? 'Top 5 monthly worldwide' : 'Top 5 wereldwijd deze maand',
    },
    rankNearby: {
      title: L ? '📍 Near you' : '📍 In jouw buurt',
      subtitle: L
        ? 'Approx. radius · top 5 near your profile area'
        : 'Ruwe straal · top 5 bij je profielzone (geen exacte locatie)',
    },
    rankRisers: {
      title: L ? '🔥 Biggest climbers' : '🔥 Grootste stijgers',
      subtitle: L ? 'Largest HCP gain vs last week (top 5)' : 'Grootste HCP-stijging t.o.v. vorige week (top 5)',
    },
    rankYearWorld: {
      title: L ? '👑 Year ranking' : '👑 Jaar ranking',
      subtitle: L ? 'Top creators this year (HCP)' : 'Top makers dit jaar (HCP)',
    },
    spotlightWeek: {
      title: L ? 'Creator of the week' : 'Maker van de week',
      reason: L ? 'Leading this week on HCP' : 'Deze week voorop op HCP',
    },
    spotlightRiser: {
      title: L ? 'Trending climber' : 'Trending stijger',
      reason: L ? 'Strong HCP growth vs last week' : 'Sterke HCP-groei t.o.v. vorige week',
    },
    spotlightNew: {
      title: L ? 'New talent' : 'Nieuw talent',
      reason: L ? 'Fresh maker · already in the weekly mix' : 'Nieuwe maker · al in de weekmix',
    },
    spotlightFallback: {
      title: L ? 'You could be featured here' : 'Jij kunt hier staan',
      subtitle: L
        ? 'Stay active with HomeCheff Points — spotlights rotate automatically.'
        : 'Blijf actief met HomeCheff Points — spotlights wisselen automatisch.',
    },
    promoJoin: {
      title: L ? 'Join HomeCheff Points' : 'Doe mee met HomeCheff Points',
      subtitle: L
        ? 'Complete missions and climb the boards — visibility may grow over time.'
        : 'Voltooi missies en klim mee — zichtbaarheid kan in de loop van tijd groeien.',
      cta: L ? 'Open Mijn HCP' : 'Open Mijn HCP',
    },
    promoLocal: {
      title: L ? 'Show up near you' : 'Word zichtbaar in jouw buurt',
      subtitle: L
        ? 'Add an approximate area on your profile — nearby boards use rough radius only.'
        : 'Zet een ruwe zone op je profiel — buurtboards gebruiken alleen een ruwe straal.',
      cta: L ? 'Profile' : 'Profiel',
    },
    promoBadges: {
      title: L ? 'Earn badges' : 'Verdien badges',
      subtitle: L
        ? 'Badges reflect activity — they can unlock extra flair over time.'
        : 'Badges tonen activiteit — ze kunnen later extra flair geven.',
      cta: L ? 'My HCP' : 'Mijn HCP',
    },
    promoInspire: {
      title: L ? 'Share inspiration' : 'Plaats inspiratie',
      subtitle: L
        ? 'Dishes and moments help the community discover you.'
        : 'Gerechten en momenten helpen anderen jou te ontdekken.',
      cta: L ? 'New inspiration' : 'Nieuwe inspiratie',
    },
    promoFuture: {
      title: L ? 'Rewards & visibility' : 'Beloningen & zichtbaarheid',
      /** Langere tekst o.a. voor ranglijst-promo endpoint. */
      subtitle: L
        ? 'Rewards are processed automatically once you meet the conditions. This can include extra visibility, badges, profile boosts, spotlight placements or promotions in the HCP screens. HCP does not include fixed cash prizes or automatic payouts unless HomeCheff communicates this separately in advance.'
        : 'Beloningen worden automatisch verwerkt zodra je aan de voorwaarden voldoet. Denk aan extra zichtbaarheid, badges, profielboosts, spotlight-plekken of promoties in de HCP-schermen. Er zijn geen vaste geldprijzen of automatische uitbetalingen gekoppeld aan HCP, tenzij HomeCheff dat apart en vooraf communiceert.',
      /** Homepage-carousel (compact). */
      subtitleShort: L
        ? 'Processed automatically when you qualify — badges, boosts & spotlights. No fixed cash prizes unless announced.'
        : 'Automatisch bij voorwaarden: badges, boosts en spotlights. Geen vaste geldprijzen tenzij vooraf bekend.',
      cta: L ? 'Leaderboards' : 'Ranglijsten',
    },
  };
}
