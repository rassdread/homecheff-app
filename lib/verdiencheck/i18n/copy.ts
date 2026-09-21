import type { UiLanguage } from '../domain/jurisdiction';

export type VerdienCheckCopy = {
  pageTitle: string;
  chromeTitle: string;
  intro: string;
  introReassurance: string;
  introGrowth: string;
  disclaimer: string;
  back: string;
  leaveProduct: string;
  startSelling: string;
  discoverHomecheff: string;
  discoverHomecheffBody: string;
  beginViaHomecheff: string;
  affiliatePartnerCta: string;
  affiliatePartnerBody: string;
  restNotToday: string;
  affiliateReviewNote: string;
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
  progressMoney: string;
  startSellingNeedsAccount: string;
  registrationKvkLabel: string;
  registrationVatLabel: string;
  registrationKorLabel: string;
  uwvBenefitUnknownHint: string;
  keepEstimatePrefix: string;
  keepEstimateMiddle: string;
  keepEstimateSuffix: string;
  quickCheckDone: string;
  moneyPrompt: string;
  moneyYes: string;
  moneyNo: string;
  periodYear: string;
  periodMonth: string;
  monthToYearHint: string;
  currentIncomeUnknown: string;
  otherIncomeTitle: string;
  otherIncomeAmount: string;
  advancedAccuracy: string;
  advancedAccuracyExplain: string;
  extraResultExplain: string;
  scenarioResultHint: string;
  costsCountTitle: string;
  costsCountBody: string;
  costsCountEngine: string;
  costsAreRealExpenses: string;
  receiptsNote: string;
  whatIsResultTitle: string;
  whatIsResultBody: string;
  resultExampleCaption: string;
  knowMyResult: string;
  calculateFromRevenueCosts: string;
  helperRevenueLabel: string;
  helperCostsLabel: string;
  helperCostsUnknown: string;
  helperResultLabel: string;
  helperUnknownCostsNote: string;
  helperNegativeNote: string;
  helperZeroNote: string;
  helperInvestmentNote: string;
  helperCostExamples: string;
  helperPartialCostsNote: string;
  helperAwaiting: string;
  fromSaleToKeptTitle: string;
  helperProgressLead: string;
  helperProgressMid: string;
  helperProgressEnd: string;
  quickInsightTitle: string;
  quickInsightAfterResult: string;
  quickInsightThenNet: string;
  startForMySituation: string;
  kostenInfoLabel: string;
  kostenInfoBody: string;
  youSellLabel: string;
  minusLabel: string;
  resultBeforeTaxLabel: string;
  taxAndZvwChainLabel: string;
  allowanceChangeChainLabel: string;
  reallyKeepExtraLabel: string;
  helperCostsHint: string;
  splitCostsCta: string;
  hideSplitCostsCta: string;
  costCatMaterials: string;
  costCatPackaging: string;
  costCatPlatform: string;
  costCatDelivery: string;
  costCatEquipment: string;
  costCatMarketing: string;
  costCatOther: string;
  userSpendLabel: string;
  deductibleAmountLabel: string;
  ordinaryCostLabel: string;
  investmentCostLabel: string;
  investmentQuestion: string;
  investmentExplain: string;
  investmentYearAsk: string;
  investmentUnknownNote: string;
  receiptsCalloutTitle: string;
  receiptsCalloutBody: string;
  vatSeparationNote: string;
  notWholeTurnover: string;
  keepRecordsEarn: string;
  keepOverviewPrompt: string;
  sellViaHomecheff: string;
  placeFirstOffer: string;
  placeNewOffer: string;
  beginSelling: string;
  introNoAccount: string;
  ctaPromptFood: string;
  ctaPromptGarden: string;
  ctaPromptMake: string;
  ctaPromptService: string;
  ctaPromptDefault: string;
  growthBeginSmall: string;
  growthStepOffer: string;
  growthStepCustomer: string;
  growthStepReviews: string;
  growthStepRepeat: string;
  growthStepName: string;
  growthStepProfessional: string;
  growthWhenSalesGrow: string;
  affiliateDiscoverLink: string;
  growthSellingMessage: string;
  moreExplanation: string;
  exampleRevenueLabel: string;
  exampleCostsLabel: string;
  exampleResultLabel: string;
  exampleRevenueAmount: string;
  exampleCostsAmount: string;
  exampleResultAmount: string;
  officialSellingThought: string;
  moneyResultTitle: string;
  monthlyFromYearNote: string;
  moneyPhaseNowTitle: string;
  moneyPhaseNowBody: string;
  baselineCompleteTitle: string;
  baselineEstablished: string;
  scenarioSwitchHint: string;
  moneyDone: string;
  closeCheck: string;
  restartFromStart: string;
  restartCompleted: string;
  restartConfirmTitle: string;
  restartConfirmBody: string;
  restartConfirmCancel: string;
  restartConfirmConfirm: string;
  resumeHint: string;
  nowHeading: string;
  laterHeading: string;
  comparisonHeading: string;
  comparisonNet: string;
  comparisonMonth: string;
  currentIncomeInvalid: string;
  incomeGross: string;
  incomeNet: string;
  applyCustomAmount: string;
  situationNowTitle: string;
  viewExtraScenarioCta: string;
  notYetCalculable: string;
  estimatedEntitlement: string;
  extraTaxAndContributions: string;
  extraIncomeTax: string;
  zvwContributionLabel: string;
  setAsidePrefix: string;
  setAsideSuffix: string;
  totalAllowances: string;
  allowanceChange: string;
  netExtraKeepTitle: string;
  whatChangesTitle: string;
  incomeHeading: string;
  allowancesHeading: string;
  grossIncomeLabel: string;
  perYearShort: string;
  perMonthShort: string;
  netInputEstimateNote: string;
  netInputAowNote: string;
  extraTaxReserveTitle: string;
  shareAction: string;
  shareTitle: string;
  shareMessage: string;
  shareAfterResult: string;
  steps: Record<string, { title: string; options?: Record<string, string>; help?: string }>;
};

const NL: VerdienCheckCopy = {
  pageTitle: 'Verdienen zonder verrassingen',
  chromeTitle: 'VerdienCheck',
  intro: 'Wat zou jij écht overhouden als je iets gaat verkopen?',
  introReassurance:
    'Bereken wat kosten, belasting en toeslagen betekenen voor jouw situatie.',
  introGrowth:
    'Ga je daarna via HomeCheff verder? Dan helpen we je tijdens het opbouwen stap voor stap te begrijpen wat later relevant wordt. Wij doen je belastingaangifte of inschrijvingen niet voor je.',
  disclaimer:
    'Dit is een schatting en persoonlijke uitleg op basis van wat je hebt ingevuld. Jij blijft verantwoordelijk voor wat je doorgeeft en regelt. Schatting voor 2026.',
  back: 'Terug',
  leaveProduct: 'VerdienCheck afsluiten',
  startSelling: 'Maak je eerste aanbod',
  discoverHomecheff: 'Ontdek HomeCheff',
  discoverHomecheffBody:
    'Wil je hiermee beginnen? Via HomeCheff kun je verkopen of een dienst aanbieden. Terwijl je opbouwt, helpen we je stap voor stap begrijpen wat voor jouw situatie relevant wordt.',
  beginViaHomecheff: 'Begin via HomeCheff',
  affiliatePartnerCta: 'Bekijk het partnerprogramma',
  affiliatePartnerBody:
    'HomeCheff heeft ook een partnerprogramma waarmee je commissie kunt verdienen. Dat is optioneel en geen voorwaarde voor dit resultaat.',
  restNotToday: 'Je hoeft niet alles nu te regelen.',
  affiliateReviewNote:
    'Commissie geef je meestal aan in je belastingaangifte. Of het bijverdienste of een onderneming is, hangt af van hoe je werkt. HomeCheff verzint dat niet.',
  restartCheck: 'VerdienCheck opnieuw doen',
  next: 'Verder',
  otherCountry: 'Deze VerdienCheck is nu beschikbaar voor Nederland.',
  packUnavailable: 'De berekening voor 2026 is nog niet beschikbaar.',
  notCalculated: 'Nog niet berekend',
  needMore: 'We hebben nog iets van je nodig.',
  expectedResult: 'Wat ongeveer overblijft',
  expectedTurnover: 'Wat verwacht je ongeveer binnen te krijgen dit jaar?',
  expectedCosts: 'Wat geef je er ongeveer aan uit dit jaar?',
  extraResult: 'Extra resultaat (na relevante kosten)',
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
  perMonth: 'Gemiddeld is dat ongeveer … per maand extra over.',
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
  estimateOk: 'Een schatting is goed.',
  yearlyHint:
    'Vul het bedrag per jaar in. Weet je alleen per maand? Tel dan twaalf maanden bij elkaar, bijvoorbeeld €1.800 × 12.',
  moneyExplain:
    'Wat binnenkomt is omzet of commissie. Wat jij eraan uitgeeft zijn kosten. Wat overblijft is resultaat, nog zonder belasting.',
  progressAlmost: 'Bijna klaar',
  progressDone: 'Klaar',
  progressOngoing: 'Nog een paar vragen',
  progressMoney: 'Vragen over je geld',
  startSellingNeedsAccount:
    'Inloggen is alleen om te gaan verkopen. Je VerdienCheck-antwoorden gaan niet naar je account.',
  registrationKvkLabel: 'Kamer van Koophandel (KVK)',
  registrationVatLabel: 'Btw',
  registrationKorLabel: 'Kleineondernemersregeling (KOR)',
  uwvBenefitUnknownHint:
    'Weet je de naam niet? Kies dat hieronder. Gok niet.',
  keepEstimatePrefix: 'Van €',
  keepEstimateMiddle: ' extra resultaat houd je naar schatting ongeveer €',
  keepEstimateSuffix: ' over.',
  quickCheckDone: 'Dat was je snelle VerdienCheck. Je mag hier stoppen.',
  moneyPrompt:
    'Benieuwd wat extra verdienen voor je geld betekent?',
  moneyYes: 'Bereken mijn geld',
  moneyNo: 'Nee, dit is genoeg',
  periodYear: 'Per jaar',
  periodMonth: 'Per maand',
  monthToYearHint: 'We maken er een jaarbedrag van (×12). Geen vakantiegeld of bonus erbij, tenzij je dat zelf meerekent.',
  currentIncomeUnknown: 'Weet ik niet',
  otherIncomeTitle: 'Heb je daarnaast nog ander inkomen?',
  otherIncomeAmount: 'Ongeveer hoeveel extra, per jaar of per maand zoals hierboven?',
  advancedAccuracy: 'Ik wil nauwkeuriger rekenen',
  advancedAccuracyExplain:
    'Dit zijn bedragen van je jaaropgave of aangifte. Ze maken de schatting preciezer. Je hoeft ze niet in te vullen.',
  extraResultExplain:
    'Kies hoeveel extra resultaat je wilt toetsen. Resultaat is wat overblijft nadat relevante kosten eraf zijn — niet je omzet.',
  scenarioResultHint: 'Dit is je extra resultaat nadat relevante kosten eraf zijn.',
  costsCountTitle: 'Je relevante kosten tellen mee',
  costsCountBody:
    'Niet je hele omzet is automatisch je resultaat. Kosten die je maakt om je inkomsten te verdienen kunnen, als ze volgens de regels aftrekbaar zijn, je belastbare resultaat verlagen.',
  costsCountEngine:
    'Door je inkomsten en kosten goed bij te houden zie je beter wat je werkelijk verdient. VerdienCheck rekent daarna met dat resultaat, niet simpelweg met je totale verkoopbedrag.',
  costsAreRealExpenses:
    'Kosten verlagen je belastbare resultaat, maar het blijven natuurlijk uitgaven die je daadwerkelijk hebt gemaakt.',
  receiptsNote: 'Bewaar je bonnetjes en facturen.',
  whatIsResultTitle: 'Wat is resultaat?',
  whatIsResultBody:
    'Misschien denk je dat je belasting betaalt over alles wat je verkoopt. Dat is niet automatisch zo. Je betaalt niet automatisch belasting over alles wat een klant aan je betaalt. Over het fiscaal relevante resultaat berekenen we daarna wat belasting en toeslagen doen.',
  resultExampleCaption: 'Voorbeeld, geen persoonlijke berekening:',
  knowMyResult: 'Ik weet mijn resultaat',
  calculateFromRevenueCosts: 'Bereken uit omzet en kosten',
  helperRevenueLabel: 'Wat verwacht je te verkopen?',
  helperCostsLabel: 'Relevante kosten',
  helperCostsUnknown: 'Ik weet mijn kosten niet',
  helperResultLabel: 'Jouw resultaat vóór belasting',
  helperUnknownCostsNote:
    'Je kosten zijn niet bekend. We nemen ze niet als €0 mee. Vul kosten in, of kies een resultaat als je dat wel weet.',
  helperNegativeNote:
    'Je opgegeven kosten zijn hoger dan je omzet. Je extra resultaat is daardoor negatief. We rekenen dit nog niet door als extra vooruitgang.',
  helperZeroNote: 'Je extra resultaat is €0. We rekenen dit niet als extra vooruitgang.',
  helperInvestmentNote:
    'Heb je grotere aankopen gedaan voor je werkzaamheden? Die kunnen fiscaal anders worden behandeld, bijvoorbeeld via afschrijving. Zet die niet als volledige aftrek in dit veld. Bekijk de uitleg of gebruik Nauwkeuriger rekenen.',
  helperCostExamples:
    'Denk bijvoorbeeld aan kosten die je zakelijk maakt voor wat je verkoopt, zoals ingrediënten of materialen, verpakking, verzending, of andere aantoonbare zakelijke kosten. Of en hoeveel je fiscaal mag aftrekken hangt af van het soort kosten en jouw situatie.',
  helperPartialCostsNote:
    'Sommige kosten zijn gedeeltelijk aftrekbaar of moeten over meerdere jaren worden verdeeld. Niet alle kosten zijn aftrekbaar.',
  helperAwaiting: 'Vul omzet en relevante aftrekbare kosten in. Je huidige situatie blijft staan.',
  fromSaleToKeptTitle: 'Van verkoop naar wat je extra overhoudt',
  helperProgressLead: 'Van',
  helperProgressMid:
    'extra verkoop houd je, na je opgegeven kosten, geschatte belasting en veranderingen in toeslagen, ongeveer',
  helperProgressEnd: 'extra over.',
  quickInsightTitle: 'Wat houd je écht over?',
  quickInsightAfterResult:
    'Over dat resultaat berekent VerdienCheck wat belasting, Zvw en veranderingen in je toeslagen voor jouw situatie betekenen.',
  quickInsightThenNet:
    'Daarna zie je wat je werkelijk extra overhoudt per maand en per jaar.',
  startForMySituation: 'Bereken wat ik overhoud',
  kostenInfoLabel: 'Uitleg over omzet, kosten en resultaat',
  kostenInfoBody:
    'Omzet is wat je van klanten ontvangt. Kosten zijn uitgaven die je maakt om die inkomsten te verdienen. Alleen kosten die volgens de regels aftrekbaar zijn, kunnen je fiscale resultaat verlagen. Sommige grotere aankopen worden niet altijd volledig in één jaar afgetrokken.',
  youSellLabel: 'Je verkoopt',
  minusLabel: 'minus',
  resultBeforeTaxLabel: 'Resultaat vóór belasting',
  taxAndZvwChainLabel: 'Belasting + Zvw',
  allowanceChangeChainLabel: 'Verandering toeslagen',
  reallyKeepExtraLabel: 'Werkelijk extra over',
  helperCostsHint:
    'Denk aan kosten die je maakt om je producten of diensten te kunnen verkopen.',
  splitCostsCta: 'Kosten uitsplitsen',
  hideSplitCostsCta: 'Eenvoudig bedrag',
  costCatMaterials: 'Materialen / ingrediënten',
  costCatPackaging: 'Verpakking',
  costCatPlatform: 'Platform- en betaalkosten',
  costCatDelivery: 'Bezorging / vervoer',
  costCatEquipment: 'Apparatuur / gereedschap',
  costCatMarketing: 'Marketing',
  costCatOther: 'Overige kosten',
  userSpendLabel: 'Wat je hebt uitgegeven',
  deductibleAmountLabel: 'Aftrekbaar dit jaar, als dat volgens de regels zo is',
  ordinaryCostLabel: 'Gewone kostenpost',
  investmentCostLabel: 'Investering',
  investmentQuestion: 'Is dit een gewone kostenpost of een investering?',
  investmentExplain:
    'Sommige grotere aankopen die je meerdere jaren gebruikt, trek je fiscaal niet altijd in één keer af.',
  investmentYearAsk: 'Welk bedrag is dit jaar aftrekbaar, als je dat weet?',
  investmentUnknownNote: 'Nog niet precies te berekenen',
  receiptsCalloutTitle: 'Bewaar je bonnetjes en facturen.',
  receiptsCalloutBody:
    'Je kunt later moeten laten zien dat kosten écht zijn gemaakt voor het werk. HomeCheff bepaalt niet of kosten aftrekbaar zijn.',
  vatSeparationNote:
    'Btw blijft een aparte vraag. Als je btw via de btw-aangifte kunt terugvragen, reken je inkomstenbelasting-kosten meestal zonder die btw. Kun je geen btw aftrekken, dan kunnen kosten inclusief btw relevant zijn. Gok dat niet.',
  notWholeTurnover:
    'Netjes verkopen betekent niet dat alles wat binnenkomt automatisch je resultaat is.',
  keepRecordsEarn:
    'Je relevante kosten tellen mee. Daarna laat VerdienCheck zien wat belasting en toeslagen met jouw resultaat doen.',
  keepOverviewPrompt: 'Wil je ontdekken of mensen willen kopen wat jij maakt of kunt?',
  sellViaHomecheff: 'Verkoop via HomeCheff',
  placeFirstOffer: 'Plaats mijn eerste aanbod',
  placeNewOffer: 'Plaats een nieuw aanbod',
  beginSelling: 'Begin met verkopen',
  introNoAccount: 'Geen account nodig.',
  ctaPromptFood: 'Klaar om te ontdekken of mensen jouw eten willen bestellen?',
  ctaPromptGarden: 'Maak van wat je kweekt je eerste verkoop.',
  ctaPromptMake: 'Ontdek of mensen willen kopen wat jij maakt.',
  ctaPromptService: 'Zet je talent om in extra inkomen.',
  ctaPromptDefault: 'Wil je ontdekken of mensen willen kopen wat jij maakt of kunt?',
  growthBeginSmall: 'Begin klein. Groei als het aanslaat.',
  growthStepOffer: 'Eerste aanbod',
  growthStepCustomer: 'Eerste klant',
  growthStepReviews: 'Reviews',
  growthStepRepeat: 'Terugkerende klanten',
  growthStepName: 'Eigen naam opbouwen',
  growthStepProfessional: 'Professioneler verkopen',
  growthWhenSalesGrow:
    'Groeit je verkoop? HomeCheff laat zien welke volgende stappen relevant kunnen worden.',
  affiliateDiscoverLink: 'Bekijk hoe je met HomeCheff kunt verdienen als affiliate',
  growthSellingMessage:
    'Begin klein. Groei als het aanslaat. Groeit je verkoop? HomeCheff laat zien welke volgende stappen relevant kunnen worden.',
  moreExplanation: 'Meer uitleg',
  exampleRevenueLabel: 'Verkocht',
  exampleCostsLabel: 'Relevante aftrekbare kosten',
  exampleResultLabel: 'Resultaat vóór belasting',
  exampleRevenueAmount: '€10.000',
  exampleCostsAmount: '− €4.000',
  exampleResultAmount: '€6.000',
  officialSellingThought:
    'Netjes verkopen betekent niet dat je belasting betaalt over alles wat binnenkomt.',
  moneyResultTitle: 'Je gaat erop vooruit',
  monthlyFromYearNote:
    'Gemiddeld is dat het jaarbedrag gedeeld door 12. Dat is niet het moment waarop belasting wordt verrekend.',
  moneyPhaseNowTitle: 'Eerst je situatie nu',
  moneyPhaseNowBody:
    'Daarna kun je zelf bedragen proberen en direct zien hoeveel je ongeveer extra overhoudt.',
  baselineCompleteTitle: 'Je uitgangssituatie is compleet',
  baselineEstablished: 'Dit is je huidige situatie. Hierna toetsen we extra verdienen.',
  scenarioSwitchHint: 'Je huidige situatie blijft staan. Kies een ander bedrag om te vergelijken.',
  moneyDone: 'Dat was je VerdienCheck.',
  closeCheck: 'VerdienCheck afsluiten',
  restartFromStart: 'Opnieuw beginnen',
  restartCompleted: 'VerdienCheck opnieuw doen',
  restartConfirmTitle: 'Opnieuw beginnen?',
  restartConfirmBody: 'Je ingevulde antwoorden van deze VerdienCheck worden gewist.',
  restartConfirmCancel: 'Annuleren',
  restartConfirmConfirm: 'Opnieuw beginnen',
  resumeHint: 'Je hebt al antwoorden ingevuld. Je kunt verdergaan of opnieuw beginnen.',
  nowHeading: 'Nu',
  laterHeading: 'Later / als je groeit',
  comparisonHeading: 'Vergelijk extra resultaat',
  comparisonNet: 'Naar schatting extra over',
  comparisonMonth: 'Gemiddeld per maand',
  currentIncomeInvalid: 'Vul een bedrag in, of kies dat je het niet weet.',
  incomeGross: 'Bruto',
  incomeNet: 'Netto',
  applyCustomAmount: 'Toepassen',
  situationNowTitle: 'Dit is je situatie nu',
  viewExtraScenarioCta: 'Bekijk wat extra verdienen doet',
  notYetCalculable: 'Nog niet te berekenen',
  estimatedEntitlement: 'Geschat recht volgens je ingevulde situatie',
  extraTaxAndContributions: 'Extra belasting en bijdragen',
  extraIncomeTax: 'Extra inkomstenbelasting',
  zvwContributionLabel: 'Zvw-bijdrage',
  setAsidePrefix: 'Zet hiervoor ongeveer €',
  setAsideSuffix: ' opzij.',
  totalAllowances: 'Totaal toeslagen',
  allowanceChange: 'Toeslagenverandering',
  netExtraKeepTitle: 'Wat houd je extra over?',
  whatChangesTitle: 'Wat verandert?',
  incomeHeading: 'Inkomen',
  allowancesHeading: 'Toeslagen',
  grossIncomeLabel: 'Bruto inkomen',
  perYearShort: '/ jaar',
  perMonthShort: '/ maand',
  netInputEstimateNote:
    'Met netto maken we een schatting van je bruto jaarinkomen. Dat is geen loonstrookberekening.',
  netInputAowNote:
    'In het jaar dat je AOW krijgt, kunnen we netto niet betrouwbaar terugrekenen. Vul bruto in.',
  extraTaxReserveTitle: 'Extra belasting en bijdragen',
  shareAction: 'Deel VerdienCheck',
  shareTitle: 'VerdienCheck | HomeCheff',
  shareMessage:
    'Wat houd je echt extra over als je bijverdient? Bereken het met de HomeCheff VerdienCheck.',
  shareAfterResult: 'Ken je iemand die wil weten wat die écht zou overhouden?',
  steps: {
    jurisdiction: {
      title: 'Woon je in Nederland?',
      options: { NL: 'Ja, in Nederland', OTHER: 'Nee, ergens anders' },
    },
    activity: {
      title: 'Waarmee wil je iets bijverdienen?',
      options: {
        MAKE: 'Iets verkopen',
        FOOD: 'Eten of drinken verkopen',
        SERVICE: 'Een dienst of klus aanbieden',
        AFFILIATE: 'Commissie verdienen door iets te delen of aan te brengen',
        GARDEN: 'Iets uit mijn tuin verkopen',
        OTHER: 'Iets anders',
        UNKNOWN: 'Ik weet het nog niet precies',
      },
    },
    growthStart: {
      title: 'Hoe wil je beginnen?',
      options: {
        TRYING_OUT: 'Eerst eens proberen',
        OCCASIONAL_EARNING: 'Af en toe iets verdienen',
        REGULAR_EARNING: 'Regelmatig bijverdienen',
        SERIOUS_SIDE_INCOME: 'Serieus bijverdienen',
        BUILDING_BUSINESS: 'Een onderneming opbouwen',
      },
    },
    situation: {
      title: 'Welke situatie past het beste bij jou?',
      help: 'Kies wat het meest klopt. Weet je het niet zeker, kies dat. UWV gaat over werkloosheid en arbeidsongeschiktheid. Bijstand komt van je gemeente.',
      options: {
        EMPLOYEE: 'Ik werk in loondienst',
        WW: 'Ik krijg WW (werkloosheid)',
        BIJSTAND: 'Ik krijg bijstand van de gemeente',
        OTHER_UWV: 'Ik krijg geld van UWV',
        EXISTING_ENTREPRENEUR: 'Ik ben al ondernemer',
        NONE: 'Geen van deze / ik weet het niet zeker',
        OTHER: 'Geen van deze / ik weet het niet zeker',
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
        UNKNOWN: 'Ik weet het niet',
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
    dutchHealthInsurance: {
      title: 'Heb je een Nederlandse zorgverzekering?',
      help: 'Zorgtoeslag is alleen mogelijk met een Nederlandse basisverzekering. Weet je het niet, kies dat. Gok niet.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
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
      title: 'Wat is ongeveer het inkomen van je toeslagpartner?',
      help: 'Toeslagen noemen dit toetsingsinkomen. Een schatting is goed. Weet je alleen per maand? Tel twaalf maanden bij elkaar. Jouw extra verdienste telt hier niet bij op.',
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
      title: 'Hoe vaak denk je dit ongeveer te verkopen?',
      options: {
        ONE_OFF: 'Eenmalig / één keer per jaar',
        OCCASIONAL_RECURRING: 'Een paar keer per jaar',
        REGULAR: 'Meerdere keren per jaar / regelmatig',
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
    incomeBases: {
      title: 'Gegevens uit je jaaropgave of aangifte',
      help: 'Alleen als je nauwkeuriger wilt rekenen. Dit zijn verschillende bedragen. Kopieer niet hetzelfde getal in elk veld.',
    },
    assets: {
      title: 'Is je spaargeld laag genoeg voor zorgtoeslag?',
      help: 'Toeslagen kijken naar vermogen, zoals spaargeld. Weet je de grens niet, kies dat je het niet weet.',
      options: {
        ELIGIBLE: 'Ja, mijn spaargeld is laag genoeg',
        NOT_ELIGIBLE: 'Nee, ik heb te veel spaargeld of vermogen',
        UNKNOWN: 'Ik weet het niet',
      },
    },
    rentsHome: {
      title: 'Huur je een woning?',
      help: 'Alleen nodig voor huurtoeslag. Koop of inwonen telt hier niet als huur.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
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
    hasChildren: {
      title: 'Heb je kinderen?',
      help: 'Nodig voor kindgebonden budget en kinderopvangtoeslag. Leeftijden vragen we alleen als je ja zegt.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
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
    usesChildcare: {
      title: 'Gebruik je kinderopvang?',
      help: 'Alleen nodig voor kinderopvangtoeslag. Zonder opvang slaan we deze vragen over.',
      options: { YES: 'Ja', NO: 'Nee', UNKNOWN: 'Ik weet het niet' },
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
    currentIncome: {
      title: 'Wat verdien je nu ongeveer?',
      help: 'Dit is je huidige situatie, vóór extra bijverdienen. Een schatting is goed. Weet je het niet, zeg dat. Vul hetzelfde bedrag niet meerdere keren in.',
      options: {
        NO: 'Nee',
        YES: 'Ja',
        UNKNOWN: 'Weet ik niet',
      },
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
    scenario: {
      title: 'Wat als je extra resultaat verdient?',
      help: 'Je huidige situatie staat vast. Nu toetsen we extra resultaat: wat overblijft nadat relevante kosten eraf zijn.',
    },
    result: { title: 'Jouw uitkomst' },
  },
};

const EN: VerdienCheckCopy = {
  pageTitle: 'Earn without surprises',
  chromeTitle: 'VerdienCheck',
  intro: 'What would you actually keep if you started selling?',
  introReassurance: 'See what costs, tax and allowances mean for your situation.',
  introGrowth:
    'If you then continue through HomeCheff, we help you understand later steps as your activity grows. We do not file your taxes or register you with authorities.',
  disclaimer:
    'This is an estimate and personal explanation based on what you entered. You remain responsible for what you report and arrange. Estimate for 2026.',
  back: 'Back',
  leaveProduct: 'Close VerdienCheck',
  startSelling: 'Create your first listing',
  discoverHomecheff: 'Discover HomeCheff',
  discoverHomecheffBody:
    'Want to get started? You can sell or offer a service through HomeCheff. As you grow, we help you understand what becomes relevant for your situation.',
  beginViaHomecheff: 'Start through HomeCheff',
  affiliatePartnerCta: 'See the partner programme',
  affiliatePartnerBody:
    'HomeCheff also has a partner programme where you can earn commission. That is optional and not required for this result.',
  restNotToday: 'You do not need to arrange everything now.',
  affiliateReviewNote:
    'Commission usually has to be reported in your tax return. Whether it is extra work or a business depends on how you work. HomeCheff does not invent that.',
  restartCheck: 'Do VerdienCheck again',
  next: 'Next',
  otherCountry: 'This earning check is currently available for the Netherlands.',
  packUnavailable: 'The 2026 calculation is not available yet.',
  notCalculated: 'Not calculated yet',
  needMore: 'We still need something from you.',
  expectedResult: 'What is roughly left',
  expectedTurnover: 'About how much do you expect to receive this year?',
  expectedCosts: 'About how much will you spend on this this year?',
  extraResult: 'Extra result (after relevant costs)',
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
  perMonth: 'On average that is about … extra per month.',
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
  estimateOk: 'An estimate is fine.',
  yearlyHint:
    'Enter the amount per year. If you only know a monthly amount, add twelve months, for example €1,800 × 12.',
  moneyExplain:
    'What comes in is turnover or commission. What you spend are costs. What is left is the result, before tax.',
  progressAlmost: 'Almost done',
  progressDone: 'Done',
  progressOngoing: 'A few more questions',
  progressMoney: 'Questions about your money',
  startSellingNeedsAccount:
    'Sign-in is only to start selling. Your VerdienCheck answers are not saved to your account.',
  registrationKvkLabel: 'Chamber of Commerce (KVK)',
  registrationVatLabel: 'VAT',
  registrationKorLabel: 'Small-business VAT scheme (KOR)',
  uwvBenefitUnknownHint:
    'If you do not know the name, choose that below. Do not guess.',
  keepEstimatePrefix: 'From €',
  keepEstimateMiddle: ' extra result you keep an estimated €',
  keepEstimateSuffix: '.',
  quickCheckDone: 'That was your quick VerdienCheck. You can stop here.',
  moneyPrompt:
    'Curious what extra earnings would mean for your money?',
  moneyYes: 'Calculate my money',
  moneyNo: 'No, this is enough',
  periodYear: 'Per year',
  periodMonth: 'Per month',
  monthToYearHint:
    'We turn this into a yearly amount (×12). No holiday pay or bonus unless you include it yourself.',
  currentIncomeUnknown: 'I don’t know',
  otherIncomeTitle: 'Do you have any other income besides this?',
  otherIncomeAmount: 'About how much extra, using the same period as above?',
  advancedAccuracy: 'I want a more precise calculation',
  advancedAccuracyExplain:
    'These figures come from your annual statement or tax return. They make the estimate more precise. You do not have to fill them in.',
  extraResultExplain:
    'Choose how much extra result you want to test. Result is what remains after relevant costs — not turnover.',
  scenarioResultHint: 'This is your extra result after relevant costs.',
  costsCountTitle: 'Your relevant costs count too',
  costsCountBody:
    'Not all of your sales are automatically your result. Costs you make to earn that income can, if they are deductible under the rules, lower your taxable result.',
  costsCountEngine:
    'By keeping track of income and costs you see more clearly what you actually earn. VerdienCheck then works with that result, not simply with your total sales amount.',
  costsAreRealExpenses:
    'Costs lower your taxable result, but they remain real expenses you actually made.',
  receiptsNote: 'Keep your receipts and invoices.',
  whatIsResultTitle: 'What is result?',
  whatIsResultBody:
    'You might think you pay tax on everything you sell. That is not automatic. You do not automatically pay tax on everything a customer pays you. We then calculate what tax and allowances do to the fiscally relevant result.',
  resultExampleCaption: 'Example only, not your personal calculation:',
  knowMyResult: 'I know my result',
  calculateFromRevenueCosts: 'Calculate from sales and costs',
  helperRevenueLabel: 'How much do you expect to sell?',
  helperCostsLabel: 'Relevant costs',
  helperCostsUnknown: 'I do not know my costs',
  helperResultLabel: 'Your result before tax',
  helperUnknownCostsNote:
    'Your costs are not known. We do not treat them as €0. Enter costs, or choose a result if you know it.',
  helperNegativeNote:
    'Your entered costs are higher than your sales. Your extra result is therefore negative. We do not yet run this as extra progress.',
  helperZeroNote: 'Your extra result is €0. We do not count this as extra progress.',
  helperInvestmentNote:
    'Did you make larger purchases for this work? Those can be treated differently for tax, for example through depreciation. Do not enter them here as a full deduction. See the explanation or use a more precise calculation.',
  helperCostExamples:
    'Think of costs you make for what you sell, such as ingredients or materials, packaging, shipping, or other demonstrable business costs. Whether and how much you may deduct depends on the type of cost and your situation.',
  helperPartialCostsNote:
    'Some costs are only partly deductible or must be spread over several years. Not all costs are deductible.',
  helperAwaiting: 'Enter sales and relevant allowable costs. Your current situation stays.',
  fromSaleToKeptTitle: 'From sales to what you keep extra',
  helperProgressLead: 'From',
  helperProgressMid:
    'extra sales you keep, after the costs you entered, estimated tax and changes in allowances, about',
  helperProgressEnd: 'extra.',
  quickInsightTitle: 'What do you actually keep?',
  quickInsightAfterResult:
    'On that result, VerdienCheck calculates what tax, Zvw and changes in your allowances mean for your situation.',
  quickInsightThenNet:
    'Then you see what you actually keep extra per month and per year.',
  startForMySituation: 'Calculate what I would keep',
  kostenInfoLabel: 'Explanation of sales, costs and result',
  kostenInfoBody:
    'Turnover is what you receive from customers. Costs are expenses you make to earn that income. Only costs that are deductible under the rules can lower your fiscal result. Some larger purchases are not always fully deducted in one year.',
  youSellLabel: 'You sell',
  minusLabel: 'minus',
  resultBeforeTaxLabel: 'Result before tax',
  taxAndZvwChainLabel: 'Tax + Zvw',
  allowanceChangeChainLabel: 'Change in allowances',
  reallyKeepExtraLabel: 'Really kept extra',
  helperCostsHint:
    'Think of costs you make so you can sell your products or services.',
  splitCostsCta: 'Break down costs',
  hideSplitCostsCta: 'Simple amount',
  costCatMaterials: 'Materials / ingredients',
  costCatPackaging: 'Packaging',
  costCatPlatform: 'Platform and payment fees',
  costCatDelivery: 'Delivery / transport',
  costCatEquipment: 'Equipment / tools',
  costCatMarketing: 'Marketing',
  costCatOther: 'Other costs',
  userSpendLabel: 'What you spent',
  deductibleAmountLabel: 'Deductible this year, if the rules allow it',
  ordinaryCostLabel: 'Ordinary expense',
  investmentCostLabel: 'Investment',
  investmentQuestion: 'Is this an ordinary expense or an investment?',
  investmentExplain:
    'Some larger purchases that you use for several years are not always deducted in full in one year.',
  investmentYearAsk: 'What amount is deductible this year, if you know?',
  investmentUnknownNote: 'Not yet precisely calculable',
  receiptsCalloutTitle: 'Keep your receipts and invoices.',
  receiptsCalloutBody:
    'You may need to be able to show that costs were actually made for the work. HomeCheff does not decide whether costs are deductible.',
  vatSeparationNote:
    'VAT stays a separate question. If you can reclaim VAT through a VAT return, income-tax costs are generally considered excluding that VAT. If you cannot deduct VAT, costs may be relevant including VAT. Do not guess.',
  notWholeTurnover:
    'Selling properly does not mean that everything that comes in is automatically your result.',
  keepRecordsEarn:
    'Your relevant costs count. Then VerdienCheck shows what tax and allowances do with your result.',
  keepOverviewPrompt: 'Want to find out whether people would buy what you make or can do?',
  sellViaHomecheff: 'Sell via HomeCheff',
  placeFirstOffer: 'Place my first listing',
  placeNewOffer: 'Place a new listing',
  beginSelling: 'Start selling',
  introNoAccount: 'No account needed.',
  ctaPromptFood: 'Ready to find out whether people want to order your food?',
  ctaPromptGarden: 'Turn what you grow into your first sale.',
  ctaPromptMake: 'Find out whether people want to buy what you make.',
  ctaPromptService: 'Turn your talent into extra income.',
  ctaPromptDefault: 'Want to find out whether people would buy what you make or can do?',
  growthBeginSmall: 'Start small. Grow if it takes off.',
  growthStepOffer: 'First listing',
  growthStepCustomer: 'First customer',
  growthStepReviews: 'Reviews',
  growthStepRepeat: 'Returning customers',
  growthStepName: 'Build your own name',
  growthStepProfessional: 'Sell more professionally',
  growthWhenSalesGrow:
    'If your sales grow, HomeCheff shows which next steps may become relevant.',
  affiliateDiscoverLink: 'See how you can earn with HomeCheff as an affiliate',
  growthSellingMessage:
    'Start small. Grow if it takes off. If your sales grow, HomeCheff shows which next steps may become relevant.',
  moreExplanation: 'More explanation',
  exampleRevenueLabel: 'Sold',
  exampleCostsLabel: 'Relevant allowable costs',
  exampleResultLabel: 'Result before tax',
  exampleRevenueAmount: '€10,000',
  exampleCostsAmount: '− €4,000',
  exampleResultAmount: '€6,000',
  officialSellingThought:
    'Selling properly does not mean you pay tax on everything that comes in.',
  moneyResultTitle: 'You come out ahead',
  monthlyFromYearNote:
    'On average that is the yearly amount divided by 12. That is not when tax is actually settled.',
  moneyPhaseNowTitle: 'Your situation now comes first',
  moneyPhaseNowBody:
    'After that you can try amounts yourself and immediately see how much extra you would roughly keep.',
  baselineCompleteTitle: 'Your current situation is complete',
  baselineEstablished: 'This is your current situation. Next we test extra earnings.',
  scenarioSwitchHint: 'Your current situation stays. Pick another amount to compare.',
  moneyDone: 'That was your VerdienCheck.',
  closeCheck: 'Close VerdienCheck',
  restartFromStart: 'Start again',
  restartCompleted: 'Do VerdienCheck again',
  restartConfirmTitle: 'Start again?',
  restartConfirmBody: 'Your answers from this VerdienCheck will be cleared.',
  restartConfirmCancel: 'Cancel',
  restartConfirmConfirm: 'Start again',
  resumeHint: 'You already entered answers. You can continue or start again.',
  nowHeading: 'Now',
  laterHeading: 'Later / as you grow',
  comparisonHeading: 'Compare extra result',
  comparisonNet: 'Estimated extra kept',
  comparisonMonth: 'Average per month',
  currentIncomeInvalid: 'Enter an amount, or choose that you do not know.',
  incomeGross: 'Gross',
  incomeNet: 'Net',
  applyCustomAmount: 'Apply',
  situationNowTitle: 'This is your situation now',
  viewExtraScenarioCta: 'See what extra earning does',
  notYetCalculable: 'Not yet calculable',
  estimatedEntitlement: 'Estimated entitlement based on the situation you entered',
  extraTaxAndContributions: 'Extra tax and contributions',
  extraIncomeTax: 'Extra income tax',
  zvwContributionLabel: 'Zvw contribution',
  setAsidePrefix: 'Set aside about €',
  setAsideSuffix: ' for this.',
  totalAllowances: 'Total allowances',
  allowanceChange: 'Allowance change',
  netExtraKeepTitle: 'How much extra do you keep?',
  whatChangesTitle: 'What changes?',
  incomeHeading: 'Income',
  allowancesHeading: 'Allowances',
  grossIncomeLabel: 'Gross income',
  perYearShort: '/ year',
  perMonthShort: '/ month',
  netInputEstimateNote:
    'With net pay we estimate your gross annual income. This is not a payslip calculation.',
  netInputAowNote:
    'In the year you reach state pension age we cannot reliably reverse net pay. Enter gross instead.',
  extraTaxReserveTitle: 'Extra tax and contributions',
  shareAction: 'Share VerdienCheck',
  shareTitle: 'VerdienCheck | HomeCheff',
  shareMessage:
    'What do you actually keep extra if you earn on the side? Work it out with the HomeCheff VerdienCheck.',
  shareAfterResult: 'Know someone who wants to see what they would actually keep?',
  steps: {
    jurisdiction: {
      title: 'Do you live in the Netherlands?',
      options: { NL: 'Yes, in the Netherlands', OTHER: 'No, somewhere else' },
    },
    activity: {
      title: 'What do you want to earn extra with?',
      options: {
        MAKE: 'Sell something',
        FOOD: 'Sell food or drinks',
        SERVICE: 'Offer a service or job',
        AFFILIATE: 'Earn commission by sharing or referring',
        GARDEN: 'Sell something from my garden',
        OTHER: 'Something else',
        UNKNOWN: 'I don’t know yet',
      },
    },
    growthStart: {
      title: 'How do you want to start?',
      options: {
        TRYING_OUT: 'Just try it first',
        OCCASIONAL_EARNING: 'Earn something now and then',
        REGULAR_EARNING: 'Earn extra regularly',
        SERIOUS_SIDE_INCOME: 'Earn serious extra income',
        BUILDING_BUSINESS: 'Build a business',
      },
    },
    situation: {
      title: 'Which situation fits you best?',
      help: 'Choose what fits most. If you are not sure, say so. UWV handles unemployment and disability. Social assistance comes from your municipality.',
      options: {
        EMPLOYEE: 'I work as an employee',
        WW: 'I receive WW (unemployment benefit)',
        BIJSTAND: 'I receive social assistance from the municipality',
        OTHER_UWV: 'I receive money from UWV',
        EXISTING_ENTREPRENEUR: 'I already have a business',
        NONE: 'None of these / I am not sure',
        OTHER: 'None of these / I am not sure',
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
        UNKNOWN: 'I don’t know',
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
    dutchHealthInsurance: {
      title: 'Do you have Dutch health insurance?',
      help: 'Healthcare allowance is only possible with Dutch basic insurance. If you do not know, say so. Do not guess.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
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
      title: 'About how much does your allowance partner earn?',
      help: 'Allowances call this assessment income. An estimate is fine. If you only know a monthly amount, add twelve months. Your extra earnings are not added here.',
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
      title: 'About how often do you think you will sell this?',
      options: {
        ONE_OFF: 'Once / once a year',
        OCCASIONAL_RECURRING: 'A few times a year',
        REGULAR: 'Multiple times a year / regularly',
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
    incomeBases: {
      title: 'Figures from your annual statement or tax return',
      help: 'Only if you want a more precise calculation. These are different amounts. Do not copy the same number into every field.',
    },
    assets: {
      title: 'Are you within the asset limit for healthcare allowance?',
      options: {
        ELIGIBLE: 'Yes, my assets are low enough',
        NOT_ELIGIBLE: 'No, my assets are too high',
        UNKNOWN: 'I don’t know',
      },
    },
    rentsHome: {
      title: 'Do you rent your home?',
      help: 'Only needed for rent allowance. Buying or living with family does not count as rent here.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
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
    hasChildren: {
      title: 'Do you have children?',
      help: 'Needed for child budget and childcare allowance. We only ask ages if you say yes.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
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
    usesChildcare: {
      title: 'Do you use childcare?',
      help: 'Only needed for childcare allowance. Without childcare we skip these questions.',
      options: { YES: 'Yes', NO: 'No', UNKNOWN: 'I don’t know' },
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
    currentIncome: {
      title: 'About how much do you earn now?',
      help: 'This is your current situation, before extra earnings. An estimate is fine. If you do not know, say so. Do not enter the same amount several times.',
      options: {
        NO: 'No',
        YES: 'Yes',
        UNKNOWN: 'I don’t know',
      },
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
    scenario: {
      title: 'What if you earn extra result?',
      help: 'Your current situation is set. Now we test extra result: what remains after relevant costs.',
    },
    result: { title: 'Your outcome' },
  },
};

export function getVerdienCheckCopy(language: UiLanguage): VerdienCheckCopy {
  return language === 'en' ? EN : NL;
}
