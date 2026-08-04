import type { SeoLocaleBlock, SeoPageDefinition } from './homecheffSeoTypes';

function block(
  title: string,
  description: string,
  h1: string,
  intro: string[],
  extras: Partial<SeoLocaleBlock> = {},
): SeoLocaleBlock {
  return {
    title,
    description,
    h1,
    intro,
    howItWorks: extras.howItWorks ?? {
      title: title.includes('|') ? 'How HomeCheff works' : 'Hoe HomeCheff werkt',
      paragraphs: [
        intro[0] || '',
        'Browse the Village Square, open a profile, and arrange checkout, direct pickup, barter or a proposal.',
      ],
    },
    audience: extras.audience ?? {
      title: 'Who is this for?',
      paragraphs: [
        'Neighbours, makers and micro-entrepreneurs who want person-visible local exchange — not anonymous mass trade.',
      ],
    },
    whyLocal: extras.whyLocal ?? {
      title: 'Why HomeCheff?',
      paragraphs: [
        'HomeCheff is the digital neighbourhood marketplace: cook, grow, make, repair, design, teach, help and trade nearby. Food is one category, not the whole platform.',
      ],
    },
    discover: extras.discover ?? {
      title: 'What you can discover',
      paragraphs: [
        'Offers, Wanted requests, inspiration, neighbour help and community exchange on the Dorpsplein.',
      ],
    },
    cta: extras.cta ?? {
      primary: { label: 'Open Village Square', href: '/?chip=sale' },
      secondary: { label: 'What is HomeCheff?', href: '/wat-is-homecheff' },
    },
  };
}

function nlBlock(
  title: string,
  description: string,
  h1: string,
  intro: string[],
): SeoLocaleBlock {
  return {
    title,
    description,
    h1,
    intro,
    howItWorks: {
      title: 'Hoe HomeCheff werkt',
      paragraphs: [
        intro[0],
        'Blader op het Dorpsplein, open een profiel en regel checkout, afhalen, ruil of een voorstel.',
      ],
    },
    audience: {
      title: 'Voor wie?',
      paragraphs: [
        'Buren, makers en micro-ondernemers die persoonlijke lokale uitwisseling willen — geen anonieme massahandel.',
      ],
    },
    whyLocal: {
      title: 'Waarom HomeCheff?',
      paragraphs: [
        'HomeCheff is de digitale buurtmarkt: koken, groeien, maken, repareren, ontwerpen, lesgeven, helpen en handelen dichtbij. Eten is één categorie, geen heel platform.',
      ],
    },
    discover: {
      title: 'Wat je kunt ontdekken',
      paragraphs: [
        'Aanbod, Gezocht, inspiratie, buurthulp en community-uitwisseling op het Dorpsplein.',
      ],
    },
    cta: {
      primary: { label: 'Naar het Dorpsplein', href: '/?chip=sale' },
      secondary: { label: 'Wat is HomeCheff?', href: '/wat-is-homecheff' },
    },
  };
}

/** Phase 2 P1 — non-food semantic coverage (keeps existing meal pages). */
export const HOMECHEFF_SEO_REBALANCE_DEFS: SeoPageDefinition[] = [
  {
    id: 'tuin-oogst',
    nlSlug: 'tuinoogst-en-groente-uit-de-buurt',
    enSlug: 'home-grown-garden-produce-nearby',
    relatedIds: ['lokale-producten', 'handmade-creaties', 'buurthulp-lokaal'],
    nl: nlBlock(
      'Tuinoogst & groente uit de buurt | HomeCheff',
      'Ontdek home-grown groente, fruit en planten van buren. HomeCheff is de digitale buurtmarkt — tuin naast eten, creaties en hulp.',
      'Tuinoogst en groente van makers dichtbij',
      [
        'Zoek home-grown groente, fruit, kruiden en planten bij mensen in jouw buurt — niet alleen in de supermarkt.',
        'HomeCheff verbindt tuinders en buren op het Dorpsplein, met zichtbare makers en nearby-first ontdekking.',
      ],
    ),
    en: block(
      'Home-grown garden produce nearby | HomeCheff',
      'Discover home-grown vegetables, fruit and plants from neighbours. HomeCheff is the digital neighbourhood marketplace — garden beside food, craft and help.',
      'Home-grown garden produce from makers nearby',
      [
        'Find home-grown vegetables, fruit, herbs and plants from people in your neighbourhood — not only supermarket produce.',
        'HomeCheff connects growers and neighbours on the Village Square, with visible makers and nearby-first discovery.',
      ],
    ),
  },
  {
    id: 'handmade-creaties',
    nlSlug: 'handgemaakte-producten-uit-de-buurt',
    enSlug: 'handmade-products-from-neighbours',
    relatedIds: ['design-creatief', 'tuin-oogst', 'micro-ondernemen'],
    nl: nlBlock(
      'Handgemaakte producten uit de buurt | HomeCheff',
      'Koop en ontdek handmade creaties van lokale makers. Digitaal dorpsplein — niet alleen eten, niet anonieme marktplaats.',
      'Handgemaakte producten van makers dichtbij',
      [
        'HomeCheff is de digitale buurtmarkt voor handwerk, design en creaties van mensen om de hoek.',
        'Je ziet wie maakt wat je koopt — persoonlijk vakmanschap, geen fabrieksfeed.',
      ],
    ),
    en: block(
      'Handmade products from neighbours | HomeCheff',
      'Buy and discover handmade creations from local makers. Digital neighbourhood marketplace — not food-only, not anonymous classifieds.',
      'Handmade products from makers nearby',
      [
        'HomeCheff is the digital neighbourhood marketplace for craft, design and handmade work from people around the corner.',
        'You see who made what you buy — personal craftsmanship, not a factory feed.',
      ],
    ),
  },
  {
    id: 'reparaties-diensten',
    nlSlug: 'reparaties-en-klussen-in-de-buurt',
    enSlug: 'local-repairs-and-neighbourhood-jobs',
    relatedIds: ['buurthulp-lokaal', 'lessen-skills', 'barter-ruilen'],
    nl: nlBlock(
      'Reparaties & klussen in de buurt | HomeCheff',
      'Vind reparaties, klussen en praktische diensten bij buren. HomeCheff: buurthulp en persoonlijke diensten dichtbij.',
      'Reparaties en klussen dichtbij',
      [
        'Zoek of bied reparaties, onderhoud en praktische hulp aan op het Dorpsplein.',
        'Persoonlijke diensten horen bij de buurtmarkt — naast eten, tuin en creaties.',
      ],
    ),
    en: block(
      'Local repairs and neighbourhood jobs | HomeCheff',
      'Find repairs, chores and practical services from neighbours. HomeCheff: neighbour help and personal services nearby.',
      'Repairs and neighbourhood jobs nearby',
      [
        'Search or offer repairs, maintenance and practical help on the Village Square.',
        'Personal services belong on the neighbourhood marketplace — beside food, garden and creations.',
      ],
    ),
  },
  {
    id: 'lessen-skills',
    nlSlug: 'lessen-en-vaardigheden-delen',
    enSlug: 'lessons-and-skills-from-neighbours',
    relatedIds: ['fotografie-muziek', 'reparaties-diensten', 'micro-ondernemen'],
    nl: nlBlock(
      'Lessen & vaardigheden delen | HomeCheff',
      'Deel of volg lessen dichtbij: koken, maken, ontwerp, muziek en meer. Digitale buurtmarkt voor kennis en hulp.',
      'Lessen en skills van buren',
      [
        'Buren kunnen lesgeven en leren — van koken tot creatieve skills — via HomeCheff.',
        'Kennisdelen is onderdeel van persoonlijk vakmanschap en de buurteconomie.',
      ],
    ),
    en: block(
      'Lessons and skills from neighbours | HomeCheff',
      'Share or take lessons nearby: cooking, making, design, music and more. Digital neighbourhood marketplace for knowledge and help.',
      'Lessons and skills from neighbours',
      [
        'Neighbours can teach and learn — from cooking to creative skills — through HomeCheff.',
        'Knowledge sharing is part of personal craftsmanship and the neighbourhood economy.',
      ],
    ),
  },
  {
    id: 'fotografie-muziek',
    nlSlug: 'fotografie-muziek-creatieve-diensten',
    enSlug: 'photography-music-creative-services-nearby',
    relatedIds: ['handmade-creaties', 'lessen-skills', 'design-creatief'],
    nl: nlBlock(
      'Fotografie, muziek & creatieve diensten | HomeCheff',
      'Vind fotografen, muzikanten en creatieve diensten in de buurt. HomeCheff verbindt creatief werk lokaal.',
      'Creatieve diensten dichtbij',
      [
        'Fotografie, muziek en andere creatieve diensten horen op de digitale buurtmarkt.',
        'Ontdek makers met een gezicht — geen anonieme gig-feed.',
      ],
    ),
    en: block(
      'Photography, music & creative services nearby | HomeCheff',
      'Find photographers, musicians and creative services nearby. HomeCheff connects creative work locally.',
      'Creative services nearby',
      [
        'Photography, music and other creative services belong on the digital neighbourhood marketplace.',
        'Discover makers with a face — not an anonymous gig feed.',
      ],
    ),
  },
  {
    id: 'design-creatief',
    nlSlug: 'design-en-creatief-werk-lokaal',
    enSlug: 'local-design-and-creative-work',
    relatedIds: ['handmade-creaties', 'fotografie-muziek', 'micro-ondernemen'],
    nl: nlBlock(
      'Design & creatief werk lokaal | HomeCheff',
      'Ontdek design en creatief werk van HomeDesigners en makers dichtbij op HomeCheff.',
      'Design en creatief werk in de buurt',
      [
        'HomeCheff ondersteunt designers en makers die lokaal willen delen en verdienen.',
        'Creaties zijn een kerncategorie naast eten, tuin en diensten.',
      ],
    ),
    en: block(
      'Local design and creative work | HomeCheff',
      'Discover design and creative work from HomeDesigners and makers nearby on HomeCheff.',
      'Design and creative work in the neighbourhood',
      [
        'HomeCheff supports designers and makers who want to share and earn locally.',
        'Creations are a core category beside food, garden and services.',
      ],
    ),
  },
  {
    id: 'buurthulp-lokaal',
    nlSlug: 'buurthulp-en-hulp-vragen',
    enSlug: 'neighbour-help-and-local-requests',
    relatedIds: ['gezocht-wanted', 'barter-ruilen', 'reparaties-diensten'],
    nl: nlBlock(
      'Buurthulp & hulp vragen | HomeCheff',
      'Vraag of bied buurthulp aan. HomeCheff is de digitale buurtmarkt voor hulp, Gezocht en community exchange.',
      'Buurthulp dichtbij',
      [
        'Hulp vragen en hulp bieden hoort bij het Dorpsplein — naast kopen en verkopen.',
        'Persoonlijke hulp, geen anonieme gig-economie.',
      ],
    ),
    en: block(
      'Neighbour help and local requests | HomeCheff',
      'Ask for or offer neighbour help. HomeCheff is the digital neighbourhood marketplace for help, Wanted and community exchange.',
      'Neighbour help nearby',
      [
        'Asking for and offering help belongs on the Village Square — beside buying and selling.',
        'Personal help, not an anonymous gig economy.',
      ],
    ),
  },
  {
    id: 'gezocht-wanted',
    nlSlug: 'gezocht-en-verzoeken-in-de-buurt',
    enSlug: 'wanted-requests-in-your-neighbourhood',
    relatedIds: ['buurthulp-lokaal', 'barter-ruilen', 'circulaire-economie'],
    nl: nlBlock(
      'Gezocht & verzoeken in de buurt | HomeCheff',
      'Plaats of beantwoord Gezocht-verzoeken dichtbij. Digitaal dorpsplein voor Ask/Wanted naast aanbod.',
      'Gezocht in jouw buurt',
      [
        'Met Gezocht vraag je wat je nodig hebt — maaltijd, oogst, creatie, dienst of hulp.',
        'HomeCheff maakt verzoeken zichtbaar voor buren, niet alleen voor algoritmes.',
      ],
    ),
    en: block(
      'Wanted requests in your neighbourhood | HomeCheff',
      'Post or answer Wanted requests nearby. Digital village square for Ask/Wanted beside offers.',
      'Wanted in your neighbourhood',
      [
        'With Wanted you ask for what you need — a meal, harvest, creation, service or help.',
        'HomeCheff makes requests visible to neighbours, not only to algorithms.',
      ],
    ),
  },
  {
    id: 'barter-ruilen',
    nlSlug: 'ruilen-en-barteren-in-de-buurt',
    enSlug: 'barter-and-exchange-with-neighbours',
    relatedIds: ['circulaire-economie', 'buurthulp-lokaal', 'micro-ondernemen'],
    nl: nlBlock(
      'Ruilen & barteren in de buurt | HomeCheff',
      'Ruil waarde met buren: producten, diensten of hulp. HomeCheff ondersteunt barter naast checkout.',
      'Ruilen en barteren dichtbij',
      [
        'Niet alles hoeft via geld. Op HomeCheff kun je ruilen, voorstellen doen of afrekenen.',
        'Barter hoort bij de buurteconomie en community exchange.',
      ],
    ),
    en: block(
      'Barter and exchange with neighbours | HomeCheff',
      'Exchange value with neighbours: products, services or help. HomeCheff supports barter beside checkout.',
      'Barter and exchange nearby',
      [
        'Not everything needs money. On HomeCheff you can barter, propose or check out.',
        'Barter belongs to the neighbourhood economy and community exchange.',
      ],
    ),
  },
  {
    id: 'circulaire-economie',
    nlSlug: 'circulaire-buurteconomie',
    enSlug: 'circular-neighbourhood-economy',
    relatedIds: ['barter-ruilen', 'micro-ondernemen', 'buurthulp-lokaal'],
    nl: nlBlock(
      'Circulaire buurteconomie | HomeCheff',
      'Hergebruik, ruil en lokaal delen op de digitale buurtmarkt. HomeCheff versterkt circulaire community exchange.',
      'Circulaire economie in de buurt',
      [
        'Delen, ruilen en lokaal hergebruik maken de buurt sterker dan wegwerpconsumptie alleen.',
        'HomeCheff is gebouwd voor nabije uitwisseling — niet voor anonieme massahandel.',
      ],
    ),
    en: block(
      'Circular neighbourhood economy | HomeCheff',
      'Reuse, barter and local sharing on the digital neighbourhood marketplace. HomeCheff strengthens circular community exchange.',
      'Circular economy in the neighbourhood',
      [
        'Sharing, barter and local reuse strengthen the neighbourhood beyond throwaway consumption alone.',
        'HomeCheff is built for nearby exchange — not anonymous mass trade.',
      ],
    ),
  },
  {
    id: 'micro-ondernemen',
    nlSlug: 'micro-ondernemen-vanuit-huis',
    enSlug: 'micro-entrepreneurship-from-home',
    relatedIds: ['handmade-creaties', 'lessen-skills', 'barter-ruilen'],
    nl: nlBlock(
      'Micro-ondernemen vanuit huis | HomeCheff',
      'Start klein vanuit huis: eten, tuin, creaties of diensten. HomeCheff is de digitale buurtmarkt voor micro-ondernemers.',
      'Micro-ondernemen dichtbij',
      [
        'Verdienen vanuit huis mag persoonlijk en lokaal blijven — met een gezicht achter het aanbod.',
        'HomeCheff ondersteunt micro-ondernemerschap zonder dropshipping-fabriekslogica.',
      ],
    ),
    en: block(
      'Micro-entrepreneurship from home | HomeCheff',
      'Start small from home: food, garden, creations or services. HomeCheff is the digital neighbourhood marketplace for micro-entrepreneurs.',
      'Micro-entrepreneurship nearby',
      [
        'Earning from home can stay personal and local — with a face behind the offer.',
        'HomeCheff supports micro-entrepreneurship without dropshipping factory logic.',
      ],
    ),
  },
  {
    id: 'alt-uber-eats',
    nlSlug: 'alternatief-voor-uber-eats',
    enSlug: 'alternative-to-uber-eats',
    relatedIds: ['alternatief-thuisbezorgd', 'thuisgekookt-kopen', 'buurthulp-lokaal'],
    nl: nlBlock(
      'Alternatief voor Uber Eats | HomeCheff',
      'Zoek je iets anders dan delivery-apps? HomeCheff is de digitale buurtmarkt voor thuisgekookt en makers dichtbij — geen dark kitchen.',
      'HomeCheff als alternatief voor Uber Eats',
      [
        'Uber Eats focust op bezorgketens. HomeCheff focust op buurtmakers: koken, groeien, maken en helpen.',
        'Kies persoonlijk en lokaal wanneer je geen anonieme delivery-flow wilt.',
      ],
    ),
    en: block(
      'Alternative to Uber Eats | HomeCheff',
      'Looking beyond delivery apps? HomeCheff is the digital neighbourhood marketplace for home cooking and makers nearby — not dark kitchens.',
      'HomeCheff as an alternative to Uber Eats',
      [
        'Uber Eats focuses on delivery chains. HomeCheff focuses on neighbourhood makers: cook, grow, make and help.',
        'Choose personal and local when you do not want an anonymous delivery flow.',
      ],
    ),
  },
  {
    id: 'alt-tgtg',
    nlSlug: 'alternatief-voor-too-good-to-go',
    enSlug: 'alternative-to-too-good-to-go',
    relatedIds: ['circulaire-economie', 'thuisgekookt-kopen', 'barter-ruilen'],
    nl: nlBlock(
      'Alternatief voor Too Good To Go | HomeCheff',
      'Too Good To Go redt surplus van winkels. HomeCheff is de buurtmarkt waar mensen proactief maken, delen, ruilen en helpen.',
      'HomeCheff naast Too Good To Go',
      [
        'TGTG is surplus-redding. HomeCheff is doorlopende buurtuitwisseling van makers en buren.',
        'Beide kunnen duurzaamheid dienen — HomeCheff is breder dan food-surplus alleen.',
      ],
    ),
    en: block(
      'Alternative to Too Good To Go | HomeCheff',
      'Too Good To Go rescues store surplus. HomeCheff is the neighbourhood marketplace where people proactively make, share, barter and help.',
      'HomeCheff alongside Too Good To Go',
      [
        'TGTG is surplus rescue. HomeCheff is ongoing neighbourhood exchange among makers and neighbours.',
        'Both can serve sustainability — HomeCheff is broader than food surplus alone.',
      ],
    ),
  },
  {
    id: 'alt-airbnb-exp',
    nlSlug: 'alternatief-voor-airbnb-experiences',
    enSlug: 'alternative-to-airbnb-experiences',
    relatedIds: ['lessen-skills', 'fotografie-muziek', 'buurthulp-lokaal'],
    nl: nlBlock(
      'Alternatief voor Airbnb Experiences | HomeCheff',
      'Zoek je lokale ervaringen dichterbij dan toeristische experiences? HomeCheff verbindt lessen, hulp en makers in de buurt.',
      'HomeCheff als alternatief voor Airbnb Experiences',
      [
        'Airbnb Experiences mikken op bezoekersbeleving. HomeCheff mik op buurtleven: leren, maken, helpen en ruilen.',
        'Persoonlijk en nearby-first — geen toeristische catalogus alleen.',
      ],
    ),
    en: block(
      'Alternative to Airbnb Experiences | HomeCheff',
      'Want local experiences closer than tourist catalogues? HomeCheff connects lessons, help and makers in the neighbourhood.',
      'HomeCheff as an alternative to Airbnb Experiences',
      [
        'Airbnb Experiences target visitor entertainment. HomeCheff targets neighbourhood life: learn, make, help and trade.',
        'Personal and nearby-first — not a tourist catalogue alone.',
      ],
    ),
  },
];
