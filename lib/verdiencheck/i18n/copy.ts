import type { UiLanguage } from '../domain/jurisdiction';

export type VerdienCheckCopy = {
  pageTitle: string;
  chromeTitle: string;
  intro: string;
  disclaimer: string;
  back: string;
  leaveProduct: string;
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
  steps: Record<string, { title: string; options?: Record<string, string> }>;
};

const NL: VerdienCheckCopy = {
  pageTitle: 'Verdienen zonder verrassingen',
  chromeTitle: 'VerdienCheck',
  intro:
    'Ontdek wat bijverdienen voor jou betekent. Zie vooraf wat je ongeveer overhoudt. HomeCheff laat zien wat je nu moet regelen en wat pas later belangrijk wordt.',
  disclaimer:
    'Dit is een schatting en persoonlijke uitleg op basis van wat je hebt ingevuld. Jij blijft verantwoordelijk voor wat je doorgeeft en regelt. Schatting voor 2026.',
  back: 'Terug',
  leaveProduct: 'Naar HomeCheff',
  next: 'Verder',
  otherCountry: 'Deze VerdienCheck is nu beschikbaar voor Nederland.',
  packUnavailable: 'De berekening voor 2026 is nog niet beschikbaar.',
  notCalculated: 'Nog niet berekend',
  needMore: 'We hebben nog iets van je nodig.',
  expectedResult: 'Verwacht resultaat',
  expectedTurnover: 'Verwachte omzet',
  expectedCosts: 'Verwachte kosten',
  extraResult: 'Extra resultaat',
  estimatedSales: 'Hoeveel verkopen ongeveer dit jaar?',
  otherTurnoverAmount: 'Welke omzet buiten HomeCheff (zelfde activiteiten)?',
  previousYearTurnover: 'Welke relevante omzet had je vorig kalenderjaar?',
  taxChanges: 'Belasting verandert',
  zvwChanges: 'Zvw-bijdrage',
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
    'Voor deze berekening gaan we ervan uit dat dit resultaat uit overig werk is.',
  costAssumptionNote:
    'Voor deze berekening gaan we ervan uit dat de ingevulde kosten aftrekbaar zijn.',
  incompleteCredits: 'Sommige kortingen rekenen we nog niet mee.',
  allowanceKink: 'Je toeslag verandert als je meer verdient.',
  midYearNote:
    'Als je situatie in de loop van het jaar verandert, rekenen we dit nog niet.',
  assessmentHelp: 'Dit is het inkomen waarmee Toeslagen rekent.',
  box1Help: 'Het inkomen waarover inkomstenbelasting wordt berekend.',
  aggregateHelp: 'Je verzamelinkomen, apart van je loon.',
  arbeidsHelp: 'Je arbeidsinkomen, inclusief extra verdiensten uit werk.',
  zvwUsedHelp:
    'Het deel van je inkomen waarover al Zvw-bijdrage is berekend, bijvoorbeeld je loon.',
  grossEmploymentHelp: 'Je bruto loon. Dit is niet hetzelfde als toetsingsinkomen.',
  partnerAssessmentHelp:
    'Het toetsingsinkomen van je partner. Dat verandert niet door jouw extra verdienste.',
  incomeBasesNote: 'Vul elk bedrag apart in. Dit zijn niet dezelfde begrippen.',
  whatMeansThis: 'Wat betekent dit?',
  iackHelp:
    'Dit gaat over een belastingkorting als je werken combineert met zorg voor een jong kind. Dat is iets anders dan kindgebonden budget of kinderopvangtoeslag.',
  fiscalPartnerHelp:
    'Een fiscale partner is niet hetzelfde als een toeslagpartner. Weet je het niet, kies dan dat je het niet weet.',
  singleOlderHelp:
    'Dit is de alleenstaandeouderenkorting voor AOW. Dat is iets anders dan een korting voor alleenstaande ouders met kinderen.',
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
      options: {
        EMPLOYEE: 'Ik werk in loondienst',
        WW: 'Ik krijg WW',
        BIJSTAND: 'Ik krijg bijstand',
        OTHER_UWV: 'Ik krijg een andere UWV-uitkering',
        EXISTING_ENTREPRENEUR: 'Ik ben al ondernemer',
        NONE: 'Anders / geen van deze',
        OTHER: 'Anders / geen van deze',
      },
    },
    uwvBenefit: {
      title: 'Welke UWV-uitkering?',
      options: {
        WIA: 'WIA',
        WAJONG: 'Wajong',
        ZW: 'Ziektewet',
        WAO: 'WAO',
        WAZ: 'WAZ',
      },
    },
    uwvDiscussedPlan: {
      title: 'Heb je al met UWV besproken dat je wilt starten?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
    },
    wwStartPeriod: {
      title: 'Wil je gebruikmaken van de UWV-startperiode?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het nog niet' },
    },
    wwRetainBenefit: {
      title: 'Wil je WW houden terwijl je start?',
      options: { YES: 'Ja', NO: 'Nee, zonder behoud van WW', UNKNOWN: 'Ik weet het nog niet' },
    },
    wwFormerEmployer: {
      title: 'Wil je tijdens je startperiode werk doen voor je laatste werkgever?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik nog niet' },
    },
    wwUwvSupplement: {
      title: 'Krijg je naast WW ook een toeslag van UWV?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    uwvResearchPeriod: {
      title: 'Wil je een UWV-onderzoeksperiode gebruiken?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het nog niet' },
    },
    uwvPermission: {
      title: 'Heb je al toestemming van UWV?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    zwOrigin: {
      title: 'Krijg je Ziektewet tijdens of na WW?',
      options: {
        FROM_OR_AFTER_WW: 'Ja, tijdens of na WW',
        OTHER: 'Nee, een andere situatie',
        UNKNOWN: 'Weet ik niet',
      },
    },
    bijstandMunicipality: {
      title: 'Weet je welke gemeente jouw bijstand regelt?',
      options: { YES: 'Ja', NO: 'Nee / weet ik niet' },
    },
    bijstandPreparation: {
      title: 'Heeft jouw gemeente een voorbereidingsperiode?',
      options: {
        AVAILABLE: 'Ja',
        NOT_AVAILABLE: 'Nee',
        UNKNOWN: 'Weet ik niet',
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
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    partnerInsurance: {
      title: 'Is je partner verzekerd voor zorg?',
      options: { INSURED: 'Ja', NOT_INSURED: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    partnerIncome: { title: 'Wat is het toetsingsinkomen van je partner?' },
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
      options: {
        UNPACKAGED: 'Nee, onverpakt',
        PREPACKED: 'Ja, voorverpakt voordat de klant kiest',
        PREPACKED_FOR_DIRECT_SALE: 'Verpakt voor directe verkoop',
        UNKNOWN: 'Weet ik nog niet',
      },
    },
    foodNvwa: {
      title: 'Heb je je al bij de NVWA geregistreerd?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    foodSafetyPlan: {
      title: 'Heb je een voedselveiligheidsplan of hygiënecode?',
      options: {
        USING_APPROVED_HYGIENE_CODE: 'Ja, een hygiënecode van mijn branche',
        USING_OWN_HACCP_PLAN: 'Ja, een eigen voedselveiligheidsplan',
        NOT_ARRANGED: 'Nog niet',
        UNKNOWN: 'Weet ik niet',
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
      title: 'Mogen we voor deze berekening aannemen dat jouw kosten aftrekbaar zijn?',
      options: { YES: 'Ja, voor deze berekening', NO: 'Nee, liever niet' },
    },
    rowAssumption: {
      title: 'Hoe rekenen we je extra verdienste?',
      options: { ACCEPT: 'Klopt, reken het zo' },
    },
    incomeBases: { title: 'Wat is je huidige inkomen?' },
    assets: {
      title: 'Val je binnen de vermogensgrens voor zorgtoeslag?',
      options: {
        ELIGIBLE: 'Ja, mijn vermogen is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel vermogen',
        UNKNOWN: 'Weet ik niet',
      },
    },
    housingRent: { title: 'Wat is de kale huur per maand?' },
    housingHousehold: {
      title: 'Hoe ziet je huishouden voor de huurtoeslag eruit?',
      options: {
        SINGLE: 'Ik woon alleen',
        MULTI: 'Ik woon met anderen',
      },
    },
    housingAssets: {
      title: 'Val je binnen de vermogensgrens voor huurtoeslag?',
      options: {
        ELIGIBLE: 'Ja, mijn vermogen is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel vermogen',
        UNKNOWN: 'Weet ik niet',
      },
    },
    children: { title: 'Hoe oud zijn je kinderen? (leeftijden, gescheiden door komma)' },
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
      title: 'Heb je een fiscale partner?',
      options: {
        NONE: 'Nee',
        LESS_THAN_6_MONTHS: 'Ja, korter dan een half jaar',
        MORE_THAN_6_MONTHS: 'Ja, langer dan een half jaar',
        UNKNOWN: 'Weet ik niet',
      },
    },
    iackPartnerIncome: { title: 'Wat is het arbeidsinkomen van je fiscale partner?' },
    iackRelativeAge: {
      title: 'Wie is ouder: jij of je fiscale partner?',
      options: {
        USER_OLDER: 'Ik ben ouder',
        PARTNER_OLDER: 'Mijn partner is ouder',
        UNKNOWN: 'Weet ik niet',
      },
    },
    childBudgetAssets: {
      title: 'Val je binnen de vermogensgrens voor kindgebonden budget?',
      options: {
        ELIGIBLE: 'Ja, mijn vermogen is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel vermogen',
        UNKNOWN: 'Weet ik niet',
      },
    },
    childcare: { title: 'Welke opvang gebruik je?' },
    workStudy: {
      title: 'Werk of studeer je in 2026 het hele jaar in een situatie met recht op kinderopvangtoeslag?',
      options: {
        ELIGIBLE: 'Ja',
        NOT_ELIGIBLE: 'Nee',
        UNKNOWN: 'Weet ik niet',
      },
    },
    midYear: {
      title: 'Blijft deze huishoudsituatie het hele jaar hetzelfde?',
      options: { YES: 'Ja, het hele jaar', NO: 'Nee, het verandert in 2026' },
    },
    amounts: { title: 'Wat denk je te verkopen?' },
    otherVatTurnover: {
      title: 'Heb je buiten HomeCheff nog omzet uit dezelfde activiteiten?',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Weet ik niet' },
    },
    existingRegistrations: {
      title: 'Heb je dit al geregeld?',
      options: {
        KVK_YES: 'Ik sta bij KVK',
        KVK_NO: 'Ik sta niet bij KVK',
        KVK_UNKNOWN: 'KVK weet ik niet',
        VAT_YES: 'Ik heb een btw-registratie',
        VAT_NO: 'Ik heb geen btw-registratie',
        VAT_UNKNOWN: 'Btw weet ik niet',
        KOR_YES: 'Ik doe mee aan de KOR',
        KOR_NO: 'Ik doe niet mee aan de KOR',
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
    'See what extra earnings mean for you. HomeCheff shows what to arrange now and what can wait.',
  disclaimer:
    'This is an estimate and personal explanation based on what you entered. You remain responsible for what you report and arrange. Estimate for 2026.',
  back: 'Back',
  leaveProduct: 'To HomeCheff',
  next: 'Next',
  otherCountry: 'This earning check is currently available for the Netherlands.',
  packUnavailable: 'The 2026 calculation is not available yet.',
  notCalculated: 'Not calculated yet',
  needMore: 'We still need something from you.',
  expectedResult: 'Expected result',
  expectedTurnover: 'Expected sales',
  expectedCosts: 'Expected costs',
  extraResult: 'Extra result',
  estimatedSales: 'About how many sales this year?',
  otherTurnoverAmount: 'Turnover outside HomeCheff (same activities)?',
  previousYearTurnover: 'What was your relevant turnover last calendar year?',
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
    'For this calculation we treat this as income from other work.',
  costAssumptionNote:
    'For this calculation we treat the costs you entered as deductible.',
  incompleteCredits: 'Some tax credits are not included yet.',
  allowanceKink: 'Your allowance changes if you earn more.',
  midYearNote:
    'If your situation changes during the year, we cannot calculate this yet.',
  assessmentHelp: 'This is the income Toeslagen uses.',
  box1Help: 'The income used for income tax.',
  aggregateHelp: 'Your aggregate income, separate from your wage.',
  arbeidsHelp: 'Your employment income, including extra earnings from work.',
  zvwUsedHelp:
    'The part of your income that already has a Zvw contribution, for example your wage.',
  grossEmploymentHelp: 'Your gross wage. This is not the same as assessment income.',
  partnerAssessmentHelp:
    'Your partner’s assessment income. It does not change because of your extra earnings.',
  incomeBasesNote: 'Enter each amount separately. These are not the same figures.',
  whatMeansThis: 'What does this mean?',
  iackHelp:
    'This is a tax credit when you combine work with care for a young child. It is not the same as child budget or childcare allowance.',
  fiscalPartnerHelp:
    'A fiscal partner is not the same as an allowance partner. If you are unsure, choose that you do not know.',
  singleOlderHelp:
    'This is the single older persons tax credit for state pension. It is not a credit for single parents with children.',
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
      options: {
        EMPLOYEE: 'I work as an employee',
        WW: 'I receive WW',
        BIJSTAND: 'I receive social assistance',
        OTHER_UWV: 'I receive another UWV benefit',
        EXISTING_ENTREPRENEUR: 'I already have a business',
        NONE: 'Other / none of these',
        OTHER: 'Other / none of these',
      },
    },
    uwvBenefit: {
      title: 'Which UWV benefit?',
      options: {
        WIA: 'WIA',
        WAJONG: 'Wajong',
        ZW: 'Sickness benefit',
        WAO: 'WAO',
        WAZ: 'WAZ',
      },
    },
    uwvDiscussedPlan: {
      title: 'Have you already discussed starting with UWV?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    wwStartPeriod: {
      title: 'Do you want to use the UWV start period?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know yet' },
    },
    wwRetainBenefit: {
      title: 'Do you want to keep WW while you start?',
      options: { YES: 'Yes', NO: 'No, without keeping WW', UNKNOWN: 'I don’t know yet' },
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
      title: 'Do you want to use a UWV research period?',
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
      title: 'Does your municipality offer a preparation period?',
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
    partnerIncome: { title: 'What is your partner’s assessment income?' },
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
      title: 'Have you already registered with the NVWA?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    foodSafetyPlan: {
      title: 'Do you have a food-safety plan or hygiene code?',
      options: {
        USING_APPROVED_HYGIENE_CODE: 'Yes, a sector hygiene code',
        USING_OWN_HACCP_PLAN: 'Yes, my own food-safety plan',
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
    children: { title: 'How old are your children? (ages, comma-separated)' },
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
      title: 'Do you have a fiscal partner?',
      options: {
        NONE: 'No',
        LESS_THAN_6_MONTHS: 'Yes, for less than six months',
        MORE_THAN_6_MONTHS: 'Yes, for more than six months',
        UNKNOWN: 'I don’t know',
      },
    },
    iackPartnerIncome: { title: 'What is your fiscal partner’s employment income?' },
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
    childcare: { title: 'What childcare do you use?' },
    workStudy: {
      title: 'Do you work or study all of 2026 in a situation that qualifies for childcare allowance?',
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
    amounts: { title: 'What do you think you will sell?' },
    otherVatTurnover: {
      title: 'Do you have turnover outside HomeCheff from the same activities?',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
    },
    existingRegistrations: {
      title: 'Have you already arranged this?',
      options: {
        KVK_YES: 'I am registered with KVK',
        KVK_NO: 'I am not registered with KVK',
        KVK_UNKNOWN: 'I don’t know about KVK',
        VAT_YES: 'I have a VAT registration',
        VAT_NO: 'I do not have a VAT registration',
        VAT_UNKNOWN: 'I don’t know about VAT',
        KOR_YES: 'I use the small-business VAT scheme',
        KOR_NO: 'I do not use that scheme',
        KOR_UNKNOWN: 'I don’t know',
      },
    },
    scenario: { title: 'What if you earn extra?' },
    result: { title: 'Your situation' },
  },
};

export function getVerdienCheckCopy(language: UiLanguage): VerdienCheckCopy {
  return language === 'en' ? EN : NL;
}
