import type { UiLanguage } from '../domain/jurisdiction';

export type VerdienCheckCopy = {
  pageTitle: string;
  chromeTitle: string;
  intro: string;
  disclaimer: string;
  back: string;
  leaveProduct: string;
  startSelling: string;
  restartCheck: string;
  next: string;
  otherCountry: string;
  packUnavailable: string;
  notCalculated: string;
  needMore: string;
  expectedResult: string;
  expectedTurnover: string;
  expectedCosts: string;
  extraResult: string;
  estimatedSales: string;
  otherTurnoverAmount: string;
  previousYearTurnover: string;
  taxChanges: string;
  zvwChanges: string;
  healthcareChanges: string;
  rentChanges: string;
  childBudgetChanges: string;
  childcareChanges: string;
  netKeep: string;
  perMonth: string;
  guidanceTitle: string;
  guidanceLater: string;
  whatIf: string;
  customAmount: string;
  provisionalTitle: string;
  otherAllowancesExcluded: string;
  notFullCalculation: string;
  taxRegimeUnsupported: string;
  sourceOfIncomeReview: string;
  rowAssumptionNote: string;
  costAssumptionNote: string;
  incompleteCredits: string;
  allowanceKink: string;
  midYearNote: string;
  assessmentHelp: string;
  box1Help: string;
  aggregateHelp: string;
  arbeidsHelp: string;
  zvwUsedHelp: string;
  grossEmploymentHelp: string;
  partnerAssessmentHelp: string;
  incomeBasesNote: string;
  whatMeansThis: string;
  iackHelp: string;
  fiscalPartnerHelp: string;
  singleOlderHelp: string;
  estimateOk: string;
  yearlyHint: string;
  moneyExplain: string;
  progressAlmost: string;
  progressDone: string;
  progressOngoing: string;
  startSellingNeedsAccount: string;
  registrationKvkLabel: string;
  registrationVatLabel: string;
  registrationKorLabel: string;
  uwvBenefitUnknownHint: string;
  keepEstimatePrefix: string;
  keepEstimateMiddle: string;
  keepEstimateSuffix: string;
  steps: Record<string, { title: string; options?: Record<string, string>; help?: string }>;
};

const NL: VerdienCheckCopy = {
  pageTitle: 'Verdienen zonder verrassingen',
  chromeTitle: 'VerdienCheck',
  intro:
    'Een paar korte vragen. Daarna zie je wat extra verdienen voor jou ongeveer betekent.',
  disclaimer:
    'Dit is een schatting en persoonlijke uitleg op basis van wat je hebt ingevuld. Jij blijft verantwoordelijk voor wat je doorgeeft en regelt. Schatting voor 2026.',
  back: 'Terug',
  leaveProduct: 'Naar HomeCheff',
  startSelling: 'Begin met verkopen',
  restartCheck: 'Opnieuw invullen',
  next: 'Verder',
  otherCountry: 'Deze VerdienCheck is nu beschikbaar voor Nederland.',
  packUnavailable: 'De berekening voor 2026 is nog niet beschikbaar.',
  notCalculated: 'Nog niet berekend',
  needMore: 'We hebben nog iets van je nodig.',
  expectedResult: 'Wat ongeveer overblijft',
  expectedTurnover: 'Wat betalen klanten ongeveer dit jaar?',
  expectedCosts: 'Wat geef je er ongeveer aan uit dit jaar?',
  extraResult: 'Extra over voordat belasting speelt',
  estimatedSales: 'Hoeveel verkopen ongeveer dit jaar?',
  otherTurnoverAmount: 'Ongeveer hoeveel, per jaar? Een schatting is goed.',
  previousYearTurnover: 'Ongeveer hoeveel vorig jaar, per jaar?',
  taxChanges: 'Belasting verandert',
  zvwChanges: 'Bijdrage zorgverzekering',
  healthcareChanges: 'Zorgtoeslag verandert',
  rentChanges: 'Huurtoeslag verandert',
  childBudgetChanges: 'Kindgebonden budget',
  childcareChanges: 'Kinderopvangtoeslag',
  netKeep: 'Voor jou extra over',
  perMonth: 'Dat is ongeveer … per maand extra.',
  guidanceTitle: 'Wat moet ik regelen?',
  guidanceLater: 'Begeleiding volgt wanneer de regels klaar zijn.',
  whatIf: 'Wat als je extra verdient?',
  customAmount: 'Zelf invullen',
  provisionalTitle: 'Voorlopige berekening',
  otherAllowancesExcluded: 'We rekenen je andere toeslagen nog niet mee.',
  notFullCalculation: 'Dit is nog niet je volledige berekening.',
  taxRegimeUnsupported: 'Deze AOW-situatie kunnen we nog niet berekenen.',
  sourceOfIncomeReview: 'Dit resultaat moeten we eerst beter bekijken.',
  rowAssumptionNote:
    'Voor deze schatting rekenen we je extra verdienste als bijverdienste naast ander werk. Dat is geen officieel besluit van de Belastingdienst.',
  costAssumptionNote:
    'Voor deze schatting gaan we ervan uit dat de kosten die je invult aftrekbaar zijn. Weet je dat niet, kies dan liever niet.',
  incompleteCredits: 'Sommige kortingen rekenen we nog niet mee.',
  allowanceKink: 'Je toeslag verandert als je meer verdient.',
  midYearNote:
    'Als je situatie in de loop van het jaar verandert, rekenen we dit nog niet.',
  assessmentHelp: 'Het jaarinkomen waarmee toeslagen rekenen. Een schatting is goed.',
  box1Help: 'Het jaarinkomen waarover inkomstenbelasting gaat. Een schatting is goed.',
  aggregateHelp: 'Je verzamelinkomen op je belastingaangifte, naast je loon. Een schatting is goed.',
  arbeidsHelp: 'Wat je met werk verdient, inclusief extra verdiensten. Per jaar. Een schatting is goed.',
  zvwUsedHelp:
    'Het deel van je inkomen waarover je al een zorgverzekeringsbijdrage betaalt, bijvoorbeeld je loon. Per jaar.',
  grossEmploymentHelp: 'Je bruto jaarloon. Dat is niet hetzelfde bedrag als voor toeslagen.',
  partnerAssessmentHelp:
    'Het jaarinkomen van je partner voor toeslagen. Dat verandert niet door jouw extra verdienste. Een schatting is goed.',
  incomeBasesNote:
    'Vul elk bedrag apart in, per jaar. Een schatting is goed. Dit zijn niet dezelfde bedragen.',
  whatMeansThis: 'Wat betekent dit?',
  iackHelp:
    'Dit gaat over een belastingkorting als je werken combineert met zorg voor een jong kind. Dat is iets anders dan kindgebonden budget of kinderopvangtoeslag.',
  fiscalPartnerHelp:
    'Voor de belasting kan iemand je fiscale partner zijn. Dat is niet hetzelfde als een toeslagpartner. Weet je het niet, kies dat. Gok niet.',
  singleOlderHelp:
    'Dit is een belastingkorting voor AOW als je alleenstaand bent. Dat is iets anders dan een korting voor alleenstaande ouders met kinderen.',
  estimateOk: 'Een schatting is goed. Je hoeft het niet precies te weten.',
  yearlyHint:
    'Vul het bedrag per jaar in. Weet je alleen per maand? Tel dan twaalf maanden bij elkaar, bijvoorbeeld €1.800 × 12.',
  moneyExplain:
    'Wat klanten betalen is omzet. Wat jij eraan uitgeeft zijn kosten. Wat overblijft is resultaat, nog zonder belasting.',
  progressAlmost: 'Bijna klaar',
  progressDone: 'Klaar',
  progressOngoing: 'Nog een paar vragen',
  startSellingNeedsAccount:
    'Inloggen is alleen om te gaan verkopen. Je VerdienCheck-antwoorden gaan niet naar je account.',
  registrationKvkLabel: 'Kamer van Koophandel (KVK)',
  registrationVatLabel: 'Btw',
  registrationKorLabel: 'Kleineondernemersregeling (KOR)',
  uwvBenefitUnknownHint:
    'Weet je de naam niet? Ga één stap terug en kies Anders. Dan gok je niet.',
  keepEstimatePrefix: 'Van €',
  keepEstimateMiddle: ' extra resultaat houd je naar schatting ongeveer €',
  keepEstimateSuffix: ' over.',
  steps: {
    jurisdiction: {
      title: 'Woon je in Nederland?',
      options: { NL: 'Ja, in Nederland', OTHER: 'Nee, ergens anders' },
    },
    activity: {
      title: 'Wat wil je via HomeCheff doen?',
      options: {
        MAKE: 'Iets verkopen dat ik maak',
        FOOD: 'Eten of drinken verkopen',
        SERVICE: 'Een dienst aanbieden',
        GARDEN: 'Iets uit mijn tuin verkopen',
        UNKNOWN: 'Ik weet het nog niet precies',
      },
    },
    growthStart: {
      title: 'Hoe wil je beginnen?',
      options: {
        TRYING_OUT: 'Eerst eens proberen',
        OCCASIONAL_EARNING: 'Af en toe iets verdienen',
        REGULAR_EARNING: 'Regelmatig verkopen',
        SERIOUS_SIDE_INCOME: 'Serieus bijverdienen',
        BUILDING_BUSINESS: 'Een onderneming opbouwen',
      },
    },
    situation: {
      title: 'Welke situatie past bij jou?',
      help: 'UWV is de instantie voor werkloosheid en arbeidsongeschiktheid. Bijstand komt van je gemeente. Weet je het niet precies, kies Anders.',
      options: {
        EMPLOYEE: 'Ik werk in loondienst',
        WW: 'Ik krijg WW (werkloosheid)',
        BIJSTAND: 'Ik krijg bijstand van de gemeente',
        OTHER_UWV: 'Ik krijg een andere uitkering van UWV',
        EXISTING_ENTREPRENEUR: 'Ik ben al ondernemer',
        NONE: 'Anders / geen van deze',
        OTHER: 'Anders / geen van deze',
      },
    },
    uwvBenefit: {
      title: 'Welke uitkering van UWV krijg je?',
      help: 'Kijk op je UWV-brief als je de naam niet zeker weet. Gok niet. Ziektewet, WIA, Wajong, WAO en WAZ staan meestal op die brief.',
      options: {
        WIA: 'WIA — arbeidsongeschikt vanuit werk',
        WAJONG: 'Wajong — vanaf jonge leeftijd arbeidsongeschikt',
        ZW: 'Ziektewet',
        WAO: 'WAO — oudere arbeidsongeschiktheidsuitkering',
        WAZ: 'WAZ — arbeidsongeschikt als zelfstandige',
      },
    },
    uwvDiscussedPlan: {
      title: 'Heb je met UWV al over starten gepraat?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    wwStartPeriod: {
      title: 'Wil je via UWV een startperiode gebruiken?',
      help: 'Dat is een UWV-regeling om vanuit WW te starten. Je hoeft de regels niet uit je hoofd te kennen. Weet je het niet, kies dat.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het nog niet' },
    },
    wwRetainBenefit: {
      title: 'Wil je je WW houden terwijl je start?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het nog niet' },
    },
    wwFormerEmployer: {
      title: 'Wil je tijdens het starten werk doen voor je laatste werkgever?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het nog niet' },
    },
    wwUwvSupplement: {
      title: 'Krijg je naast WW ook extra geld van UWV?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    uwvResearchPeriod: {
      title: 'Wil je eerst met UWV uitzoeken of starten past?',
      help: 'UWV noemt dit soms een onderzoeksperiode. Weet je het niet, zeg dat gewoon.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het nog niet' },
    },
    uwvPermission: {
      title: 'Heb je al toestemming van UWV?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    zwOrigin: {
      title: 'Krijg je Ziektewet tijdens of na je WW?',
      options: {
        FROM_OR_AFTER_WW: 'Ja, tijdens of na WW',
        OTHER: 'Nee, een andere situatie',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    bijstandMunicipality: {
      title: 'Weet je welke gemeente jouw bijstand regelt?',
      options: { YES: 'Ja', NO: 'Nee / ik weet het niet' },
    },
    bijstandPreparation: {
      title: 'Mag je van de gemeente eerst oefenen voordat je écht start?',
      help: 'Sommige gemeenten noemen dit een voorbereidingsperiode. Je hoeft die naam niet te kennen. Weet je het niet, kies dat.',
      options: {
        AVAILABLE: 'Ja',
        NOT_AVAILABLE: 'Nee',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    aow: {
      title: 'Krijg je in 2026 AOW?',
      options: {
        BELOW_AOW_2026: 'Nee, in 2026 krijg ik nog geen AOW',
        REACHES_AOW_IN_2026: 'Ja, ik krijg in 2026 voor het eerst AOW',
        FULL_YEAR_AOW_2026: 'Ja, ik heb al AOW',
      },
    },
    aowBirthCohort: {
      title: 'Ben je geboren vóór 1946?',
      options: {
        BORN_BEFORE_1946: 'Ja, vóór 1946',
        BORN_ON_OR_AFTER_1946: 'Nee, in 1946 of later',
      },
    },
    aowMonth: {
      title: 'In welke maand krijg je in 2026 voor het eerst AOW?',
      options: {
        JANUARY: 'Januari',
        FEBRUARY: 'Februari',
        MARCH: 'Maart',
        APRIL: 'April',
        MAY: 'Mei',
        JUNE: 'Juni',
        JULY: 'Juli',
        AUGUST: 'Augustus',
        SEPTEMBER: 'September',
        OCTOBER: 'Oktober',
        NOVEMBER: 'November',
        DECEMBER: 'December',
      },
    },
    singleOlderAow: {
      title: 'Krijg je AOW voor een alleenstaande?',
      options: {
        ELIGIBLE: 'Ja',
        NOT_ELIGIBLE: 'Nee',
        UNKNOWN: 'Weet ik niet',
      },
    },
    allowances: {
      title: 'Krijg je toeslagen?',
      options: {
        HEALTHCARE: 'Zorgtoeslag',
        RENT: 'Huurtoeslag',
        CHILD_BUDGET: 'Kindgebonden budget',
        CHILDCARE: 'Kinderopvangtoeslag',
        NONE: 'Geen',
        UNKNOWN: 'Weet ik niet',
      },
    },
    partner: {
      title: 'Heb je een toeslagpartner?',
      help: 'Een toeslagpartner is iemand met wie toeslagen jouw huishouden bekijken, vaak je partner. Weet je het niet, kies dat.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    partnerInsurance: {
      title: 'Is je partner verzekerd voor zorg?',
      options: { INSURED: 'Ja', NOT_INSURED: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    partnerIncome: {
      title: 'Wat is het jaarinkomen van je partner voor toeslagen?',
      help: 'Toeslagen noemen dit toetsingsinkomen. Een schatting is goed. Weet je alleen per maand? Tel twaalf maanden bij elkaar.',
    },
    frequency: {
      title: 'Hoe vaak denk je te verkopen?',
      options: {
        ONE_OFF: 'Eenmalig',
        OCCASIONAL: 'Af en toe',
        REGULAR: 'Regelmatig',
        UNKNOWN: 'Weet ik nog niet',
      },
    },
    foodSellingFrequency: {
      title: 'Hoe vaak wil je eten of drinken verkopen?',
      options: {
        ONE_OFF: 'Eenmalig / één keer per jaar',
        OCCASIONAL_RECURRING: 'Een paar keer per jaar',
        REGULAR: 'Regelmatig',
        UNKNOWN: 'Weet ik nog niet',
      },
    },
    foodPackaging: {
      title: 'Is het eten vooraf verpakt?',
      help: 'Voorverpakt betekent: de klant kan het product niet meer zelf samenstellen. Weet je het niet, kies dat.',
      options: {
        UNPACKAGED: 'Nee, niet verpakt',
        PREPACKED: 'Ja, al verpakt voordat de klant kiest',
        PREPACKED_FOR_DIRECT_SALE: 'Verpakt, en meteen verkocht',
        UNKNOWN: 'Ik weet het nog niet',
      },
    },
    foodNvwa: {
      title: 'Heb je je al gemeld bij de voedselautoriteit (NVWA)?',
      help: 'NVWA is de voedselautoriteit. Bij een eenmalige verkoop is dit vaak nog niet nodig. Weet je het niet, kies dat.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    foodSafetyPlan: {
      title: 'Heb je afspraken over veilig en schoon werken met eten?',
      help: 'Dat kan een hygiënecode van je branche zijn, of een eigen plan. Geen certificaat verplicht om deze vraag te beantwoorden.',
      options: {
        USING_APPROVED_HYGIENE_CODE: 'Ja, een hygiënecode van mijn branche',
        USING_OWN_HACCP_PLAN: 'Ja, een eigen plan voor veilig werken',
        NOT_ARRANGED: 'Nog niet',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    foodAnimalOrigin: {
      title: 'Werk je met vlees, vis, eieren of zuivel?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    customers: {
      title: 'Aan wie wil je verkopen?',
      options: {
        PRIVATE_CIRCLE: 'Alleen familie of vrienden',
        PUBLIC: 'Ook andere mensen',
        MIXED: 'Allebei',
        UNKNOWN: 'Weet ik nog niet',
      },
    },
    independentlyDeterminesWork: {
      title: 'Bepaal je zelf je prijs en werkwijze?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    customerAcquisition: {
      title: 'Zoek je actief klanten?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik nog niet' },
    },
    intent: {
      title: 'Wat wil je ermee?',
      options: {
        HOBBY_COST_RECOVERY: 'Kosten terugverdienen',
        SIDE_INCOME: 'Iets bijverdienen',
        SERIOUS_SIDE_INCOME: 'Serieus bijverdienen',
        BUILD_BUSINESS: 'Een bedrijf opbouwen',
        UNKNOWN: 'Weet ik nog niet',
      },
    },
    costAssumption: {
      title: 'Mogen we voor deze schatting aannemen dat jouw kosten aftrekbaar zijn?',
      help: 'Aftrekbaar betekent: de Belastingdienst mag ze van je verdienste afhalen. Weet je het niet, kies liever niet.',
      options: { YES: 'Ja, voor deze schatting', NO: 'Nee, liever niet' },
    },
    rowAssumption: {
      title: 'Klopt deze manier van rekenen voor de schatting?',
      options: { ACCEPT: 'Ja, reken het zo' },
    },
    incomeBases: { title: 'Wat is je huidige inkomen per jaar?' },
    assets: {
      title: 'Is je spaargeld laag genoeg voor zorgtoeslag?',
      help: 'Toeslagen kijken naar vermogen, zoals spaargeld. Weet je de grens niet, kies dat je het niet weet.',
      options: {
        ELIGIBLE: 'Ja, mijn spaargeld is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel spaargeld of vermogen',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    housingRent: {
      title: 'Wat is de kale huur per maand?',
      help: 'Kale huur is huur zonder gas, water en servicekosten. Een schatting is goed.',
    },
    housingHousehold: {
      title: 'Hoe ziet je huishouden voor de huurtoeslag eruit?',
      options: {
        SINGLE: 'Ik woon alleen',
        MULTI: 'Ik woon met anderen',
      },
    },
    housingAssets: {
      title: 'Is je spaargeld laag genoeg voor huurtoeslag?',
      options: {
        ELIGIBLE: 'Ja, mijn spaargeld is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel spaargeld of vermogen',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    children: {
      title: 'Hoe oud zijn je kinderen?',
      help: 'Typ de leeftijden, bijvoorbeeld 8 en 14.',
    },
    youngChild: {
      title: 'Heb je een kind jonger dan 12?',
      options: { YES: 'Ja', NO: 'Nee' },
    },
    iackHousehold: {
      title: 'Woont je kind minstens een half jaar bij jou?',
      options: {
        AT_LEAST_6_MONTHS: 'Ja',
        LESS_THAN_6_MONTHS: 'Nee',
        UNKNOWN: 'Weet ik niet',
      },
    },
    iackCoParent: {
      title: 'Zorg je samen ongeveer evenveel dagen voor je kind?',
      options: {
        QUALIFYING_CO_PARENT: 'Ja',
        NOT_QUALIFYING: 'Nee',
        UNKNOWN: 'Weet ik niet',
      },
    },
    fiscalPartner: {
      title: 'Heb je voor de belasting een fiscale partner?',
      options: {
        NONE: 'Nee',
        LESS_THAN_6_MONTHS: 'Ja, korter dan een half jaar',
        MORE_THAN_6_MONTHS: 'Ja, langer dan een half jaar',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    iackPartnerIncome: {
      title: 'Wat verdient je partner ongeveer met werk, per jaar?',
      help: 'Een schatting is goed. Weet je alleen per maand? Tel twaalf maanden bij elkaar.',
    },
    iackRelativeAge: {
      title: 'Wie is ouder: jij of je fiscale partner?',
      options: {
        USER_OLDER: 'Ik ben ouder',
        PARTNER_OLDER: 'Mijn partner is ouder',
        UNKNOWN: 'Weet ik niet',
      },
    },
    childBudgetAssets: {
      title: 'Is je spaargeld laag genoeg voor kindgebonden budget?',
      options: {
        ELIGIBLE: 'Ja, mijn spaargeld is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel spaargeld of vermogen',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    childcare: {
      title: 'Welke opvang gebruik je?',
      help: 'Een schatting van uren en prijs is goed. Weet je niet of de opvang telt voor toeslag, kies dat je het niet weet.',
      options: {
        DAYCARE_CENTER: 'Kinderdagverblijf',
        AFTER_SCHOOL_CENTER: 'Buitenschoolse opvang (BSO)',
        CHILDMINDER: 'Gastouder',
        REGISTERED_ELIGIBLE: 'Ja, deze opvang telt voor toeslag',
        NOT_ELIGIBLE: 'Nee, deze opvang telt niet voor toeslag',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    workStudy: {
      title: 'Werk of studeer je het hele jaar 2026?',
      help: 'Kinderopvangtoeslag vraagt of je het hele jaar werkt of studeert. Weet je de regels niet, kies dat je het niet weet.',
      options: {
        ELIGIBLE: 'Ja',
        NOT_ELIGIBLE: 'Nee',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    midYear: {
      title: 'Blijft deze huishoudsituatie het hele jaar hetzelfde?',
      options: { YES: 'Ja, het hele jaar', NO: 'Nee, het verandert in 2026' },
    },
    amounts: { title: 'Wat denk je ongeveer te verkopen dit jaar?' },
    otherVatTurnover: {
      title: 'Verkoop je hetzelfde ook buiten HomeCheff?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    existingRegistrations: {
      title: 'Heb je dit al geregeld?',
      help: 'KVK is de Kamer van Koophandel. KOR is een btw-regeling voor kleine ondernemers. Weet je het niet, zeg dat. Gok niet.',
      options: {
        KVK_YES: 'Ja, ik sta bij de Kamer van Koophandel (KVK)',
        KVK_NO: 'Nee, ik sta niet bij KVK',
        KVK_UNKNOWN: 'KVK weet ik niet',
        VAT_YES: 'Ja, ik ben aangemeld voor btw',
        VAT_NO: 'Nee, ik ben niet aangemeld voor btw',
        VAT_UNKNOWN: 'Btw weet ik niet',
        KOR_YES: 'Ja, ik gebruik de kleineondernemersregeling (KOR)',
        KOR_NO: 'Nee, ik gebruik die btw-regeling niet',
        KOR_UNKNOWN: 'KOR weet ik niet',
      },
    },
    scenario: { title: 'Wat als je extra verdient?' },
    result: { title: 'Jouw situatie' },
  },
};

const EN: VerdienCheckCopy = {
  pageTitle: 'Earn without surprises',
  chromeTitle: 'VerdienCheck',
  intro:
    'A few short questions. Then you see what extra earnings roughly mean for you.',
  disclaimer:
    'This is an estimate and personal explanation based on what you entered. You remain responsible for what you report and arrange. Estimate for 2026.',
  back: 'Back',
  leaveProduct: 'To HomeCheff',
  startSelling: 'Start selling',
  restartCheck: 'Fill in again',
  next: 'Next',
  otherCountry: 'This earning check is currently available for the Netherlands.',
  packUnavailable: 'The 2026 calculation is not available yet.',
  notCalculated: 'Not calculated yet',
  needMore: 'We still need something from you.',
  expectedResult: 'What is roughly left',
  expectedTurnover: 'About how much will customers pay this year?',
  expectedCosts: 'About how much will you spend on this this year?',
  extraResult: 'Extra before tax',
  estimatedSales: 'About how many sales this year?',
  otherTurnoverAmount: 'About how much per year? An estimate is fine.',
  previousYearTurnover: 'About how much last year, per year?',
  taxChanges: 'Tax changes',
  zvwChanges: 'Healthcare insurance contribution',
  healthcareChanges: 'Healthcare allowance changes',
  rentChanges: 'Rent allowance changes',
  childBudgetChanges: 'Child budget',
  childcareChanges: 'Childcare allowance',
  netKeep: 'You keep extra',
  perMonth: 'That is about … extra per month.',
  guidanceTitle: 'What should I arrange?',
  guidanceLater: 'Guidance follows once the rules are ready.',
  whatIf: 'What if you earn extra?',
  customAmount: 'Enter your own amount',
  provisionalTitle: 'Provisional calculation',
  otherAllowancesExcluded: 'We do not include your other allowances yet.',
  notFullCalculation: 'This is not your full calculation yet.',
  taxRegimeUnsupported: 'We cannot calculate this state-pension situation yet.',
  sourceOfIncomeReview: 'We need to look at this result more carefully first.',
  rowAssumptionNote:
    'For this estimate we treat your extra earnings as extra work alongside other work. That is not an official tax decision.',
  costAssumptionNote:
    'For this estimate we treat the costs you enter as deductible. If you are unsure, choose not to.',
  incompleteCredits: 'Some tax credits are not included yet.',
  allowanceKink: 'Your allowance changes if you earn more.',
  midYearNote:
    'If your situation changes during the year, we cannot calculate this yet.',
  assessmentHelp: 'The yearly income used for allowances. An estimate is fine.',
  box1Help: 'The yearly income used for income tax. An estimate is fine.',
  aggregateHelp: 'Your aggregate income on your tax return, besides your wage. An estimate is fine.',
  arbeidsHelp: 'What you earn from work, including extra earnings. Per year. An estimate is fine.',
  zvwUsedHelp:
    'The part of your income that already has a healthcare insurance contribution, for example your wage. Per year.',
  grossEmploymentHelp: 'Your gross yearly wage. This is not the same figure used for allowances.',
  partnerAssessmentHelp:
    'Your partner’s yearly income for allowances. It does not change because of your extra earnings. An estimate is fine.',
  incomeBasesNote:
    'Enter each amount separately, per year. An estimate is fine. These are not the same figures.',
  whatMeansThis: 'What does this mean?',
  iackHelp:
    'This is a tax credit when you combine work with care for a young child. It is not the same as child budget or childcare allowance.',
  fiscalPartnerHelp:
    'For tax, someone can be your fiscal partner. That is not the same as an allowance partner. If you are unsure, choose that you do not know.',
  singleOlderHelp:
    'This is a tax credit for state pension if you live alone. It is not a credit for single parents with children.',
  estimateOk: 'An estimate is fine. You do not need to be exact.',
  yearlyHint:
    'Enter the amount per year. If you only know a monthly amount, add twelve months, for example €1,800 × 12.',
  moneyExplain:
    'What customers pay is turnover. What you spend are costs. What is left is the result, before tax.',
  progressAlmost: 'Almost done',
  progressDone: 'Done',
  progressOngoing: 'A few more questions',
  startSellingNeedsAccount:
    'Sign-in is only to start selling. Your VerdienCheck answers are not saved to your account.',
  registrationKvkLabel: 'Chamber of Commerce (KVK)',
  registrationVatLabel: 'VAT',
  registrationKorLabel: 'Small-business VAT scheme (KOR)',
  uwvBenefitUnknownHint:
    'If you do not know the name, go one step back and choose Other. Then you are not guessing.',
  keepEstimatePrefix: 'From €',
  keepEstimateMiddle: ' extra result you keep an estimated €',
  keepEstimateSuffix: '.',
  steps: {
    jurisdiction: {
      title: 'Do you live in the Netherlands?',
      options: { NL: 'Yes, in the Netherlands', OTHER: 'No, somewhere else' },
    },
    activity: {
      title: 'What do you want to do on HomeCheff?',
      options: {
        MAKE: 'Sell something I make',
        FOOD: 'Sell food or drinks',
        SERVICE: 'Offer a service',
        GARDEN: 'Sell something from my garden',
        UNKNOWN: 'I don’t know yet',
      },
    },
    growthStart: {
      title: 'How do you want to start?',
      options: {
        TRYING_OUT: 'Just try it first',
        OCCASIONAL_EARNING: 'Earn something now and then',
        REGULAR_EARNING: 'Sell regularly',
        SERIOUS_SIDE_INCOME: 'Earn serious extra income',
        BUILDING_BUSINESS: 'Build a business',
      },
    },
    situation: {
      title: 'Which situation fits you?',
      help: 'UWV handles unemployment and disability benefits. Social assistance comes from your municipality. If you are unsure, choose Other.',
      options: {
        EMPLOYEE: 'I work as an employee',
        WW: 'I receive WW (unemployment benefit)',
        BIJSTAND: 'I receive social assistance from the municipality',
        OTHER_UWV: 'I receive another benefit from UWV',
        EXISTING_ENTREPRENEUR: 'I already have a business',
        NONE: 'Other / none of these',
        OTHER: 'Other / none of these',
      },
    },
    uwvBenefit: {
      title: 'Which UWV benefit do you receive?',
      help: 'Check your UWV letter if you are not sure of the name. Do not guess.',
      options: {
        WIA: 'WIA — disabled from work',
        WAJONG: 'Wajong — disabled from a young age',
        ZW: 'Sickness benefit',
        WAO: 'WAO — older disability benefit',
        WAZ: 'WAZ — disability benefit for the self-employed',
      },
    },
    uwvDiscussedPlan: {
      title: 'Have you already discussed starting with UWV?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    wwStartPeriod: {
      title: 'Do you want to use a UWV start period?',
      help: 'This is a UWV scheme to start from WW. You do not need to know the rules by heart. If you are unsure, say so.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know yet' },
    },
    wwRetainBenefit: {
      title: 'Do you want to keep your WW while you start?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know yet' },
    },
    wwFormerEmployer: {
      title: 'Do you want to work for your last employer during the start period?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know yet' },
    },
    wwUwvSupplement: {
      title: 'Do you also receive a supplement from UWV besides WW?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    uwvResearchPeriod: {
      title: 'Do you first want to check with UWV whether starting fits?',
      help: 'UWV sometimes calls this a research period. If you are unsure, say so.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know yet' },
    },
    uwvPermission: {
      title: 'Do you already have permission from UWV?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    zwOrigin: {
      title: 'Is your sickness benefit during or after WW?',
      options: {
        FROM_OR_AFTER_WW: 'Yes, during or after WW',
        OTHER: 'No, a different situation',
        UNKNOWN: 'I don’t know',
      },
    },
    bijstandMunicipality: {
      title: 'Do you know which municipality pays your social assistance?',
      options: { YES: 'Yes', NO: 'No / I don’t know' },
    },
    bijstandPreparation: {
      title: 'May your municipality let you practise before you really start?',
      help: 'Some municipalities call this a preparation period. You do not need to know that name. If you are unsure, say so.',
      options: {
        AVAILABLE: 'Yes',
        NOT_AVAILABLE: 'No',
        UNKNOWN: 'I don’t know',
      },
    },
    aow: {
      title: 'Will you receive state pension in 2026?',
      options: {
        BELOW_AOW_2026: 'No, I will not receive state pension in 2026',
        REACHES_AOW_IN_2026: 'Yes, I start receiving state pension in 2026',
        FULL_YEAR_AOW_2026: 'Yes, I already receive state pension',
      },
    },
    aowBirthCohort: {
      title: 'Were you born before 1946?',
      options: {
        BORN_BEFORE_1946: 'Yes, before 1946',
        BORN_ON_OR_AFTER_1946: 'No, in 1946 or later',
      },
    },
    aowMonth: {
      title: 'In which month do you first receive state pension in 2026?',
      options: {
        JANUARY: 'January',
        FEBRUARY: 'February',
        MARCH: 'March',
        APRIL: 'April',
        MAY: 'May',
        JUNE: 'June',
        JULY: 'July',
        AUGUST: 'August',
        SEPTEMBER: 'September',
        OCTOBER: 'October',
        NOVEMBER: 'November',
        DECEMBER: 'December',
      },
    },
    singleOlderAow: {
      title: 'Do you receive state pension as a single person?',
      options: {
        ELIGIBLE: 'Yes',
        NOT_ELIGIBLE: 'No',
        UNKNOWN: 'I don’t know',
      },
    },
    allowances: {
      title: 'Do you receive allowances?',
      options: {
        HEALTHCARE: 'Healthcare allowance',
        RENT: 'Rent allowance',
        CHILD_BUDGET: 'Child budget',
        CHILDCARE: 'Childcare allowance',
        NONE: 'None',
        UNKNOWN: 'I don’t know',
      },
    },
    partner: {
      title: 'Do you have an allowance partner?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    partnerInsurance: {
      title: 'Is your partner insured for healthcare?',
      options: { INSURED: 'Yes', NOT_INSURED: 'No', UNKNOWN: 'I don’t know' },
    },
    partnerIncome: {
      title: 'What is your partner’s yearly income for allowances?',
      help: 'Allowances call this assessment income. An estimate is fine. If you only know a monthly amount, add twelve months.',
    },
    frequency: {
      title: 'How often do you think you will sell?',
      options: {
        ONE_OFF: 'Once',
        OCCASIONAL: 'Now and then',
        REGULAR: 'Regularly',
        UNKNOWN: 'I don’t know yet',
      },
    },
    foodSellingFrequency: {
      title: 'How often do you want to sell food or drinks?',
      options: {
        ONE_OFF: 'Once / once a year',
        OCCASIONAL_RECURRING: 'A few times a year',
        REGULAR: 'Regularly',
        UNKNOWN: 'I don’t know yet',
      },
    },
    foodPackaging: {
      title: 'Is the food packed before the customer chooses?',
      options: {
        UNPACKAGED: 'No, unpackaged',
        PREPACKED: 'Yes, prepacked',
        PREPACKED_FOR_DIRECT_SALE: 'Packed for direct sale',
        UNKNOWN: 'I don’t know yet',
      },
    },
    foodNvwa: {
      title: 'Have you already registered with the food authority (NVWA)?',
      help: 'NVWA is the Dutch food authority. For a one-off sale this is often not needed yet. If you are unsure, say so.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    foodSafetyPlan: {
      title: 'Do you have a way of working safely and cleanly with food?',
      options: {
        USING_APPROVED_HYGIENE_CODE: 'Yes, a sector hygiene code',
        USING_OWN_HACCP_PLAN: 'Yes, my own plan for working safely',
        NOT_ARRANGED: 'Not yet',
        UNKNOWN: 'I don’t know',
      },
    },
    foodAnimalOrigin: {
      title: 'Do you work with meat, fish, eggs or dairy?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    customers: {
      title: 'Who do you want to sell to?',
      options: {
        PRIVATE_CIRCLE: 'Only family or friends',
        PUBLIC: 'Other people too',
        MIXED: 'Both',
        UNKNOWN: 'I don’t know yet',
      },
    },
    independentlyDeterminesWork: {
      title: 'Do you set your own price and way of working?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    customerAcquisition: {
      title: 'Are you actively looking for customers?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know yet' },
    },
    intent: {
      title: 'What is your goal?',
      options: {
        HOBBY_COST_RECOVERY: 'Cover my costs',
        SIDE_INCOME: 'Earn a bit extra',
        SERIOUS_SIDE_INCOME: 'Earn extra seriously',
        BUILD_BUSINESS: 'Build a business',
        UNKNOWN: 'I don’t know yet',
      },
    },
    costAssumption: {
      title: 'May we assume your costs are deductible for this calculation?',
      options: { YES: 'Yes, for this calculation', NO: 'No' },
    },
    rowAssumption: {
      title: 'How should we treat your extra earnings?',
      options: { ACCEPT: 'Yes, calculate it this way' },
    },
    incomeBases: { title: 'What is your current income?' },
    assets: {
      title: 'Are you within the asset limit for healthcare allowance?',
      options: {
        ELIGIBLE: 'Yes, my assets are low enough',
        NOT_ELIGIBLE: 'No, my assets are too high',
        UNKNOWN: 'I don’t know',
      },
    },
    housingRent: { title: 'What is the bare monthly rent?' },
    housingHousehold: {
      title: 'What is your rent-allowance household?',
      options: {
        SINGLE: 'I live alone',
        MULTI: 'I live with others',
      },
    },
    housingAssets: {
      title: 'Are you within the asset limit for rent allowance?',
      options: {
        ELIGIBLE: 'Yes, my assets are low enough',
        NOT_ELIGIBLE: 'No, my assets are too high',
        UNKNOWN: 'I don’t know',
      },
    },
    children: {
      title: 'How old are your children?',
      help: 'Type the ages, for example 8 and 14.',
    },
    youngChild: {
      title: 'Do you have a child under 12?',
      options: { YES: 'Yes', NO: 'No' },
    },
    iackHousehold: {
      title: 'Does your child live with you for at least half the year?',
      options: {
        AT_LEAST_6_MONTHS: 'Yes',
        LESS_THAN_6_MONTHS: 'No',
        UNKNOWN: 'I don’t know',
      },
    },
    iackCoParent: {
      title: 'Do you and the other parent care for your child about equally many days?',
      options: {
        QUALIFYING_CO_PARENT: 'Yes',
        NOT_QUALIFYING: 'No',
        UNKNOWN: 'I don’t know',
      },
    },
    fiscalPartner: {
      title: 'Do you have a fiscal partner for tax?',
      options: {
        NONE: 'No',
        LESS_THAN_6_MONTHS: 'Yes, for less than six months',
        MORE_THAN_6_MONTHS: 'Yes, for more than six months',
        UNKNOWN: 'I don’t know',
      },
    },
    iackPartnerIncome: {
      title: 'About how much does your partner earn from work per year?',
      help: 'An estimate is fine. If you only know a monthly amount, add twelve months.',
    },
    iackRelativeAge: {
      title: 'Who is older: you or your fiscal partner?',
      options: {
        USER_OLDER: 'I am older',
        PARTNER_OLDER: 'My partner is older',
        UNKNOWN: 'I don’t know',
      },
    },
    childBudgetAssets: {
      title: 'Are you within the asset limit for child budget?',
      options: {
        ELIGIBLE: 'Yes, my assets are low enough',
        NOT_ELIGIBLE: 'No, my assets are too high',
        UNKNOWN: 'I don’t know',
      },
    },
    childcare: {
      title: 'What childcare do you use?',
      help: 'An estimate of hours and price is fine. If you do not know whether it counts for allowance, say you do not know.',
      options: {
        DAYCARE_CENTER: 'Daycare centre',
        AFTER_SCHOOL_CENTER: 'After-school care (BSO)',
        CHILDMINDER: 'Childminder',
        REGISTERED_ELIGIBLE: 'Yes, this childcare counts for allowance',
        NOT_ELIGIBLE: 'No, this childcare does not count for allowance',
        UNKNOWN: 'I don’t know',
      },
    },
    workStudy: {
      title: 'Do you work or study all of 2026?',
      help: 'Childcare allowance asks whether you work or study all year. If you do not know the rules, say you do not know.',
      options: {
        ELIGIBLE: 'Yes',
        NOT_ELIGIBLE: 'No',
        UNKNOWN: 'I don’t know',
      },
    },
    midYear: {
      title: 'Does this household situation stay the same all year?',
      options: { YES: 'Yes, all year', NO: 'No, it changes in 2026' },
    },
    amounts: { title: 'What do you think you will sell this year, roughly?' },
    otherVatTurnover: {
      title: 'Do you also sell the same things outside HomeCheff?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    existingRegistrations: {
      title: 'Have you already arranged this?',
      help: 'KVK is the Chamber of Commerce. KOR is a VAT scheme for small businesses. If you are unsure, say so. Do not guess.',
      options: {
        KVK_YES: 'Yes, I am registered with the Chamber of Commerce (KVK)',
        KVK_NO: 'No, I am not registered with KVK',
        KVK_UNKNOWN: 'I don’t know about KVK',
        VAT_YES: 'Yes, I am registered for VAT',
        VAT_NO: 'No, I am not registered for VAT',
        VAT_UNKNOWN: 'I don’t know about VAT',
        KOR_YES: 'Yes, I use the small-business VAT scheme (KOR)',
        KOR_NO: 'No, I do not use that VAT scheme',
        KOR_UNKNOWN: 'I don’t know about KOR',
      },
    },
    scenario: { title: 'What if you earn extra?' },
    result: { title: 'Your situation' },
  },
};

export function getVerdienCheckCopy(language: UiLanguage): VerdienCheckCopy {
  return language === 'en' ? EN : NL;
}
