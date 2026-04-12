/**
 * Fase 2: cluster- en city-SEO (nl/en). Geen import van seoLandingSources (geen cyclus).
 */
type Bi = { nl: string; en: string };

const SHARED_LINKS = {
  linkCooking: {
    nl: "gids geld verdienen met thuisgekookt eten",
    en: "guide to earning money with home-cooked food",
  },
  linkVerdienenZonder: {
    nl: "verdienen zonder dropshipping op HomeCheff",
    en: "earning without dropshipping on HomeCheff",
  },
  linkPlatform: {
    nl: "platform voor thuiskoks en lokale makers",
    en: "platform for home cooks and local makers",
  },
  linkGrowth: {
    nl: "Growth: lokaal klanten vinden en zichtbaarheid",
    en: "Growth: find local customers and visibility",
  },
  linkVerkopenHuis: {
    nl: "verkopen vanuit huis met vaste afspraken",
    en: "selling from home with clear agreements",
  },
  linkEtenVanuitHuis: {
    nl: "eten verkopen vanuit huis (praktische uitleg)",
    en: "selling food from home (practical guide)",
  },
  linkThuisgekookt: {
    nl: "thuisgekookt eten verkopen aan de buurt",
    en: "selling home-cooked food to your neighbourhood",
  },
  linkLokaalEten: {
    nl: "lokaal eten verkopen zonder landelijke concurrentie",
    en: "selling local food without nationwide competition",
  },
  linkZonderWebshop: {
    nl: "producten verkopen zonder webshop bouwen",
    en: "selling products without building a webshop",
  },
} satisfies Record<string, Bi>;

const etenVerkopenVanuitHuisPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Eten verkopen vanuit huis | Zonder webshop | HomeCheff",
    en: "Sell food from home | Without a webshop | HomeCheff",
  },
  metaDescription: {
    nl: "Eten verkopen vanuit huis: ophalen, buurt, regels en klanten — zonder Shopify-stress. HomeCheff helpt je lokaal starten.",
    en: "Sell food from home: pickup, neighbourhood, rules and customers — without Shopify stress. Start locally on HomeCheff.",
  },
  title: {
    nl: "Eten verkopen vanuit huis: concreet, lokaal en zonder webshop als bottleneck",
    en: "Selling food from home: concrete, local and without a webshop bottleneck",
  },
  intro: {
    nl: "Als je eten wilt verkopen vanuit huis, is de echte uitdaging niet “een site hebben”, maar vertrouwen, ritme en herhaalbare logistiek. Je concurrent is niet alleen andere thuiskoks, maar ook gemak: mensen moeten weten wat ze bestellen, wanneer ze het ophalen en waarom jouw maaltijd de moeite waard is. HomeCheff is gebouwd rond lokaal ophalen, duidelijke profielen en buurt-vraag — niet rond anonieme schaal.",
    en: "If you want to sell food from home, the real challenge is not having a website, but trust, rhythm and repeatable logistics. Your competition is not only other cooks, but convenience: people need to know what they order, when they pick up and why your meal is worth it. HomeCheff is built around local pickup, clear profiles and neighbourhood demand — not anonymous scale.",
  },
  sec1Title: {
    nl: "Waarom “producten verkopen zonder webshop” juist bij eten past",
    en: "Why selling products without a webshop fits food especially",
  },
  sec1Body: {
    nl: "Een webshop lost geen koelketen, geen ophaalvenster en geen buurt-mond-tot-mond op. Wat wél werkt is een plek waar mensen in jouw omgeving zoeken, een profiel dat vertrouwen geeft, en een flow waarin bestellen net zo simpel voelt als bij een keten — maar dan met jouw verhaal. Daarom sluit dit aan bij producten verkopen zonder webshop: je gebruikt een marketplace-profiel in plaats van maanden theme-tweaken.",
    en: "A webshop does not solve cold chain, pickup windows or neighbourhood word of mouth. What works is a place where nearby people search, a profile that builds trust, and a flow that feels as simple as a chain — but with your story. That is why selling without a webshop fits: you use a marketplace profile instead of months of theme tweaking.",
  },
  sec2Title: {
    nl: "Geld verdienen vanuit huis met eten: begin met één aanbod",
    en: "Earning from home with food: start with one offer",
  },
  sec2Body: {
    nl: "De snelste route naar inkomen is niet een groot menu, maar één gerecht of één maaltijd-lijn die je week overzichtelijk houdt. Denk aan twee vaste bakken per week, een duidelijke prijs per portie en een vaste ophaaldag. Als dat loopt, breid je uit. Zo koppel je geld verdienen vanuit huis aan iets dat je volhoudt — niet aan een Instagram-perfecte maar onrealistische planning.",
    en: "The fastest route to income is not a huge menu, but one dish or one meal line that keeps your week manageable. Think two trays per week, clear price per portion and a fixed pickup day. When that runs, you expand. That ties earning from home to something sustainable — not an Instagram-perfect but unrealistic plan.",
  },
  sec3Title: {
    nl: "Klanten vinden: lokaal beats landelijk",
    en: "Finding customers: local beats national",
  },
  sec3Body: {
    nl: "Landelijke SEO-concurrentie is duur en traag. Lokaal win je op herkenning: sportclub, schoolapp, buurtvereniging, vaste klanten die doorverwijzen. Combineer dat met zichtbaarheid op een platform waar mensen al zoeken naar eten uit de buurt. Onze Growth-pagina legt uit hoe je stap voor stap zichtbaarheid opbouwt zonder spam.",
    en: "National SEO competition is expensive and slow. You win locally on recognition: clubs, school chats, associations, referrals. Combine that with visibility where people already search for nearby food. Our Growth page explains how to build visibility step by step without spam.",
  },
  sec4Title: {
    nl: "Waarom mensen stoppen met dropshipping (en wat jij anders doet)",
    en: "Why people quit dropshipping (and what you do differently)",
  },
  sec4Body: {
    nl: "Dropshipping loopt vast op identieke producten, lage marges en geen relatie. Eten vanuit huis is het tegenovergestelde: tastbaar, persoonlijk en herhaalbaar in dezelfde postcode. Je bouwt reputatie op kwaliteit en afspraken — niet op wie de snelste advertentie heeft.",
    en: "Dropshipping hits identical products, low margins and no relationship. Food from home is the opposite: tangible, personal and repeatable in the same postcode. You build reputation on quality and agreements — not on who buys the fastest ads.",
  },
  sec5Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  sec5Body: {
    nl: "Mensen zoeken kortere ketens en meer zeggenschap: wie kookt, waar komt het vandaan, kan ik vragen stellen. Dat is geen hype-cyclus maar gedrag. Marktplaatsen die buurt en ophalen serieus nemen, passen daarbij — niet omdat “lokaal” een sticker is, maar omdat het de enige manier is om vertrouwen schaalbaar te maken zonder fabriek.",
    en: "People want shorter chains and more control: who cooks, where it comes from, can I ask questions. That is behaviour, not a hype cycle. Marketplaces that take neighbourhood and pickup seriously fit that — not because local is a sticker, but because it is how trust scales without a factory.",
  },
  sec6Title: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  sec6Body: {
    nl: "Niet omdat thuis altijd “beter” is in absolute zin, maar omdat het vaak persoonlijker is: seizoen, voorkeur, allergenen bespreekbaar, en geen anonieme schaal-keuken. Thuiskoks die communiceren en leveren wat ze beloven, krijgen vaste ritmes. Dat is precies het verschil met een eenmalige viraliteit.",
    en: "Not because home is always better in absolute terms, but because it is often more personal: season, preference, allergens discussable, no anonymous scale kitchen. Cooks who communicate and deliver what they promise get steady rhythms. That beats one-off virality.",
  },
  rp1a: {
    nl: "Wil je starten met koken voor anderen? Lees eerst de ",
    en: "Want to start cooking for others? Read the ",
  },
  rp1b: {
    nl: " — daar staan keuzes die je week haalbaar houden. Daarna sluit ",
    en: " — choices that keep your week realistic. Then connect ",
  },
  rp1c: {
    nl: " aan: regels en verwachtingen zijn onderdeel van je reputatie.",
    en: ": rules and expectations are part of your reputation.",
  },
  rp2a: {
    nl: "Klanten vinden is het moeilijkste stuk; ",
    en: "Finding customers is the hardest part; ",
  },
  rp2b: {
    nl: " helpt je denken in buurt-zichtbaarheid in plaats van dure landelijke ads. Combineer dat met ",
    en: " helps you think in neighbourhood visibility instead of expensive national ads. Combine that with ",
  },
  rp2c: {
    nl: " zodat je niet alleen “iets online zet”, maar ook weet hoe je eerste kopers wint.",
    en: " so you do not only put something online, but also know how to win first buyers.",
  },
  rp3a: {
    nl: "Wil je breder dan alleen maaltijden? Bekijk ook ",
    en: "Want to go beyond meals? See also ",
  },
  rp3b: {
    nl: " en lees ",
    en: " and read ",
  },
  rp3c: {
    nl: " voor het grotere plaatje rond lokaal verdienen.",
    en: " for the bigger picture of local earning.",
  },
  ...SHARED_LINKS,
  stepsTitle: { nl: "Stappenplan", en: "Step-by-step plan" },
  step1: {
    nl: "Kies één lijn (bijv. twee gerechten) en een vaste ophaaldag.",
    en: "Pick one line (e.g. two dishes) and a fixed pickup day.",
  },
  step2: {
    nl: "Schrijf prijs, portie, allergenen en ophaalvenster eerlijk uit.",
    en: "Write price, portion, allergens and pickup honestly.",
  },
  step3: {
    nl: "Zet je profiel en aanbod op HomeCheff met duidelijke foto’s.",
    en: "Publish your profile and listing on HomeCheff with clear photos.",
  },
  step4: {
    nl: "Vraag 5–10 testkopers in je buurt en verzamel feedback.",
    en: "Ask 5–10 neighbourhood testers and collect feedback.",
  },
  step5: {
    nl: "Schaal pas op als kwaliteit en ritme stabiel zijn.",
    en: "Scale only when quality and rhythm are stable.",
  },
  mistakesTitle: { nl: "Veelgemaakte fouten", en: "Common mistakes" },
  mistakesBody: {
    nl: "Te groot menu, vage allergenen, geen vaste ophaal-logistiek, prijs te laag voor je tijd. Liever klein en betrouwbaar.",
    en: "Huge menu, vague allergens, messy pickup, prices too low for your time. Prefer small and reliable.",
  },
  cta: {
    nl: "Begin met eten verkopen vanuit huis op HomeCheff",
    en: "Start selling food from home on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer, kies je rol en zet je eerste buurt-aanbod live.",
    en: "Sign up, pick your role and publish your first neighbourhood listing.",
  },
  hubLinkRow1: { nl: "Gerelateerde gidsen", en: "Related guides" },
  lrThuis: { nl: "Thuisgekookt eten verkopen", en: "Sell home-cooked food" },
  lrBijverdienen: { nl: "Bijverdienen vanuit huis", en: "Side income from home" },
  lrLokaal: { nl: "Lokaal eten verkopen", en: "Sell local food" },
};

const thuisgekooktEtenVerkopenPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Thuisgekookt eten verkopen | Buurt, ophalen | HomeCheff",
    en: "Sell home-cooked food | Neighbourhood, pickup | HomeCheff",
  },
  metaDescription: {
    nl: "Thuisgekookt eten verkopen: porties, ophalen, hygiëne en klanten in je buurt — praktisch en zonder marketing-bullshit.",
    en: "Sell home-cooked food: portions, pickup, hygiene and nearby customers — practical and without marketing fluff.",
  },
  title: {
    nl: "Thuisgekookt eten verkopen: vers, nabij en volgens vaste afspraken",
    en: "Selling home-cooked food: fresh, nearby and with clear agreements",
  },
  intro: {
    nl: "Thuisgekookt verkopen is geen trend-foto, maar logistiek en vertrouwen. Mensen betalen voor smaak én voor voorspelbaarheid: dezelfde kwaliteit, hetzelfde ophaalmoment, dezelfde communicatie. Als je dat snapt, hoef je niet te concurreren op wie de meeste filters heeft — je concurreert op wie het beste nakomt wat er op het scherm staat.",
    en: "Selling home-cooked is not a trend photo, but logistics and trust. People pay for taste and predictability: same quality, same pickup moment, same communication. If you understand that, you compete on who delivers what the screen promises — not on who has the most filters.",
  },
  sec1Title: {
    nl: "Wat “thuisgekookt eten verkopen” praktisch betekent",
    en: "What selling home-cooked food means in practice",
  },
  sec1Body: {
    nl: "Je standaardiseert wat kan (portie, verpakking, ophaalvenster) en je houdt ruimte voor variatie waar je sterker van wordt (seizoenspecial, wekelijkse menuwissel). Zo blijft je keuken beheersbaar en begrijpen klanten wat ze kopen. Dat is de brug tussen hobby en serieus thuisgekookt eten verkopen.",
    en: "You standardise what you can (portion, packaging, pickup window) and leave room for variation where you shine (seasonal specials, weekly swap). That keeps your kitchen manageable and buyers understand what they buy. That bridges hobby and seriously selling home-cooked food.",
  },
  sec2Title: {
    nl: "Hoe je eten verkopen vanuit huis combineert met veiligheid en vertrouwen",
    en: "How selling food from home combines with safety and trust",
  },
  sec2Body: {
    nl: "Vertrouwen komt uit details: allergenen expliciet, temperatuur en transport eerlijk benoemen, en geen mooiere foto dan de werkelijkheid. Mensen delen sneller een thuiskok die “saai betrouwbaar” is dan iemand die belooft en niet levert. Een marketplace helpt als mensen daar al zoeken, maar jouw gedrag bepaalt of ze terugkomen.",
    en: "Trust comes from details: allergens explicit, temperature and transport honest, no prettier photo than reality. People share a cook who is boring-reliable faster than someone who overpromises. A marketplace helps when people already search there, but your behaviour decides if they return.",
  },
  sec3Title: {
    nl: "Geld verdienen vanuit huis met maaltijden: marges zijn tijd",
    en: "Earning from home with meals: margins are time",
  },
  sec3Body: {
    nl: "Je grootste kostenpost is vaak niet ingrediënten maar tijd en foutmarge. Daarom werkt schaal in herhaling: vaste klanten, vaste rit, minder stress. Naast maaltijden zijn er routes via tuin of creatief werk — hou je focus strak tot je eerste ritme staat.",
    en: "Your biggest cost is often not ingredients but time and error margin. That is why scale through repetition works: regulars, steady rhythm, less stress. Beyond meals there are routes via garden or creative work — keep focus tight until your first rhythm is stable.",
  },
  sec4Title: {
    nl: "Waarom mensen stoppen met dropshipping (relevant als je “snel online” zocht)",
    en: "Why people quit dropshipping (relevant if you wanted quick online income)",
  },
  sec4Body: {
    nl: "Veel makers kwamen uit dropshipping omdat er geen merk en geen relatie was. Thuisgekookt is het tegenovergestelde: gezicht, buurt, herhaling. Je concurrent is dan niet “wie de goedkoopste import heeft”, maar “wie het meest betrouwbaar levert in dezelfde postcode”.",
    en: "Many makers came from dropshipping because there was no brand or relationship. Home-cooked is the opposite: face, neighbourhood, repeat. Your competition is then not who has the cheapest import, but who delivers most reliably in the same postcode.",
  },
  sec5Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  sec5Body: {
    nl: "Niet omdat alles “hyperlokaal” moet, maar omdat transparantie en nabijheid steeds normaler worden in voedselkeuzes. Buurtplatformen winnen wanneer ze echte makers tonen — niet alleen SKU’s.",
    en: "Not because everything must be hyper-local, but because transparency and proximity are normalising in food choices. Neighbourhood platforms win when they show real makers — not only SKUs.",
  },
  sec6Title: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  sec6Body: {
    nl: "Omdat het vaak dichter bij “eten bij iemand thuis” voelt dan bij een anonieme keten: uitlegbaar, bespreekbaar, en vaak kleinschaliger. Dat wil niet zeggen dat elke thuiskok hetzelfde is — juist niet: jouw signatuur is je voordeel.",
    en: "Because it often feels closer to eating at someone’s home than an anonymous chain: explainable, discussable, often smaller scale. That does not mean every cook is the same — on the contrary: your signature is your edge.",
  },
  rp1a: { nl: "Lees ", en: "Read " },
  rp1b: {
    nl: " als je het bredere verhaal van eten vanuit huis wilt koppelen aan logistiek. Koppel dat aan ",
    en: " if you want the broader story of food from home tied to logistics. Link that to ",
  },
  rp1c: {
    nl: " voor regels en verwachtingen rond thuiskoken.",
    en: " for rules and expectations around home cooking.",
  },
  rp2a: { nl: "Zonder ", en: "Without " },
  rp2b: {
    nl: " blijft zichtbaarheid vaak een black box. Gebruik Growth naast je eerste buurt-acties.",
    en: " visibility often stays a black box. Use Growth alongside your first neighbourhood actions.",
  },
  ...SHARED_LINKS,
  stepsTitle: { nl: "Stappenplan", en: "Step-by-step plan" },
  step1: {
    nl: "Definieer 1–2 signature gerechten met vaste prijs.",
    en: "Define 1–2 signature dishes with fixed price.",
  },
  step2: {
    nl: "Werk ophaalvensters en porties uit (incl. allergenen).",
    en: "Work out pickup windows and portions (incl. allergens).",
  },
  step3: {
    nl: "Fotografeer realistisch en beschrijf wat de klant krijgt.",
    en: "Photograph realistically and describe what buyers get.",
  },
  step4: {
    nl: "Publiceer op HomeCheff en vraag om reviews na eerste orders.",
    en: "Publish on HomeCheff and ask for reviews after first orders.",
  },
  step5: {
    nl: "Optimaliseer ritme en breid pas daarna uit.",
    en: "Optimise rhythm and only then expand.",
  },
  mistakesTitle: { nl: "Veelgemaakte fouten", en: "Common mistakes" },
  mistakesBody: {
    nl: "Te veel gerechten, onduidelijke ophaal, foto’s mooier dan de maaltijd. Hou het eerlijk en strak.",
    en: "Too many dishes, unclear pickup, photos prettier than the meal. Keep it honest and tight.",
  },
  cta: {
    nl: "Verkoop thuisgekookt eten via HomeCheff",
    en: "Sell home-cooked food on HomeCheff",
  },
  ctaSub: {
    nl: "Maak een account en zet je eerste buurt-maaltijd live.",
    en: "Create an account and publish your first neighbourhood meal.",
  },
  lrEtenHuis: { nl: "Eten verkopen vanuit huis", en: "Sell food from home" },
  lrZelfgemaakt: { nl: "Zelfgemaakt eten verkopen", en: "Sell homemade food" },
  lrLokaal: { nl: "Lokaal eten verkopen", en: "Sell local food" },
};

const bijverdienenVanuitHuisPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Bijverdienen vanuit huis | Lokaal en concreet | HomeCheff",
    en: "Side income from home | Local and concrete | HomeCheff",
  },
  metaDescription: {
    nl: "Bijverdienen vanuit huis met eten, tuin of creatief — zonder dropshipping-illusies. Start klein op HomeCheff.",
    en: "Side income from home with food, garden or creative work — without dropshipping illusions. Start small on HomeCheff.",
  },
  title: {
    nl: "Bijverdienen vanuit huis: geld verdienen vanuit huis zonder onrealistische beloftes",
    en: "Side income from home: earning from home without unrealistic promises",
  },
  intro: {
    nl: "Bijverdienen is geen magische knop: het is tijd inwisselen voor euro’s, met een aanbod dat mensen willen herhalen. Of je nu kookt, oogst of maakt — het patroon is hetzelfde: klein beginnen, duidelijke afspraken, en groei via reputatie in plaats van via advertentie-bidding op identieke producten.",
    en: "Side income is not a magic button: it is trading time for money with an offer people want to repeat. Whether you cook, harvest or make — the pattern is the same: start small, clear agreements, grow through reputation instead of ad bidding on identical products.",
  },
  sec1Title: {
    nl: "Geld verdienen vanuit huis: de drie realistische routes op HomeCheff",
    en: "Earning from home: three realistic routes on HomeCheff",
  },
  sec1Body: {
    nl: "Chef (eten), Garden (tuinproducten), Designer (creatief). Je hoeft niet alles tegelijk. Het sterkste bijverdienen ontstaat wanneer je één route scherp kiest en wekelijks kunt leveren wat je belooft — niet wanneer je profiel een kerstboom van categorieën is.",
    en: "Chef (food), Garden (produce), Designer (creative). You do not need everything at once. The strongest side income comes when you pick one route sharply and weekly deliver what you promise — not when your profile is a Christmas tree of categories.",
  },
  sec2Title: {
    nl: "Eten verkopen vanuit huis als bijverdienste (waarom het past naast werk)",
    en: "Selling food from home as a side gig (why it fits alongside a job)",
  },
  sec2Body: {
    nl: "Vaste ophaalvensters en een klein menu maken het combineerbaar. Je schaalt niet door uren langer te werken, maar door efficiënter te koken en vaste klanten te krijgen. Een aparte gids over thuisgekookt eten verkopen helpt als je maaltijden je hoofdlijn wilt maken.",
    en: "Fixed pickup windows and a small menu make it combinable. You scale not by working longer hours, but by cooking smarter and getting regulars. A separate guide on selling home-cooked food helps if meals are your main line.",
  },
  sec3Title: {
    nl: "Producten verkopen zonder webshop (waarom dit je sneller maakt)",
    en: "Selling products without a webshop (why it can make you faster)",
  },
  sec3Body: {
    nl: "Een webshop zonder traffic is een hobby. Een marketplace met buurt-intent is dichter bij vraag. Je richt je op profiel, aanbod en ophalen — niet op payment plugins. Lokale producten en unieke creaties zijn vaak de tweede stap naast eten, niet de eerste dag.",
    en: "A webshop without traffic is a hobby. A marketplace with neighbourhood intent is closer to demand. You focus on profile, listings and pickup — not payment plugins. Local produce and unique creations are often a second step alongside food, not day one.",
  },
  sec4Title: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  sec4Body: {
    nl: "Omdat schaal zonder differentiatie je marge eet. Lokaal bijverdienen is traag in het begin, maar je bouwt iets dat niet in één nacht wordt gekopieerd door een import-catalogus.",
    en: "Because scale without differentiation eats your margin. Local side income is slow at first, but you build something a catalogue cannot copy overnight.",
  },
  sec5Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  sec5Body: {
    nl: "Omdat mensen moe worden van anonieme schaal bij voedsel en creatief werk. Ze zoeken makers, verhalen en duidelijke afspraken — precies wat een buurtmarktplaats kan ondersteunen.",
    en: "Because people tire of anonymous scale in food and creative work. They look for makers, stories and clear agreements — what a neighbourhood marketplace can support.",
  },
  sec6Title: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten (ook als bijverdienste)",
    en: "Why people choose home-cooked food (also as a side gig)",
  },
  sec6Body: {
    nl: "Omdat het past bij drukke gezinnen en kleine budgets voor “beter eten” zonder restaurantprijs: meal-prep, schalen, vaste weekmenu’s. Als jij dat strak organiseert, wordt bijverdienen een ritme.",
    en: "Because it fits busy families and smaller budgets for better food without restaurant prices: meal prep, trays, fixed weekly menus. If you organise that tightly, side income becomes a rhythm.",
  },
  rp1a: { nl: "Voor maaltijden: start met ", en: "For meals: start with " },
  rp1b: {
    nl: ". Voor zichtbaarheid: gebruik ",
    en: ". For visibility: use ",
  },
  rp1c: {
    nl: " naast je eigen netwerk.",
    en: " alongside your own network.",
  },
  rp2a: { nl: "Wil je weten hoe je ", en: "Want to know how to " },
  rp2b: {
    nl: " zonder import-gedoe? Lees ",
    en: " without import hassle? Read ",
  },
  rp2c: { nl: ".", en: "." },
  ...SHARED_LINKS,
  stepsTitle: { nl: "Stappenplan", en: "Step-by-step plan" },
  step1: {
    nl: "Kies één rol (Chef/Garden/Designer) en één eerste product.",
    en: "Pick one role (Chef/Garden/Designer) and one first product.",
  },
  step2: {
    nl: "Bereken tijd + kosten en zet een realistische prijs.",
    en: "Calculate time + cost and set a realistic price.",
  },
  step3: {
    nl: "Publiceer op HomeCheff met duidelijke ophaal-info.",
    en: "Publish on HomeCheff with clear pickup info.",
  },
  step4: {
    nl: "Vraag 10 mensen in je buurt om te testen.",
    en: "Ask 10 nearby people to test.",
  },
  step5: {
    nl: "Verbeter communicatie en breid pas daarna uit.",
    en: "Improve communication and only then expand.",
  },
  mistakesTitle: { nl: "Veelgemaakte fouten", en: "Common mistakes" },
  mistakesBody: {
    nl: "Te lage prijs, te veel tegelijk, geen vaste ophaal. Bijverdienen moet haalbaar blijven naast je leven.",
    en: "Too low price, too much at once, no fixed pickup. Side income must stay feasible alongside life.",
  },
  cta: {
    nl: "Begin met bijverdienen vanuit huis op HomeCheff",
    en: "Start side income from home on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer en kies je eerste concrete aanbod.",
    en: "Sign up and pick your first concrete offer.",
  },
  lrThuis: { nl: "Thuisgekookt eten verkopen", en: "Sell home-cooked food" },
  lrEtenHuis: { nl: "Eten verkopen vanuit huis", en: "Sell food from home" },
  lrLokaal: { nl: "Lokaal eten verkopen", en: "Sell local food" },
};

const zelfgemaaktEtenVerkopenPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Zelfgemaakt eten verkopen | Porties en ophalen | HomeCheff",
    en: "Sell homemade food | Portions and pickup | HomeCheff",
  },
  metaDescription: {
    nl: "Zelfgemaakt eten verkopen: signature, ophalen, foto’s en buurt — zonder generieke webshop-copy.",
    en: "Sell homemade food: signature, pickup, photos and neighbourhood — without generic webshop copy.",
  },
  title: {
    nl: "Zelfgemaakt eten verkopen: signatuur, herhaling en buurt-vertrouwen",
    en: "Selling homemade food: signature, repetition and neighbourhood trust",
  },
  intro: {
    nl: "Zelfgemaakt is geen synoniem voor “rommelig”. Sterke verkopers maken juist keuzes: welke smaak is van jou, welke portie is standaard, welke dag is ophaaldag. Dat is hoe je thuisgekookt eten verkopen serieus neemt zonder een restaurant te zijn — je bent een maker met een duidelijke belofte.",
    en: "Homemade is not a synonym for messy. Strong sellers make choices: which taste is yours, which portion is standard, which day is pickup. That is how you take selling home-cooked food seriously without being a restaurant — you are a maker with a clear promise.",
  },
  sec1Title: {
    nl: "Zelfgemaakt eten verkopen vs “meal kits” en ketens",
    en: "Homemade food vs meal kits and chains",
  },
  sec1Body: {
    nl: "Ketens optimaliseren schaal; jij optimaliseert nabijheid en maatwerk binnen grenzen. Je verkoopt geen oneindige variabelen, maar een paar gerechten die je extreem goed kunt. Dat is makkelijker te communiceren en makkelijker te leveren — twee dingen die direct je stress bepalen.",
    en: "Chains optimise scale; you optimise proximity and bespoke within limits. You sell not infinite variants, but a few dishes you can do extremely well. That is easier to communicate and deliver — two things that directly determine stress.",
  },
  sec2Title: {
    nl: "Eten verkopen vanuit huis met een herkenbare stijl",
    en: "Selling food from home with a recognisable style",
  },
  sec2Body: {
    nl: "Noem je keukenfilosofie in één zin: zuiderse ovenschotels, gezonde meal-prep, klassiek Nederlands comfort — wat het ook is, maak het herkenbaar. Mensen delen “die ene thuiskok die altijd X doet”. Dat is gratis marketing, mits je kwaliteit constant houdt.",
    en: "State your kitchen philosophy in one line: southern bakes, healthy meal prep, classic comfort — whatever it is, make it recognisable. People share that one cook who always does X. That is free marketing if quality stays consistent.",
  },
  sec3Title: {
    nl: "Geld verdienen vanuit huis met zelfgemaakt: prijs als spiegel van tijd",
    en: "Earning from home with homemade: price mirrors time",
  },
  sec3Body: {
    nl: "Als je prijs te laag zet, verbrand je motivatie. Zet prijs op basis van tijd + ingrediënt + verpakking + “foutmarge”. Liever iets duurder en duurzaam dan goedkoop en uitputtend. Combineer prijs met duidelijke ophaal en communicatie — dat is je echte product, niet alleen het bord.",
    en: "If your price is too low, you burn motivation. Price from time + ingredients + packaging + error margin. Rather slightly expensive and sustainable than cheap and exhausting. Combine price with clear pickup and communication — that is your real product, not only the plate.",
  },
  sec4Title: {
    nl: "Waarom mensen stoppen met dropshipping (en zelfgemaakt het tegenovergestelde is)",
    en: "Why people quit dropshipping (and homemade is the opposite)",
  },
  sec4Body: {
    nl: "Dropshipping verkoopt iets dat iedereen kan importeren. Zelfgemaakt verkoopt iets dat alleen jij op die manier maakt — mits je het niet verpest door te veel tegelijk te willen.",
    en: "Dropshipping sells what anyone can import. Homemade sells what only you make that way — unless you ruin it by wanting too much at once.",
  },
  sec5Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  sec5Body: {
    nl: "Omdat makers zichtbaar willen zijn en kopers uitleg willen. Zelfgemaakt + lokaal is een combinatie die past bij ophalen en korte lijnen.",
    en: "Because makers want visibility and buyers want explanation. Homemade + local fits pickup and short chains.",
  },
  sec6Title: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  sec6Body: {
    nl: "Omdat het voelt als “van iemand”, niet “van een systeem”. Dat is emotioneel, maar het verklaart waarom reviews en communicatie zo zwaar wegen.",
    en: "Because it feels from someone, not from a system. That is emotional, but it explains why reviews and communication weigh heavily.",
  },
  rp1a: { nl: "Koppel je aanbod aan ", en: "Connect your offer to " },
  rp1b: {
    nl: " en lees ", en: " and read ",
  },
  rp1c: {
    nl: " voor het platform-verhaal.",
    en: " for the platform story.",
  },
  rp2a: { nl: "Voor klanten-werving: ", en: "For customer acquisition: " },
  rp2b: {
    nl: " en ", en: " and ",
  },
  rp2c: { nl: ".", en: "." },
  ...SHARED_LINKS,
  stepsTitle: { nl: "Stappenplan", en: "Step-by-step plan" },
  step1: {
    nl: "Kies 1–2 signature items en een vaste weekstructuur.",
    en: "Pick 1–2 signature items and a fixed weekly structure.",
  },
  step2: {
    nl: "Maak foto’s die de portie en textuur tonen.",
    en: "Make photos that show portion and texture.",
  },
  step3: {
    nl: "Schrijf ingrediënten en allergenen helder.",
    en: "Write ingredients and allergens clearly.",
  },
  step4: {
    nl: "Publiceer op HomeCheff en vraag om eerlijke feedback.",
    en: "Publish on HomeCheff and ask for honest feedback.",
  },
  step5: {
    nl: "Standaardiseer wat werkt; experimenteer klein.",
    en: "Standardise what works; experiment small.",
  },
  mistakesTitle: { nl: "Veelgemaakte fouten", en: "Common mistakes" },
  mistakesBody: {
    nl: "Te veel variaties, geen vaste ophaal, te mooie foto’s. Hou het echt.",
    en: "Too many variants, no fixed pickup, too pretty photos. Keep it real.",
  },
  cta: {
    nl: "Verkoop zelfgemaakt eten op HomeCheff",
    en: "Sell homemade food on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer en publiceer je eerste signature-aanbod.",
    en: "Sign up and publish your first signature listing.",
  },
  lrThuis: { nl: "Thuisgekookt eten verkopen", en: "Sell home-cooked food" },
  lrBij: { nl: "Bijverdienen vanuit huis", en: "Side income from home" },
  lrEtenHuis: { nl: "Eten verkopen vanuit huis", en: "Sell food from home" },
};

const lokaalEtenVerkopenPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Lokaal eten verkopen | Buurt en ophalen | HomeCheff",
    en: "Sell local food | Neighbourhood and pickup | HomeCheff",
  },
  metaDescription: {
    nl: "Lokaal eten verkopen: minder kilometers, meer verhaal — praktische gids voor thuiskoks en buurt-kopers.",
    en: "Sell local food: fewer miles, more story — practical guide for cooks and neighbourhood buyers.",
  },
  title: {
    nl: "Lokaal eten verkopen: nabijheid, vertrouwen en herhaalbare ophaal-logistiek",
    en: "Selling local food: proximity, trust and repeatable pickup logistics",
  },
  intro: {
    nl: "Lokaal is geen sticker: het is een manier om verwachtingen te managen. Kopers willen weten waar het vandaan komt, hoe laat ze het ophalen, en wat ze moeten doen als iets misgaat. Als jij dat helder maakt, wordt lokaal eten verkopen makkelijker dan landelijke concurrentie — omdat je niet met de hele internet-bubbel vecht, maar met een paar concurrenten in jouw radius.",
    en: "Local is not a sticker: it is a way to manage expectations. Buyers want to know where it comes from, when they pick up, and what to do if something goes wrong. If you make that clear, selling local food becomes easier than national competition — you do not fight the whole internet bubble, only a few rivals in your radius.",
  },
  sec1Title: {
    nl: "Lokaal eten verkopen en eten verkopen vanuit huis: dezelfde basis",
    en: "Selling local food and selling food from home: same foundation",
  },
  sec1Body: {
    nl: "Beide draaien om ophalen, duidelijke vensters en buurt-reputatie. Het verschil is vooral marketingtaal: “lokaal” benadrukt nabijheid en keten. De algemene gids over eten verkopen vanuit huis legt het proces stap voor stap uit.",
    en: "Both hinge on pickup, clear windows and neighbourhood reputation. The difference is mostly marketing language: local stresses proximity and chain. The general guide on selling food from home walks through the process step by step.",
  },
  sec2Title: {
    nl: "Geld verdienen vanuit huis met lokale maaltijden",
    en: "Earning from home with local meals",
  },
  sec2Body: {
    nl: "Je voordeel is herhaling: dezelfde buurt, dezelfde route, dezelfde tijd. Optimaliseer daarop in plaats van op “meer steden”. Liever diep in één postcode dan oppervlakkig in tien. Een scherp menu en vaste ophaaldag passen bij thuisgekookt eten verkopen als kern.",
    en: "Your advantage is repetition: same neighbourhood, same route, same time. Optimise for that instead of more cities. Prefer deep in one postcode than shallow in ten. A tight menu and fixed pickup day fit selling home-cooked food as the core.",
  },
  sec3Title: {
    nl: "Stadspagina’s: eten verkopen in jouw regio (voorbeelden)",
    en: "City pages: selling food in your area (examples)",
  },
  sec3Body: {
    nl: "We hebben aparte landingspagina’s voor onder andere Rotterdam, Amsterdam, Den Haag en Utrecht — zodat je kunt ranken op lokale intent én doorlinkt naar je algemene kook-gids. Dat versterkt topic authority zonder duplicate rommel: de structuur is hetzelfde, de stad is dynamisch.",
    en: "We have separate landing pages for Rotterdam, Amsterdam, The Hague and Utrecht — so you can match local intent and link to your general cooking guide. That strengthens topical authority without messy duplication: same structure, city is dynamic.",
  },
  sec4Title: {
    nl: "Waarom mensen stoppen met dropshipping (en lokaal eten de tegenpool is)",
    en: "Why people quit dropshipping (and local food is the opposite pole)",
  },
  sec4Body: {
    nl: "Dropshipping vermijdt fysieke complexiteit; lokaal eten omarmt juist afhalen en temperatuur als onderdeel van het product. Dat is zwaarder, maar het bouwt een wal tegen oneindige prijs-concurrentie.",
    en: "Dropshipping avoids physical complexity; local food embraces pickup and temperature as part of the product. That is heavier, but it builds a wall against endless price competition.",
  },
  sec5Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  sec5Body: {
    nl: "Omdat kopers steeds vaker “wie maakt dit?” vragen. Lokaal eten verkopen werkt als je antwoord geeft met daden: herkomst, hygiëne-communicatie, vaste ophaal.",
    en: "Because buyers increasingly ask who makes this. Local food works when you answer with actions: origin, hygiene communication, fixed pickup.",
  },
  sec6Title: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  sec6Body: {
    nl: "Omdat buurt-reputatie meetbaar is: mensen praten. Een keten heeft merk; een thuiskok heeft gezicht. Gebruik dat eerlijk — geen oversell.",
    en: "Because neighbourhood reputation is measurable: people talk. A chain has brand; a cook has a face. Use that honestly — no oversell.",
  },
  rp1a: { nl: "Lees ", en: "Read " },
  rp1b: {
    nl: " en vergelijk met ", en: " and compare with ",
  },
  rp1c: {
    nl: " voor je positionering.",
    en: " for your positioning.",
  },
  rp2a: { nl: "Voor klanten: ", en: "For customers: " },
  rp2b: {
    nl: " en voor regels: ", en: " and for rules: ",
  },
  rp2c: { nl: ".", en: "." },
  ...SHARED_LINKS,
  stepsTitle: { nl: "Stappenplan", en: "Step-by-step plan" },
  step1: {
    nl: "Definieer je radius (buurt/postcode) en communiceer die eerlijk.",
    en: "Define your radius (neighbourhood/postcode) and communicate it honestly.",
  },
  step2: {
    nl: "Kies vaste ophaalvensters die je volhoudt.",
    en: "Pick pickup windows you can sustain.",
  },
  step3: {
    nl: "Zet je aanbod op HomeCheff met duidelijke labels.",
    en: "List on HomeCheff with clear labels.",
  },
  step4: {
    nl: "Activeer mond-tot-mond in clubs en buurtapps.",
    en: "Activate word of mouth in clubs and neighbourhood apps.",
  },
  step5: {
    nl: "Meet wat herhaalt; schaal binnen je radius.",
    en: "Measure what repeats; scale within your radius.",
  },
  mistakesTitle: { nl: "Veelgemaakte fouten", en: "Common mistakes" },
  mistakesBody: {
    nl: "Te grote radius beloven, geen vaste ophaal, prijzen zonder logistiek meegerekend.",
    en: "Promising too large a radius, no fixed pickup, prices without logistics baked in.",
  },
  cta: {
    nl: "Verkoop lokaal eten via HomeCheff",
    en: "Sell local food on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer en kies Chef om je buurt-maaltijd te publiceren.",
    en: "Sign up and pick Chef to publish your neighbourhood meal.",
  },
  linkThuisgekookt: {
    nl: "thuisgekookt eten verkopen",
    en: "sell home-cooked food",
  },
  linkEtenVanuitHuisLokaal: {
    nl: "eten verkopen vanuit huis (algemene gids)",
    en: "selling food from home (general guide)",
  },
  lrRotterdam: { nl: "Eten verkopen in Rotterdam", en: "Sell food in Rotterdam" },
  lrAmsterdam: { nl: "Eten verkopen in Amsterdam", en: "Sell food in Amsterdam" },
  lrDenHaag: { nl: "Eten verkopen in Den Haag", en: "Sell food in The Hague" },
  lrUtrecht: { nl: "Eten verkopen in Utrecht", en: "Sell food in Utrecht" },
};

const etenVerkopenCityPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Eten verkopen in {{city}} | Thuiskoks | HomeCheff",
    en: "Sell food in {{city}} | Home cooks | HomeCheff",
  },
  metaDescription: {
    nl: "Eten verkopen in {{city}}: lokaal ophalen, buurt-klanten en praktische start — via HomeCheff.",
    en: "Sell food in {{city}}: local pickup, neighbourhood customers and a practical start — on HomeCheff.",
  },
  title: {
    nl: "Eten verkopen in {{city}}: lokaal starten met thuisgekookt en vaste ophaal",
    en: "Selling food in {{city}}: start locally with home-cooked meals and fixed pickup",
  },
  intro: {
    nl: "In {{city}} is de vraag naar lokaal eten niet “of”, maar “waar haal ik het op en bij wie”. Als je hier eten wilt verkopen vanuit huis, win je niet met de mooiste landingspagina, maar met betrouwbare afspraken en herhaling in dezelfde wijk. HomeCheff helpt je zichtbaar te worden voor mensen die al zoeken naar buurt-aanbod — zonder dat je eerst een complete webshop hoeft te bouwen.",
    en: "In {{city}} the question for local food is not if, but where to pick up and from whom. If you want to sell food from home here, you win not with the prettiest landing page, but with reliable agreements and repeat in the same area. HomeCheff helps you become visible to people already looking for neighbourhood offers — without building a full webshop first.",
  },
  sec1Title: {
    nl: "Waarom {{city}} anders is dan “Nederland” als doelgroep",
    en: "Why {{city}} is different from targeting the whole Netherlands",
  },
  sec1Body: {
    nl: "Postcodes, verkeer en sociale netwerken verschillen per stad. Wat werkt is een radius die je eerlijk kunt bedienen: vaste ophaal, duidelijke tijdvensters en communicatie die past bij drukte in {{city}}. Liever een kleine zone die je perfect doet dan een grote belofte die je niet waar maakt.",
    en: "Postcodes, traffic and social networks differ per city. What works is a radius you can honestly serve: fixed pickup, clear time windows and communication that fits busy life in {{city}}. Prefer a small zone done perfectly over a big promise you cannot keep.",
  },
  sec2Title: {
    nl: "Thuisgekookt eten verkopen in {{city}}: start met herkenning",
    en: "Selling home-cooked food in {{city}}: start with recognition",
  },
  sec2Body: {
    nl: "Mensen in {{city}} kopen vaker als ze weten wat ze krijgen. Eén signature-lijn, vaste weekdag, duidelijke foto’s: dat bouwt sneller vertrouwen dan tien losse experimenten. Koppel je profiel aan duidelijke labels en gebruik buurtkanalen waar {{city}}-bewoners al zitten.",
    en: "People in {{city}} buy more when they know what they get. One signature line, fixed weekday, clear photos: that builds trust faster than ten random experiments. Tie your profile to clear labels and use neighbourhood channels where {{city}} residents already are.",
  },
  sec3Title: {
    nl: "Geld verdienen vanuit huis: koppel lokaal aan je eerste 20 kopers",
    en: "Earning from home: tie local to your first 20 buyers",
  },
  sec3Body: {
    nl: "Je eerste kopers in {{city}} zijn je distributie-engine: reviews, doorverwijzingen en vaste rit. Lees ook de algemene gidsen over geld verdienen met koken en Growth — het principe is hetzelfde, alleen is je netwerk hier concreter benoemd.",
    en: "Your first buyers in {{city}} are your distribution engine: reviews, referrals and steady rhythm. Read the general guides on earning with cooking and Growth — the principle is the same, only your network is more concrete here.",
  },
  sec4Title: {
    nl: "Producten verkopen zonder webshop (ook in {{city}})",
    en: "Selling products without a webshop (also in {{city}})",
  },
  sec4Body: {
    nl: "Een marketplace-profiel is vaak sneller dan een custom shop omdat intent al bestaat: mensen zoeken eten en makers. Focus op ophalen, prijs en communicatie — dat is waar je concurrentie wint in {{city}}, niet op checkout-thema’s.",
    en: "A marketplace profile is often faster than a custom shop because intent already exists: people search for food and makers. Focus on pickup, price and communication — that is where you win in {{city}}, not on checkout themes.",
  },
  rp1a: { nl: "Lees ", en: "Read " },
  rp1b: {
    nl: " en ", en: " and ",
  },
  rp1c: {
    nl: " voor het algemene kader.",
    en: " for the general framework.",
  },
  rp2a: { nl: "Voor klanten vinden: ", en: "For finding customers: " },
  rp2b: {
    nl: " en ", en: " and ",
  },
  rp2c: { nl: ".", en: "." },
  ...SHARED_LINKS,
  stepsTitle: { nl: "Stappenplan", en: "Step-by-step plan" },
  step1: {
    nl: "Kies je radius in {{city}} en communiceer die.",
    en: "Pick your radius in {{city}} and communicate it.",
  },
  step2: {
    nl: "Definieer 1–2 producten en vaste ophaal.",
    en: "Define 1–2 products and fixed pickup.",
  },
  step3: {
    nl: "Publiceer op HomeCheff met duidelijke foto’s.",
    en: "Publish on HomeCheff with clear photos.",
  },
  step4: {
    nl: "Werven via buurtkanalen in {{city}}.",
    en: "Acquire via neighbourhood channels in {{city}}.",
  },
  step5: {
    nl: "Optimaliseer ritme en reviews.",
    en: "Optimise rhythm and reviews.",
  },
  mistakesTitle: { nl: "Veelgemaakte fouten", en: "Common mistakes" },
  mistakesBody: {
    nl: "Heel {{city}} beloven zonder logistiek, geen vaste ophaal, prijs zonder tijd meegerekend.",
    en: "Promising all of {{city}} without logistics, no fixed pickup, price without time baked in.",
  },
  cta: {
    nl: "Start in {{city}} met HomeCheff",
    en: "Start in {{city}} on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer en publiceer je eerste buurt-maaltijd.",
    en: "Sign up and publish your first neighbourhood meal.",
  },
  lrCooking: { nl: "Geld verdienen met koken", en: "Earn money with cooking" },
  lrThuis: { nl: "Thuisgekookt eten verkopen", en: "Sell home-cooked food" },
  lrEtenHuis: { nl: "Eten verkopen vanuit huis", en: "Sell food from home" },
};

export const PHASE2_PROGRAMMATIC_SOURCES: Record<string, Record<string, Bi>> = {
  etenVerkopenVanuitHuisPage,
  thuisgekooktEtenVerkopenPage,
  bijverdienenVanuitHuisPage,
  zelfgemaaktEtenVerkopenPage,
  lokaalEtenVerkopenPage,
  etenVerkopenCityPage,
};
