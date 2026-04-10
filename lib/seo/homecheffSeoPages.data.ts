import type { SeoPageDefinition } from "./homecheffSeoTypes";

/** Centrale content voor alle SEO-landingspagina's (NL + EN). */
export const HOMECHEFF_SEO_PAGE_DEFS: SeoPageDefinition[] = [
  {
    id: "thuisgekookt-kopen",
    nlSlug: "thuisgekookt-eten-kopen",
    enSlug: "buy-home-cooked-food",
    relatedIds: ["maaltijden-aan-huis", "lokale-producten", "alternatief-thuisbezorgd"],
    nl: {
      title: "Thuisgekookt eten kopen | Vers van lokale koks | HomeCheff",
      description:
        "Bestel thuisgekookte maaltijden bij makers bij jou in de buurt. Vers, lokaal en direct op HomeCheff — ontdek het dorpsplein.",
      h1: "Thuisgekookt eten kopen bij lokale makers",
      intro: [
        "Wil je geen standaard bezorgketen, maar eten dat echt thuis is klaargemaakt? Op HomeCheff vind je mensen uit de buurt die koken wat ze zelf ook op tafel zetten: van comfortfood tot gezonde schotels.",
        "Je ziet wie achter het gerecht zit, wat er wordt aangeboden en hoe je het kunt afhalen of laten brengen — afhankelijk van wat de maker aanbiedt. Zo blijft het persoonlijk en dichtbij.",
        "Of je nu één avond wilt ontdekken of vaker lokaal wilt eten: start op het dorpsplein en filter op wat bij jou past.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Je bladert op het dorpsplein door aanbod van thuiskoks, tuinders en makers in jouw omgeving. Elk item heeft een duidelijke prijs en uitleg van de maker.",
          "Zie je iets leuks? Voeg het toe aan je winkelmand en rond af via de checkout. De maker bereidt je bestelling en je maakt af op de afgesproken manier: afhalen of bezorging, volgens wat op het product staat.",
          "Na afloop kun je een beoordeling achterlaten — zo help je andere buren om goede makers te vinden.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor iedereen die bewust wil eten zonder elke avond zelf te koken, en voor wie juist wél wil weten wie de pan vasthoudt.",
          "Ook handig als je nieuwe smaken uit de buurt wilt proeven of gezinnen die afwisseling zoeken naast supermarkt en fastfood.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal betekent vaak verser, minder kilometers en meer steun voor mensen om de hoek. Je geld gaat naar een maker in plaats van alleen naar een anonieme keten.",
          "HomeCheff is een marketplace waar makers zelf hun aanbod tonen. Geen tussenpersonen die het verhaal vergeten — jij ziet wie kookt en wat je krijgt.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Maaltijden, baksels, groente en creaties van designers — alles wat makers op het platform plaatsen. Combineer inspiratie (recepten en ideeën) met items die je direct kunt bestellen.",
          "Nieuwe makers melden zich regelmatig aan; het loont om het dorpsplein vaker te bekijken.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Bekijk inspiratie", href: "/inspiratie" },
      },
    },
    en: {
      title: "Buy Home-Cooked Food | Fresh Meals from Local Cooks | HomeCheff",
      description:
        "Order home-cooked meals from cooks near you. Fresh, local and direct on HomeCheff — browse the village square and buy with confidence.",
      h1: "Buy home-cooked food from local makers",
      intro: [
        "Want food that is actually cooked at home—not the same generic delivery options? On HomeCheff you’ll find people nearby who make what they would serve at their own table, from comfort dishes to lighter meals.",
        "You can see who is behind the dish, what is on offer, and how pickup or delivery works for that listing. It stays personal and close to home.",
        "Whether you want to try once or eat locally more often, start on the village square and filter what fits you.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Browse the village square for offerings from home cooks, growers and makers near you. Each item shows a clear price and description from the seller.",
          "Found something you like? Add it to your cart and complete checkout. The maker prepares your order; you pick up or receive delivery according to what the listing offers.",
          "Afterwards you can leave a review—helping neighbours discover great makers.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Anyone who wants thoughtful food without cooking every night, and anyone who cares about knowing who made the meal.",
          "Great if you want to explore new flavours nearby or add variety beyond supermarkets and chains.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local often means fresher food, fewer miles, and more support for people around you. Your spend goes to a maker, not only to an anonymous chain.",
          "HomeCheff is a marketplace where makers present their own offer—so the story stays visible.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Meals, baked goods, produce and more—whatever makers list. Pair inspiration (recipes and ideas) with items you can order right away.",
          "New makers join over time; checking the village square regularly pays off.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Explore inspiration", href: "/inspiratie" },
      },
    },
  },
  {
    id: "eten-bij-particulieren",
    nlSlug: "eten-bestellen-bij-particulieren",
    enSlug: "order-food-from-local-cooks",
    relatedIds: ["thuisgekookt-kopen", "maaltijden-aan-huis", "platform-thuiskoks"],
    nl: {
      title: "Eten bestellen bij particulieren | HomeCheff",
      description:
        "Bestel eten bij particuliere thuiskoks op HomeCheff. Lokaal aanbod, duidelijke prijzen en direct contact met de maker.",
      h1: "Eten bestellen bij particulieren",
      intro: [
        "Particulieren die met passie koken, bieden op HomeCheff gerechten aan alsof je bij de buren eet—maar dan via een duidelijk platform met betaling en overzicht.",
        "Je hoeft geen Facebook-groep of losse app-groep meer af te speuren: alles staat op het dorpsplein, met filters en zoeken zoals je gewend bent van een marketplace.",
        "Zo combineer je het gemak van online bestellen met het gevoel van buurt en ambacht.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Makers plaatsen zelf hun producten met foto, prijs en voorwaarden (afhalen, bezorging of beide waar mogelijk). Jij kiest, betaalt via de flow van het platform en ontvangt bevestiging.",
          "Communicatie over praktische details verloopt via de afspraken op het product en—waar beschikbaar—via de chatfuncties van het platform.",
          "Zo blijft het overzichtelijk voor zowel koper als maker.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor buren die liever bij iemand uit de straat bestellen dan bij een anonieme keuken ver weg.",
          "Ook voor nieuwsgierige eters die kleine makers willen proberen zonder hoge drempels.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal verbindt: je ziet waar je geld naartoe gaat en je ontdekt smaken die bij jouw regio passen.",
          "HomeCheff geeft structuur: geen losse betaalverzoeken zonder duidelijkheid, maar een herkenbare plek om te bestellen.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Van eenmalige diners tot wekelijkse maaltijden en specials van hobbykoks die professioneel willen groeien.",
          "Kijk ook bij inspiratie voor ideeën; sommige makers koppelen recepten aan hun aanbod.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Account aanmaken", href: "/register" },
      },
    },
    en: {
      title: "Order Food from Local Cooks | HomeCheff",
      description:
        "Order food from home cooks on HomeCheff. Local listings, clear pricing, and a simple way to buy from real people near you.",
      h1: "Order food from local cooks",
      intro: [
        "Home cooks who love feeding others list dishes on HomeCheff—like eating with neighbours, but with clear checkout and payments on a proper marketplace.",
        "No need to hunt through scattered groups: everything is on the village square with search and filters.",
        "You get online convenience with a neighbourhood feel.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Sellers publish products with photos, price and terms (pickup, delivery or both where available). You pay through the platform flow and receive confirmation.",
          "Practical details follow the product information and—where available—platform messaging.",
          "That keeps things clear for buyers and sellers alike.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Anyone who prefers ordering from a person nearby rather than a distant anonymous kitchen.",
          "Also for curious eaters who want to try small makers without friction.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local ties spending to people you can relate to and surfaces flavours that fit your area.",
          "HomeCheff adds structure: a familiar place to order instead of scattered payment links.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "From one-off meals to weekly offerings from hobby cooks growing their craft.",
          "Check inspiration for ideas; some makers link recipes to what they sell.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Create an account", href: "/register" },
      },
    },
  },
  {
    id: "maaltijden-aan-huis",
    nlSlug: "maaltijden-aan-huis",
    enSlug: "meals-at-home",
    relatedIds: ["thuisgekookt-kopen", "wat-eten-vandaag", "eten-bij-particulieren"],
    nl: {
      title: "Maaltijden aan huis | Lokale en verse gerechten | HomeCheff",
      description:
        "Maaltijden aan huis van lokale thuiskoks. Vers, dichtbij en te bestellen op HomeCheff — ontdek makers bij jou in de buurt.",
      h1: "Maaltijden aan huis van lokale makers",
      intro: [
        "Maaltijden aan huis hoeven niet standaard uit een industriële keuken te komen. Op HomeCheff vind je gerechten die thuis of in een kleine keuken worden bereid, vaak met ingrediënten waar de maker zelf achter staat.",
        "Je kiest zelf of je afhaalt of gebruikmaakt van bezorging waar de maker dat aanbiedt. Zo blijft het praktisch én persoonlijk.",
        "Perfect voor drukke weekdagen, gezinnen of als je gewoon eens iets anders wilt dan de gebruikelijke apps.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Open het dorpsplein en stel je locatie of voorkeuren in. Je ziet wat er in jouw buurt beschikbaar is, met prijzen en voorraad waar van toepassing.",
          "Bestellen gaat via de winkelmand en checkout. Je ontvangt bevestiging en weet waar en wanneer je je maaltijd ophaalt of ontvangt.",
          "Na gebruik kun je een review plaatsen om anderen te helpen.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor huishoudens die gemak willen zonder in te leveren op kwaliteit en herkomst.",
          "Ook voor senioren of mantelzorgers die af en toe ondersteuning bij maaltijden zoeken.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Korte lijnen betekenen vaak minder verspilling en meer aandacht per portie.",
          "HomeCheff bundelt makers op één plek zodat jij niet zelf hoeft te zoeken in losse kanalen.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Diners, lunchboxen, vegetarische lijnen, culturele keukens—afhankelijk van wie er actief is in jouw regio.",
          "Combineer met inspiratiepagina’s voor ideeën en ga dan naar het dorpsplein om te bestellen.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Neem contact op", href: "/contact" },
      },
    },
    en: {
      title: "Meals at Home | Local and Fresh Dishes | HomeCheff",
      description:
        "Meals at home from local home cooks. Fresh, nearby and easy to order on HomeCheff—see what makers near you offer today.",
      h1: "Meals at home from local makers",
      intro: [
        "Home meals do not have to come from a distant central kitchen. On HomeCheff you’ll find dishes prepared at home or in small kitchens—often with ingredients the maker stands behind.",
        "You choose pickup or delivery where offered, keeping things practical and personal.",
        "Great for busy weeks, families, or when you want something different from the usual apps.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Open the village square and set your area or preferences. You’ll see what is available nearby, with prices and stock where applicable.",
          "Order through cart and checkout; you’ll get confirmation and know when and where to collect or receive your meal.",
          "Leave a review afterwards to help others choose.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Households that want convenience without giving up quality and traceability.",
          "Also seniors or carers who sometimes need meal support.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Shorter chains often mean less waste and more care per portion.",
          "HomeCheff gathers makers in one place so you don’t hunt scattered channels.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Dinners, lunch options, veggie lines, world cuisines—depending on who is active near you.",
          "Pair inspiration pages with the village square to browse and buy.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Contact us", href: "/contact" },
      },
    },
  },
  {
    id: "wat-eten-vandaag",
    nlSlug: "wat-eten-we-vandaag",
    enSlug: "what-should-we-eat-today",
    relatedIds: ["gezonde-maaltijden", "maaltijden-aan-huis", "thuisgekookt-kopen"],
    nl: {
      title: "Wat eten we vandaag? | Inspiratie en lokale maaltijden | HomeCheff",
      description:
        "Geen inspiratie voor vanavond? Ontdek ideeën en bestel lokaal op HomeCheff — van recepten tot kant-en-klare maaltijden bij jou in de buurt.",
      h1: "Wat eten we vandaag?",
      intro: [
        "Die vraag kent elke huishouding. HomeCheff helpt op twee manieren: eerst inspiratie—recepten en ideeën—en daarna concreet aanbod op het dorpsplein dat je direct kunt bestellen.",
        "Zo ga je niet alleen scrollen, maar kom je uit bij echte makers die vandaag of deze week iets voor je kunnen maken.",
        "Mix en match: laat je raken door een recept en zoek daarna een vergelijkbaar item bij een kok om de hoek.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Start bij inspiratie om smaken en stijlen te ontdekken, of ga direct naar het dorpsplein als je al weet dat je wilt bestellen.",
          "Filters en zoeken helpen je sneller iets te vinden dat past bij je dieet, budget of tijd.",
          "Plaats je bestelling, volg de afspraken van de maker en geniet—en deel desgewenst je ervaring.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor iedereen die vastloopt op ‘wat eten we’ en tóch iets lekkers wil zonder uren in de keuken.",
          "Ook voor teams of gezinnen die graag afwisselen.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal betekent vaak unieke combinaties die je niet in elke supermarkt vindt.",
          "HomeCheff verbindt inspiratie met echte koopknoppen—geen eindeloze Pinterest-zonder-actie.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Recepten, tuin- en designinspiratie, plus verkoopbare producten van makers.",
          "Sla favorieten op in de app waar beschikbaar en kom later terug.",
        ],
      },
      cta: {
        primary: { label: "Bekijk wat anderen maken", href: "/inspiratie" },
        secondary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
      },
    },
    en: {
      title: "What Should We Eat Today? | Inspiration and Local Meals | HomeCheff",
      description:
        "Stuck on dinner ideas? Get inspiration and order locally on HomeCheff—from recipes to ready meals near you, all in one place.",
      h1: "What should we eat today?",
      intro: [
        "Every household knows this question. HomeCheff helps in two ways: inspiration first—recipes and ideas—then real listings on the village square you can order.",
        "You don’t only scroll—you land with makers who can cook for you this week.",
        "Mix a recipe that sparks an idea with a similar dish from a cook nearby.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Browse inspiration for flavours and styles, or jump straight to the village square if you already want to buy.",
          "Search and filters narrow options to diet, budget or time.",
          "Place your order, follow the maker’s instructions, enjoy—and review if you like.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Anyone stuck on ‘what’s for dinner’ who still wants something tasty without hours of cooking.",
          "Also families or housemates who like variety.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local often means unique combinations you won’t find in every supermarket.",
          "HomeCheff connects inspiration with real buy buttons—not endless browsing without action.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Recipes, garden and design ideas, plus buyable products from makers.",
          "Save favourites where the product supports it and return later.",
        ],
      },
      cta: {
        primary: { label: "Explore what others make", href: "/inspiratie" },
        secondary: { label: "Discover local offers", href: "/dorpsplein" },
      },
    },
  },
  {
    id: "gezonde-maaltijden",
    nlSlug: "gezonde-maaltijden-ideeen",
    enSlug: "healthy-meal-ideas",
    relatedIds: ["wat-eten-vandaag", "maaltijden-aan-huis", "lokale-producten"],
    nl: {
      title: "Gezonde maaltijden ideeën | HomeCheff",
      description:
        "Gezonde maaltijdideeën en lokaal aanbod op HomeCheff. Ontdek makers met verse ingrediënten en inspiratie die bij jouw stijl past.",
      h1: "Gezonde maaltijden: ideeën en lokaal aanbod",
      intro: [
        "Gezond eten is geen één-size-fits-all: de één wil meer groente, de ander minder suiker of juist eiwitrijke maaltijden. Op HomeCheff zie je wat makers zelf aanbieden—met ingrediënten en beschrijvingen die je zelf beoordeelt.",
        "Combineer inspiratiepagina’s met het dorpsplein om niet alleen te lezen, maar ook te proberen wat iemand bij jou in de buurt maakt.",
        "Zo blijft het haalbaar voor drukke dagen én leuk om nieuwe smaken te ontdekken.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Zoek op categorieën en filters die bij jou passen. Makers omschrijven hun gerechten; jij bepaalt of het in jouw patroon past.",
          "Bestellen werkt zoals bij andere items: mandje, checkout, afspraak voor afhalen of bezorging.",
          "Twijfel je over allergenen of ingrediënten? Gebruik de chat of contact met de maker waar het platform dat ondersteunt.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor sportievelingen, gezinnen met kinderen en iedereen die bewuster wil eten zonder elke week hetzelfde saladeblok.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Vers van dichtbij past vaak goed bij gezonde routines: minder lange routes en soms kortere lijntjes naar de bron.",
          "HomeCheff maakt zichtbaar wie kookt—transparanter dan een generieke maaltijdbox zonder gezicht.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Vegetarische schotels, seizoensgroenten van tuinders, lichte diners van thuiskoks—afhankelijk van aanbod.",
          "Kijk ook bij lokale producten en tuin-inspiratie.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Bekijk inspiratie", href: "/inspiratie" },
      },
    },
    en: {
      title: "Healthy Meal Ideas | HomeCheff",
      description:
        "Healthy meal ideas and local food on HomeCheff. Find makers with fresh ingredients and inspiration that fits your lifestyle.",
      h1: "Healthy meal ideas and local food",
      intro: [
        "Healthy eating looks different for everyone—more veg, less sugar, higher protein. On HomeCheff you see what makers actually offer, with descriptions you can judge for yourself.",
        "Pair inspiration with the village square so you don’t only read—you taste what someone nearby cooks.",
        "That keeps busy weeks manageable and discovery fun.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Use categories and filters that fit you. Makers describe their dishes; you decide if it matches your pattern.",
          "Ordering works like other items: cart, checkout, pickup or delivery as offered.",
          "Questions on allergens? Use chat or contact options where available.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Active people, families, and anyone who wants to eat more mindfully without repeating the same bowl every week.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Fresh nearby often supports healthy routines: fewer miles and sometimes clearer sourcing.",
          "HomeCheff shows who cooks—more transparent than a faceless meal box.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Vegetarian plates, seasonal produce from growers, lighter dinners from home cooks—depending on supply.",
          "Also browse local products and garden inspiration.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Explore inspiration", href: "/inspiratie" },
      },
    },
  },
  {
    id: "geld-koken",
    nlSlug: "geld-verdienen-met-koken",
    enSlug: "earn-money-cooking-from-home",
    relatedIds: ["verkopen-huis", "begin-thuiskok", "hobby-koken"],
    nl: {
      title: "Geld verdienen met koken | Start als thuiskok | HomeCheff",
      description:
        "Verdien geld met koken vanuit huis. HomeCheff helpt je lokaal zichtbaar te worden, zonder ingewikkeld gedoe — start met je eerste item.",
      h1: "Geld verdienen met koken vanuit huis",
      intro: [
        "Als je graag kookt en anderen wilt verwennen, kun je dat omzetten naar inkomen. HomeCheff is een marketplace: jij bepaalt wat je maakt, tegen welke prijs en hoe afhalen of bezorging werkt—binnen de kaders die jij en het platform hanteren.",
        "Je hoeft geen eigen webshop te bouwen: profiel, aanbod en zichtbaarheid op het dorpsplein brengen je bij buren die zoeken naar iets anders dan de standaard keten.",
        "Begin klein met één gerecht, leer wat werkt, en breid uit als de vraag groeit.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Maak een account, doorloop de verkoperflow en plaats je eerste product met duidelijke foto en beschrijving.",
          "Klanten bestellen via het platform; jij bereidt en levert volgens de gekozen opties. Betalingen verlopen via de infrastructuur van HomeCheff waar van toepassing.",
          "Reviews helpen je vertrouwen op te bouwen in de buurt.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor hobbykoks die serieuzer willen worden en voor ervaren thuiskoks die meer lokale klanten zoeken.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal bereik betekent kortere lijnen en vaak trouwere klanten die je via mond-tot-mond doorgeven.",
          "HomeCheff richt zich op makers en buren—niet op anonieme massa’s ver weg.",
        ],
      },
      discover: {
        title: "Wat je kunt plaatsen",
        paragraphs: [
          "Maaltijden, menu’s op dagen die jij kiest, seizoenspecials—wat past bij jouw keuken en wetgeving in jouw situatie.",
          "Lees ook de pagina over regels en starttips voordat je live gaat.",
        ],
      },
      cta: {
        primary: { label: "Start met verkopen", href: "/sell" },
        secondary: { label: "Hoe begin je als thuiskok?", href: "/hoe-begin-je-als-thuiskok" },
      },
    },
    en: {
      title: "Earn Money Cooking from Home | Start as a Home Cook | HomeCheff",
      description:
        "Earn money cooking from home. Get visible locally on HomeCheff without heavy setup—list your first dish and grow step by step.",
      h1: "Earn money cooking from home",
      intro: [
        "If you love cooking for others, you can turn it into income. HomeCheff is a marketplace: you choose what to make, pricing, and how pickup or delivery works—within sensible guardrails.",
        "No need to build your own shop: your profile and listings on the village square reach neighbours looking beyond chains.",
        "Start with one dish, learn what sells, expand when demand grows.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Create an account, complete the seller flow, and publish your first product with clear photos and description.",
          "Customers order through the platform; you prepare and hand off per your options. Payments run through HomeCheff where applicable.",
          "Reviews build neighbourhood trust.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Hobby cooks going serious and experienced home cooks who want more local customers.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local reach means shorter lines and often loyal word-of-mouth customers.",
          "HomeCheff focuses on makers and neighbours—not anonymous mass markets far away.",
        ],
      },
      discover: {
        title: "What you can list",
        paragraphs: [
          "Meals, selected service days, seasonal specials—whatever fits your kitchen and the rules that apply to you.",
          "Read the rules and getting-started pages before you go live.",
        ],
      },
      cta: {
        primary: { label: "Start selling", href: "/sell" },
        secondary: { label: "How to start as a home cook", href: "/en/how-to-start-as-a-home-cook" },
      },
    },
  },
  {
    id: "verkopen-huis",
    nlSlug: "verkopen-vanuit-huis",
    enSlug: "sell-from-home",
    relatedIds: ["geld-koken", "regels-verkopen", "platform-thuiskoks"],
    nl: {
      title: "Verkopen vanuit huis | Begin lokaal met HomeCheff",
      description:
        "Verkopen vanuit je eigen keuken of werkplaats? HomeCheff maakt je zichtbaar in de buurt — start lokaal, groei in je eigen tempo.",
      h1: "Verkopen vanuit huis",
      intro: [
        "Steeds meer mensen willen iets maken en delen—eten, groente, design. Verkopen vanuit huis vraagt om duidelijkheid naar klanten toe en een plek waar je gevonden wordt. HomeCheff speelt die rol: marketplace met profiel, bestellingen en ondersteuning.",
        "Je blijft zelf verantwoordelijk voor wat je verkoopt en welke regels gelden; wij helpen je met het platform en uitleg op hoog niveau.",
        "Ideaal om eerst in je eigen buurt te testen voordat je groots uitbreidt.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Registreer als maker, vul je profiel en plaats producten met eerlijke foto’s en voorwaarden.",
          "Klanten vinden je via het dorpsplein; bestellingen komen gestructureerd binnen.",
          "Gebruik reviews en chat om vertrouwen op te bouwen.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor thuiskoks, tuinders, designers en iedereen met een ambachtelijk product dat lokaal past.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal test je vraag zonder meteen landelijke logistiek nodig te hebben.",
          "HomeCheff combineert ontdekking (inspiratie) met verkopen (dorpsplein).",
        ],
      },
      discover: {
        title: "Wat je kunt plaatsen",
        paragraphs: [
          "Eten en aanverwante categorieën die het platform ondersteunt; zie de onboarding voor details per type maker.",
        ],
      },
      cta: {
        primary: { label: "Plaats je eerste item", href: "/sell/new" },
        secondary: { label: "Regels en uitleg", href: "/eten-verkopen-vanuit-huis-regels" },
      },
    },
    en: {
      title: "Sell from Home | Start Locally with HomeCheff",
      description:
        "Sell from your own kitchen or workshop. HomeCheff helps neighbours discover you—start local and grow at your pace.",
      h1: "Sell from home",
      intro: [
        "More people want to make and share—food, produce, design. Selling from home needs clarity for customers and a place to be found. HomeCheff is that marketplace: profile, orders and tooling.",
        "You remain responsible for compliance; we provide the platform and high-level guidance.",
        "Great to test demand nearby before scaling.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Register as a maker, complete your profile, and publish products with honest photos and terms.",
          "Customers find you on the village square; orders arrive in a structured way.",
          "Use reviews and chat to build trust.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Home cooks, growers, designers—anyone with a craft product that fits local discovery.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local lets you test demand without national logistics on day one.",
          "HomeCheff pairs inspiration with selling on the village square.",
        ],
      },
      discover: {
        title: "What you can list",
        paragraphs: [
          "Food and related categories supported by the platform—see onboarding for maker types.",
        ],
      },
      cta: {
        primary: { label: "Post your first item", href: "/sell/new" },
        secondary: { label: "Rules and guidance", href: "/en/rules-for-selling-food-from-home" },
      },
    },
  },
  {
    id: "begin-thuiskok",
    nlSlug: "hoe-begin-je-als-thuiskok",
    enSlug: "how-to-start-as-a-home-cook",
    relatedIds: ["geld-koken", "regels-verkopen", "koken-voor-anderen"],
    nl: {
      title: "Hoe begin je als thuiskok? | HomeCheff",
      description:
        "Stap voor stap beginnen als thuiskok op HomeCheff: profiel, eerste product en zichtbaarheid in je buurt. Geen marketingjargon — praktische start.",
      h1: "Hoe begin je als thuiskok?",
      intro: [
        "Beginnen als thuiskok hoeft niet ingewikkeld: eerst helderheid voor jezelf—wat maak je, hoe vaak, voor hoeveel personen—daarna je aanbod vertalen naar een productpagina die klanten begrijpen.",
        "Op HomeCheff doorloop je de verkoper-onboarding, vul je gegevens in en plaats je een eerste gerecht met foto, prijs en ophaal-/bezorginformatie.",
        "Vraag vroeg om feedback van vrienden of eerste klanten; kleine verbeteringen maken je pagina veel sterker.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Account aanmaken → verkoperflow → product plaatsen → zichtbaar op het dorpsplein.",
          "Bestellingen en betalingen lopen via het platform waar van toepassing, zodat klanten vertrouwen houden.",
          "Reviews en herhaalaankopen helpen je groeien.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor iedereen die van koken zijn of haar inkomen wil aanvullen of een kleine business wil opbouwen.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "In je eigen omgeving is mond-tot-mond krachtig; goede gerechten worden gedeeld.",
          "HomeCheff richt zich op buurt en makers, niet op anonieme schaal eerst.",
        ],
      },
      discover: {
        title: "Wat je kunt plaatsen",
        paragraphs: [
          "Start met één signature dish; voeg variatie toe als je weet wat loopt.",
        ],
      },
      cta: {
        primary: { label: "Start met verkopen", href: "/sell" },
        secondary: { label: "Bekijk regels", href: "/eten-verkopen-vanuit-huis-regels" },
      },
    },
    en: {
      title: "How to Start as a Home Cook | HomeCheff",
      description:
        "Practical steps to start as a home cook on HomeCheff: profile, first listing, and visibility nearby—without fluff.",
      h1: "How to start as a home cook",
      intro: [
        "Starting can be simple: clarify what you cook, how often, and for how many—then turn that into a product page customers understand.",
        "On HomeCheff you complete seller onboarding, add details, and publish a first dish with photo, price, and pickup/delivery info.",
        "Ask early customers for feedback; small tweaks make a big difference.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Account → seller flow → publish → appear on the village square.",
          "Orders and payments run through the platform where applicable to keep trust high.",
          "Reviews and repeats help you grow.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Anyone who wants to supplement income or build a small cooking business from home.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Word of mouth is powerful nearby; great dishes get shared.",
          "HomeCheff focuses on neighbourhood makers first—not anonymous scale on day one.",
        ],
      },
      discover: {
        title: "What you can list",
        paragraphs: [
          "Start with one signature dish; add variety once you learn what sells.",
        ],
      },
      cta: {
        primary: { label: "Start selling", href: "/sell" },
        secondary: { label: "Read the rules", href: "/en/rules-for-selling-food-from-home" },
      },
    },
  },
  {
    id: "koken-voor-anderen",
    nlSlug: "koken-voor-anderen-vanuit-huis",
    enSlug: "cook-for-others-from-home",
    relatedIds: ["geld-koken", "verkopen-huis", "hobby-koken"],
    nl: {
      title: "Koken voor anderen vanuit huis | HomeCheff",
      description:
        "Koken voor anderen en daar iets voor terugzien? HomeCheff verbindt je met buren die willen bestellen — veilig en overzichtelijk.",
      h1: "Koken voor anderen vanuit huis",
      intro: [
        "Koken voor anderen is meer dan een hobby als mensen er bewust voor betalen en op tijd afhankelijk zijn van jouw planning. Een platform helpt verwachtingen af te stemmen: wat, wanneer, waar en voor welke prijs.",
        "HomeCheff geeft je een winkelvenster in de buurt: zichtbaar voor mensen die anders nooit van je zouden horen.",
        "Je houdt controle over je agenda en aanbod; je schaalt op wanneer het goed voelt.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Plaats duidelijke producten met cut-off tijden als je die nodig hebt.",
          "Klanten bestellen vooruit; jij kookt in batches of per bestelling—wat bij jou past.",
          "Na afloop bouw je aan reviews en vaste klanten.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor mensen die van gastvrijheid houden en dat professioneler willen aanpakken.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Buren waarderen korte lijnen en herkenning.",
          "HomeCheff ondersteunt de ontdekking én de transactie.",
        ],
      },
      discover: {
        title: "Wat je kunt plaatsen",
        paragraphs: [
          "Menu’s, enkele gerechten, thema-avonden—als het past bij het platform en jouw mogelijkheden.",
        ],
      },
      cta: {
        primary: { label: "Plaats je eerste item", href: "/sell/new" },
        secondary: { label: "Ontdek platform", href: "/platform-voor-thuiskoks" },
      },
    },
    en: {
      title: "Cook for Others from Home | HomeCheff",
      description:
        "Cook for others and get paid? HomeCheff connects you with neighbours who want to order—clearly and safely.",
      h1: "Cook for others from home",
      intro: [
        "Cooking for others becomes more than a hobby when people pay and rely on your timing. A platform aligns expectations: what, when, where, and price.",
        "HomeCheff gives you a neighbourhood storefront—visible to people who might never find you otherwise.",
        "You control your schedule and range; you scale when it feels right.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Publish clear products with cut-off times if you need them.",
          "Customers order ahead; you cook in batches or per order—your choice.",
          "Reviews and repeats follow.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "People who love hospitality and want a more professional structure.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Neighbours value short lines and recognition.",
          "HomeCheff supports discovery and the transaction.",
        ],
      },
      discover: {
        title: "What you can list",
        paragraphs: [
          "Menus, single dishes, themed nights—if it fits the platform and your capacity.",
        ],
      },
      cta: {
        primary: { label: "Post your first item", href: "/sell/new" },
        secondary: { label: "Explore the platform", href: "/en/platform-for-home-cooks" },
      },
    },
  },
  {
    id: "hobby-koken",
    nlSlug: "verdienen-met-hobby-koken",
    enSlug: "earn-money-with-home-cooking",
    relatedIds: ["geld-koken", "begin-thuiskok", "koken-voor-anderen"],
    nl: {
      title: "Verdienen met hobby koken | HomeCheff",
      description:
        "Van hobby naar eerste euro’s: verdienen met koken op HomeCheff. Lokaal starten, leren wat werkt, en groeien in je eigen tempo.",
      h1: "Verdienen met hobbykoken",
      intro: [
        "Hobbykoken wordt pas interessant als inkomen als je weet wat je tijd waard is en hoe je klanten vindt. HomeCheff helpt met zichtbaarheid: je staat waar buurten zoeken.",
        "Je hoeft geen horecamanager te zijn; wel is het slim om prijs, porties en allergenen helder te communiceren.",
        "Begin met kleine oplages; succes nodigt uit om uit te breiden.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Maak een verkoperaccount, zet je eerste product live en test reacties in de buurt.",
          "Optimaliseer foto’s en beschrijving op basis van wat je leert.",
          "Herhaal met nieuwe gerechten of vaste dagen.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor makers die nu vooral voor vrienden koken en klaar zijn voor betalende klanten.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal houdt logistiek behapbaar terwijl je leert.",
          "HomeCheff geeft structuur zonder dat je eerst een merk hoeft te bouwen.",
        ],
      },
      discover: {
        title: "Wat je kunt plaatsen",
        paragraphs: [
          "Signature baksels, weekmenu’s, proefpakketten—wat past bij jouw hobby en tijd.",
        ],
      },
      cta: {
        primary: { label: "Start met verkopen", href: "/sell" },
        secondary: { label: "Account aanmaken", href: "/register" },
      },
    },
    en: {
      title: "Earn Money with Home Cooking | HomeCheff",
      description:
        "Turn a cooking hobby into your first sales on HomeCheff. Start local, learn what works, grow at your pace.",
      h1: "Earn money with home cooking",
      intro: [
        "A hobby becomes income when you know what your time is worth and how to find customers. HomeCheff helps with visibility—you appear where neighbourhoods search.",
        "You don’t need to be a restaurant manager; you do need clear pricing, portions, and allergen communication.",
        "Start with small batches; success invites expansion.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Create a seller account, publish your first product, and test local response.",
          "Improve photos and copy from what you learn.",
          "Add dishes or fixed service days.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Makers who mostly cook for friends and are ready for paying customers.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local keeps logistics manageable while you learn.",
          "HomeCheff gives structure without forcing you to build a brand first.",
        ],
      },
      discover: {
        title: "What you can list",
        paragraphs: [
          "Signature bakes, weekly menus, tasters—whatever fits your hobby and time.",
        ],
      },
      cta: {
        primary: { label: "Start selling", href: "/sell" },
        secondary: { label: "Create an account", href: "/register" },
      },
    },
  },
  {
    id: "platform-thuiskoks",
    nlSlug: "platform-voor-thuiskoks",
    enSlug: "platform-for-home-cooks",
    relatedIds: ["wat-is-thuisgekookt", "regels-verkopen", "begin-thuiskok"],
    nl: {
      title: "Platform voor thuiskoks | HomeCheff",
      description:
        "HomeCheff is het platform voor thuiskoks: vind klanten in je buurt, toon je aanbod en beheer bestellingen overzichtelijk.",
      h1: "Het platform voor thuiskoks",
      intro: [
        "Een platform voor thuiskoks moet twee kanten bedienen: kopers die snel iets lekkers willen, en makers die serieus willen verkopen zonder eigen IT-team. HomeCheff combineert inspiratie, dorpsplein en checkout.",
        "Je profiel vertelt wie je bent; je producten vertellen wat je maakt. Reviews en chat—waar beschikbaar—maken het menselijk.",
        "We groeien mee met makers: begin klein, breid uit als je buurt mee groeit.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Kopers ontdekken via dorpsplein en inspiratie; makers publiceren en beheren orders via de verkoperomgeving.",
          "Betalingen en voorwaarden zijn ingebed in de flow waar het platform dat ondersteunt.",
          "Zo blijft één plek de bron van waarheid.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor thuiskoks en kleine makers die een digitale etalage zoeken.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal is onze focus: buurt-economie en minder anonieme ketens.",
          "HomeCheff wil makers zichtbaar maken zonder dat zij eerst marketeers moeten worden.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken of plaatsen",
        paragraphs: [
          "Kopers: gerechten en meer. Makers: je eerste listing tot een volwassen aanbod.",
        ],
      },
      cta: {
        primary: { label: "Start met verkopen", href: "/sell" },
        secondary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
      },
    },
    en: {
      title: "Platform for Home Cooks | HomeCheff",
      description:
        "HomeCheff is a platform for home cooks: reach nearby customers, showcase your offer, and manage orders in one place.",
      h1: "A platform for home cooks",
      intro: [
        "A home-cook platform must serve buyers who want tasty food fast and sellers who want to sell seriously without building IT. HomeCheff combines inspiration, the village square, and checkout.",
        "Your profile tells who you are; your products tell what you make. Reviews and chat—where available—keep it human.",
        "We grow with makers: start small, expand as your neighbourhood joins in.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Buyers discover via the village square and inspiration; sellers publish and manage orders in the seller area.",
          "Payments and terms are embedded in the flow where supported.",
          "One place stays the source of truth.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Home cooks and small makers who want a digital shop window.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local is our focus: neighbourhood economy over anonymous chains.",
          "HomeCheff aims to make makers visible without forcing them to become marketers first.",
        ],
      },
      discover: {
        title: "What you can discover or list",
        paragraphs: [
          "Buyers: meals and more. Makers: from first listing to a mature offer.",
        ],
      },
      cta: {
        primary: { label: "Start selling", href: "/sell" },
        secondary: { label: "Discover local offers", href: "/dorpsplein" },
      },
    },
  },
  {
    id: "wat-is-thuisgekookt",
    nlSlug: "wat-is-thuisgekookt-eten",
    enSlug: "what-is-home-cooked-food",
    relatedIds: ["thuisgekookt-kopen", "regels-verkopen", "platform-thuiskoks"],
    nl: {
      title: "Wat is thuisgekookt eten? | HomeCheff",
      description:
        "Wat betekent thuisgekookt eten op HomeCheff? Uitleg over makers, versheid en hoe het verschilt van standaard bezorgchains.",
      h1: "Wat is thuisgekookt eten?",
      intro: [
        "Thuisgekookt eten is—in de geest van HomeCheff—eten dat door particulieren of kleine makers is bereid, vaak in een huiskeuken of kleine productieruimte, in plaats van een anonieme centrale keuken ver weg.",
        "Het betekent niet automatisch dat alles ‘gezonder’ is; het betekent wél dat je vaker weet wie kookt en hoe het wordt aangeboden.",
        "Op het platform omschrijft elke maker eigen voorwaarden: afhalen, bezorging, allergeneninformatie—lees die altijd voor je bestelt.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Makers plaatsen hun gerechten met foto en uitleg. Jij vergelijkt en bestelt zoals bij andere marketplace-items.",
          "HomeCheff faciliteert ontdekking en afhandeling; de maker blijft verantwoordelijk voor de juiste productinformatie.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor nieuwsgierige eters én voor makers die willen uitleggen wat ze verkopen.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal past vaak bij korte lijnen en unieke aanbod.",
          "HomeCheff wil die makers zichtbaar maken in de buurt.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Van comfortfood tot niche-keukens—afhankelijk van wie er in jouw regio actief is.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Veelgestelde vragen", href: "/faq" },
      },
    },
    en: {
      title: "What Is Home-Cooked Food? | HomeCheff",
      description:
        "What does home-cooked food mean on HomeCheff? How makers work, what freshness means, and how it differs from typical delivery chains.",
      h1: "What is home-cooked food?",
      intro: [
        "On HomeCheff, home-cooked food generally means meals prepared by individuals or small makers—often in a home or small kitchen—rather than a distant anonymous central kitchen.",
        "It does not automatically mean ‘healthier’; it often means you can see who cooks and how it is offered.",
        "Each maker describes terms: pickup, delivery, allergen notes—read them before you order.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Makers publish dishes with photos and detail. You compare and order like other marketplace items.",
          "HomeCheff supports discovery and checkout; makers remain responsible for accurate product information.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Curious eaters and makers who want clarity on what ‘home-cooked’ means here.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local often means short lines and unique supply.",
          "HomeCheff aims to make those makers visible nearby.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "From comfort food to niche cuisines—depending on who is active near you.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "FAQ", href: "/faq" },
      },
    },
  },
  {
    id: "regels-verkopen",
    nlSlug: "eten-verkopen-vanuit-huis-regels",
    enSlug: "rules-for-selling-food-from-home",
    relatedIds: ["verkopen-huis", "begin-thuiskok", "platform-thuiskoks"],
    nl: {
      title: "Eten verkopen vanuit huis: regels en uitleg | HomeCheff",
      description:
        "Orientatie over eten verkopen vanuit huis: wat je op HomeCheff regelt, waar je zelf verantwoordelijk voor bent. Geen juridisch advies — controleer lokale wetgeving.",
      h1: "Eten verkopen vanuit huis: regels en uitleg",
      intro: [
        "Eten verkopen vanuit huis raakt vaak hygiëne, vergunningen en belasting—dat verschilt per gemeente en situatie. HomeCheff is een marketplace en is geen juridisch adviseur: check altijd officiële bronnen en waar nodig een professional.",
        "Op het platform vragen we makers om eerlijke productinformatie en duidelijke voorwaarden richting klanten.",
        "Door transparant te zijn over ingrediënten, allergenen en ophaal-/bezorgafspraken help je jezelf en je klanten.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "De onboarding helpt je de stappen te zien die horen bij verkopen op HomeCheff.",
          "Daarnaast ben jij zelf verantwoordelijk om te voldoen aan regels die voor jou gelden.",
          "Bij twijfel: gemeente, Voedsel en Waren Autoriteit of een adviseur raadplegen.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor iedere maker die serieus wil starten en geen verrassingen wil achteraf.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal verkoop betekent vaak duidelijke afspraken met buren—maar de wettelijke kaders blijven persoonlijk.",
          "HomeCheff ondersteunt zichtbaarheid en afhandeling, niet de volledige compliance-check voor elke situatie.",
        ],
      },
      discover: {
        title: "Wat je kunt plaatsen",
        paragraphs: [
          "Zodra je aan de voor jou geldende regels voldoet, kun je producten publiceren die het platform ondersteunt.",
        ],
      },
      cta: {
        primary: { label: "Start met verkopen", href: "/sell" },
        secondary: { label: "Contact", href: "/contact" },
      },
    },
    en: {
      title: "Rules for Selling Food from Home | HomeCheff",
      description:
        "Orientation on selling food from home: what HomeCheff handles, what you remain responsible for. Not legal advice—check local rules.",
      h1: "Rules for selling food from home",
      intro: [
        "Selling food from home often touches hygiene, permits, and tax—this varies by municipality and case. HomeCheff is a marketplace, not your lawyer: always verify official sources and professionals when needed.",
        "We ask sellers for honest product information and clear customer-facing terms.",
        "Transparency on ingredients, allergens, and pickup/delivery helps everyone.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Seller onboarding shows steps relevant to selling on HomeCheff.",
          "You remain responsible for rules that apply to you.",
          "When in doubt, contact your municipality, food safety authority, or an advisor.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Makers who want to start seriously and avoid surprises later.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local selling often means clear neighbourly agreements—but legal frames remain personal.",
          "HomeCheff supports visibility and checkout, not a full compliance audit for every case.",
        ],
      },
      discover: {
        title: "What you can list",
        paragraphs: [
          "Once you meet the rules that apply to you, publish products the platform supports.",
        ],
      },
      cta: {
        primary: { label: "Start selling", href: "/sell" },
        secondary: { label: "Contact", href: "/contact" },
      },
    },
  },
  {
    id: "lokale-producten",
    nlSlug: "lokale-producten-kopen",
    enSlug: "buy-local-products",
    relatedIds: ["maaltijden-aan-huis", "thuisgekookt-kopen", "alternatief-thuisbezorgd"],
    nl: {
      title: "Lokale producten kopen | HomeCheff",
      description:
        "Lokale producten kopen bij makers bij jou in de buurt. Eten, groente, design en meer op HomeCheff — ontdek het dorpsplein.",
      h1: "Lokale producten kopen",
      intro: [
        "Lokaal kopen hoeft niet te betekenen dat je alles zelf moet regelen via markten alleen. HomeCheff brengt makers bij elkaar: eten, tuinproducten, soms design—allemaal met dezelfde ontdek- en bestelervaring.",
        "Je steunt mensen uit de regio en ziet vaak sneller wat seizoen en creativiteit toevoegen.",
        "Filter op afstand, categorie of type maker en bouw je eigen favorieten op.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Het dorpsplein toont aanbod gesorteerd op wat jij nodig hebt: locatie, prijs, categorie.",
          "Bestellen is gelijk aan andere producten op het platform.",
          "Reviews helpen betrouwbare makers te vinden.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor bewuste kopers die meer willen dan supermarkt-standaard.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Minder kilometers, meer unieke spullen, meer geld dat in de buurt blijft.",
          "HomeCheff maakt lokaal vindbaar zonder dat elke maker een eigen site nodig heeft.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Seizoensgroenten, jams, maaltijden, unieke creaties—per regio verschillend.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Inspiratie", href: "/inspiratie" },
      },
    },
    en: {
      title: "Buy Local Products | HomeCheff",
      description:
        "Buy local products from makers near you—food, produce, design and more on HomeCheff. Browse the village square today.",
      h1: "Buy local products",
      intro: [
        "Buying local does not have to mean only weekend markets. HomeCheff gathers makers—food, garden goods, sometimes design—with one discovery and checkout experience.",
        "You support regional creators and often see seasonality and creativity faster.",
        "Filter by distance, category, or maker type and build favourites.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "The village square shows listings sorted by what you need: location, price, category.",
          "Ordering matches other products on the platform.",
          "Reviews surface reliable makers.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Buyers who want more than supermarket sameness.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Fewer miles, more unique goods, more money staying nearby.",
          "HomeCheff makes local findable without every maker needing a custom site.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Seasonal veg, preserves, meals, unique crafts—varies by region.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Inspiration", href: "/inspiratie" },
      },
    },
  },
  {
    id: "alternatief-thuisbezorgd",
    nlSlug: "alternatief-voor-thuisbezorgd",
    enSlug: "alternative-to-takeaway-platforms",
    relatedIds: ["thuisgekookt-kopen", "lokale-producten", "eten-bij-particulieren"],
    nl: {
      title: "Alternatief voor Thuisbezorgd | HomeCheff",
      description:
        "Zoek je een alternatief voor grote bezorgapps? HomeCheff verbindt je met thuiskoks en lokale makers — ander verhaal, dichterbij.",
      h1: "Een alternatief voor de grote bezorgplatforms",
      intro: [
        "Grote bezorgapps zijn handig, maar vaak anoniem en ketengericht. HomeCheff is bewust anders: je ontdekt mensen die zelf koken of maken, dichter bij huis.",
        "Het aanbod is uniek per buurt; wat je vindt, hangt af van wie er actief is—dat maakt het levend en lokaal.",
        "Geen belofte dat alles binnen twintig minuten voor de deur staat; wél de kans op eten met een gezicht en een verhaal.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Je bladert op het dorpsplein, vergelijkt makers en bestelt volgens hun afspraken.",
          "Geen race-to-the-bottom op koeriersfee; wél directe relaties tussen buurt en maker.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor wie bewust wil eten en de standaard apps zat is.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal en kleinschalig passen bij makers die geen miljoenenmarketingbudget hebben maar wél kwaliteit leveren.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Maaltijden en meer van makers die je anders niet zou vinden.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Start met verkopen", href: "/sell" },
      },
    },
    en: {
      title: "Alternative to Takeaway Platforms | HomeCheff",
      description:
        "Looking beyond big delivery apps? HomeCheff connects you with home cooks and local makers—closer, more personal food.",
      h1: "An alternative to big takeaway platforms",
      intro: [
        "Large delivery apps are convenient but often anonymous and chain-heavy. HomeCheff is different: discover people who cook or make near you.",
        "Assortment varies by neighbourhood—what you see depends on who is active, which keeps it local and alive.",
        "We don’t promise everything in twenty minutes; we do offer food with a face and a story.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Browse the village square, compare makers, and order on their terms.",
          "Fewer courier races; more direct neighbourhood relationships.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Anyone who wants conscious eating beyond the usual apps.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Small-scale local fits makers without huge ad budgets but with real quality.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Meals and more from makers you might never find otherwise.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Start selling", href: "/sell" },
      },
    },
  },
  {
    id: "meals-rotterdam",
    nlSlug: "maaltijden-in-rotterdam",
    enSlug: "meals-in-rotterdam",
    relatedIds: ["maaltijden-aan-huis", "lokale-producten", "thuisgekookt-kopen"],
    nl: {
      title: "Maaltijden in Rotterdam | Lokale thuiskoks en verse gerechten | HomeCheff",
      description:
        "Maaltijden in Rotterdam via lokale makers op HomeCheff. Ontdek thuisgekookt eten en buurtaanbod — start op het dorpsplein.",
      h1: "Maaltijden in Rotterdam",
      intro: [
        "Rotterdam barst van creativiteit—en dat proef je ook in de keuken. Op HomeCheff vind je thuiskoks en makers die gerechten aanbieden die passen bij jouw buurt, van comfort tot wereldse smaken.",
        "Omdat aanbod afhangt van wie er actief is, is het dorpsplein de beste plek om te zien wat er vandaag speelt rond Rotterdam en omgeving.",
        "Combineer ontdekking met een concrete bestelling: zo steun je direct iemand uit de regio.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Zet je locatie of filter op afstand rond Rotterdam. Je ziet producten met prijs, foto en voorwaarden.",
          "Bestellen gaat via de gebruikelijke checkout; afhalen of bezorging volgt de maker.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor Rotterdammers en forenzen die lokaal willen eten zonder standaard keten.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Stedelijke buurten profiteren van korte lijnen en veel variatie als genoeg makers meedoen.",
          "HomeCheff bundelt die makers op één plek.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Ook onze korte landingspagina /maaltijden/rotterdam helpt je op weg; het dorpsplein toont actueel aanbod.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Meer over maaltijden Rotterdam", href: "/maaltijden/rotterdam" },
      },
    },
    en: {
      title: "Meals in Rotterdam | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Rotterdam from local makers on HomeCheff. Discover home-cooked food near you—browse the village square today.",
      h1: "Meals in Rotterdam",
      intro: [
        "Rotterdam is creative—and that shows in kitchens too. On HomeCheff, home cooks and makers offer dishes that fit the city, from comfort to global flavours.",
        "Because listings depend on who is active, the village square is the best place to see what is live around Rotterdam today.",
        "Pair browsing with ordering to support someone local directly.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Set your area or filter distance around Rotterdam. You’ll see products with price, photo, and terms.",
          "Order through checkout; pickup or delivery follows the maker’s options.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Locals and commuters who want neighbourhood food beyond standard chains.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Urban neighbourhoods benefit from short lines and variety when makers participate.",
          "HomeCheff gathers them in one place.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Our short hub at /maaltijden/rotterdam is another entry point; the village square shows live listings.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "More on meals in Rotterdam", href: "/maaltijden/rotterdam" },
      },
    },
  },
  {
    id: "meals-amsterdam",
    nlSlug: "maaltijden-in-amsterdam",
    enSlug: "meals-in-amsterdam",
    relatedIds: ["maaltijden-aan-huis", "lokale-producten", "alternatief-thuisbezorgd"],
    nl: {
      title: "Maaltijden in Amsterdam | Lokale thuiskoks en verse gerechten | HomeCheff",
      description:
        "Maaltijden in Amsterdam via HomeCheff. Vind thuiskoks en lokaal aanbod — vers en dichtbij, op het dorpsplein.",
      h1: "Maaltijden in Amsterdam",
      intro: [
        "Amsterdam heeft buurten met elk hun eigen smaak. HomeCheff helpt je makers te vinden die dichtbij staan—niet alleen toeristische routes, maar echte buurtkoks en kleine ondernemers.",
        "Het aanbod wisselt; daarom is live bladeren op het dorpsplein de beste check.",
        "Zo combineer je stadsgemak met lokaal karakter.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Filter op jouw wijk of reisafstand. Productpagina’s tonen wat je kunt verwachten.",
          "Afrekenen en afspraken verlopen via het platform.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor Amsterdammers die afwisseling zoeken naast bekende bezorgopties.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Lokaal in de stad verkleint afstand tussen maker en klant—letterlijk en figuurlijk.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Zie ook /maaltijden/amsterdam voor een snelle start; daarna het dorpsplein voor actuele items.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Maaltijden Amsterdam", href: "/maaltijden/amsterdam" },
      },
    },
    en: {
      title: "Meals in Amsterdam | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Amsterdam on HomeCheff. Find home cooks and local food—fresh and nearby on the village square.",
      h1: "Meals in Amsterdam",
      intro: [
        "Amsterdam’s neighbourhoods each taste different. HomeCheff helps you find makers nearby—not only tourist routes, but real local cooks.",
        "Listings change, so live browsing on the village square is the best check.",
        "City convenience with local character.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Filter by area or travel distance. Product pages set expectations.",
          "Checkout and arrangements run through the platform.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Amsterdam residents who want variety beyond familiar delivery options.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Local in the city shortens the distance between maker and customer.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "See /maaltijden/amsterdam for a quick start, then the village square for live items.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Meals in Amsterdam hub", href: "/maaltijden/amsterdam" },
      },
    },
  },
  {
    id: "meals-den-haag",
    nlSlug: "maaltijden-in-den-haag",
    enSlug: "meals-in-the-hague",
    relatedIds: ["maaltijden-aan-huis", "eten-bij-particulieren", "lokale-producten"],
    nl: {
      title: "Maaltijden in Den Haag | Lokale thuiskoks en verse gerechten | HomeCheff",
      description:
        "Maaltijden in Den Haag via lokale makers op HomeCheff. Thuiskoks en buurtgerechten — ontdek het dorpsplein.",
      h1: "Maaltijden in Den Haag",
      intro: [
        "Den Haag combineert internationale invloeden met Haagse buurtcultuur. HomeCheff laat zien welke makers daar vandaag actief zijn—van Scheveningen tot Bezuidenhout, afhankelijk van aanbod.",
        "Gebruik filters om dichter bij huis te blijven of juist iets verder te kijken.",
        "Zo vind je maaltijden die passen bij jouw week zonder standaardmenu.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Stel locatie in en blader door producten. Elke listing legt afhalen/bezorging uit.",
          "Je betaalt via het platform en volgt de afspraken van de maker.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor Hagenaars die lokaal willen ontdekken.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Buurtmakers geven kleur aan de stad; HomeCheff maakt ze vindbaar.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Extra startpunt: /maaltijden/den-haag — daarna dorpsplein voor live aanbod.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Maaltijden Den Haag", href: "/maaltijden/den-haag" },
      },
    },
    en: {
      title: "Meals in The Hague | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in The Hague from local makers on HomeCheff. Home-cooked dishes near you—check the village square.",
      h1: "Meals in The Hague",
      intro: [
        "The Hague mixes international influences with neighbourhood culture. HomeCheff shows which makers are active today—from the coast inward, depending on listings.",
        "Use filters to stay close to home or look a bit wider.",
        "Find meals that fit your week without a generic menu.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Set location and browse products. Each listing explains pickup or delivery.",
          "Pay through the platform and follow the maker’s instructions.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Locals who want to discover nearby makers.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Neighbourhood makers add colour; HomeCheff makes them findable.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Also see /maaltijden/den-haag, then the village square for live supply.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "The Hague meals hub", href: "/maaltijden/den-haag" },
      },
    },
  },
  {
    id: "meals-utrecht",
    nlSlug: "maaltijden-in-utrecht",
    enSlug: "meals-in-utrecht",
    relatedIds: ["maaltijden-aan-huis", "wat-eten-vandaag", "thuisgekookt-kopen"],
    nl: {
      title: "Maaltijden in Utrecht | Lokale thuiskoks en verse gerechten | HomeCheff",
      description:
        "Maaltijden in Utrecht via HomeCheff. Lokale thuiskoks en vers aanbod — begin op het dorpsplein.",
      h1: "Maaltijden in Utrecht",
      intro: [
        "Utrecht is compact en buurtgericht—perfect voor lokaal eten. HomeCheff toont welke makers nu iets voor je hebben, binnen de regio die jij kiest.",
        "Studenten, gezinnen en professionals delen dezelfde vraag: wat eten we—met een lokaal antwoord.",
        "Blader, vergelijk en bestel wanneer iets past.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Locatie of straal instellen, producten openen, mandje vullen.",
          "Communicatie en betaling lopen via het platform waar ondersteund.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor iedereen in Utrecht die snel iets lekkers lokaal wil.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Korte afstanden in de stad maken verse afhaling logisch.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Start ook op /maaltijden/utrecht; het dorpsplein toont wat live is.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Maaltijden Utrecht", href: "/maaltijden/utrecht" },
      },
    },
    en: {
      title: "Meals in Utrecht | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Utrecht on HomeCheff. Local home cooks and fresh listings—start on the village square.",
      h1: "Meals in Utrecht",
      intro: [
        "Utrecht is compact and neighbourhood-driven—great for local food. HomeCheff shows which makers have something for you in the radius you pick.",
        "Students, families, and professionals share the same question—answered locally here.",
        "Browse, compare, and order when it fits.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Set location or radius, open products, fill your cart.",
          "Communication and payment run through the platform where supported.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Anyone in Utrecht who wants tasty local food quickly.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "Short city distances make fresh pickup practical.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "Also start at /maaltijden/utrecht; the village square shows live listings.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Utrecht meals hub", href: "/maaltijden/utrecht" },
      },
    },
  },
  {
    id: "meals-eindhoven",
    nlSlug: "maaltijden-in-eindhoven",
    enSlug: "meals-in-eindhoven",
    relatedIds: ["maaltijden-aan-huis", "lokale-producten", "platform-thuiskoks"],
    nl: {
      title: "Maaltijden in Eindhoven | Lokale thuiskoks en verse gerechten | HomeCheff",
      description:
        "Maaltijden in Eindhoven via HomeCheff. Ontdek thuiskoks in de regio — dorpsplein voor actueel aanbod.",
      h1: "Maaltijden in Eindhoven",
      intro: [
        "Eindhoven bruist van tech en creativiteit—en dat zie je ook terug bij makers die lokaal koken en verkopen. HomeCheff helpt je die makers te vinden zonder eindeloos te zoeken op social media.",
        "Het aanbod groeit mee met nieuwe inschrijvingen; daarom is regelmatig kijken op het dorpsplein slim.",
        "Bestel als je iets ziet dat past, en bouw favoriete makers op.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "Zoek in de regio Eindhoven, open producten en volg checkout.",
          "Ophaal- en bezorgopties staan op de productpagina.",
        ],
      },
      audience: {
        title: "Voor wie is dit interessant?",
        paragraphs: [
          "Voor inwoners en expats die lokaal willen eten in de regio.",
        ],
      },
      whyLocal: {
        title: "Waarom lokaal en waarom HomeCheff?",
        paragraphs: [
          "Brainport-regio + buurtmakers = unieke smaken dichtbij.",
        ],
      },
      discover: {
        title: "Wat je kunt ontdekken",
        paragraphs: [
          "Zie /maaltijden/eindhoven en schakel daarna door naar het dorpsplein.",
        ],
      },
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/dorpsplein" },
        secondary: { label: "Maaltijden Eindhoven", href: "/maaltijden/eindhoven" },
      },
    },
    en: {
      title: "Meals in Eindhoven | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Eindhoven on HomeCheff. Find home cooks in the region—the village square shows current listings.",
      h1: "Meals in Eindhoven",
      intro: [
        "Eindhoven mixes tech and creativity—and that shows in local makers who cook and sell. HomeCheff helps you find them without endless social scrolling.",
        "Supply grows as new sellers join; checking the village square regularly pays off.",
        "Order when something fits and build favourite makers.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Search around Eindhoven, open products, complete checkout.",
          "Pickup and delivery options are on the product page.",
        ],
      },
      audience: {
        title: "Who is this for?",
        paragraphs: [
          "Residents and newcomers who want to eat locally in the region.",
        ],
      },
      whyLocal: {
        title: "Why local—and why HomeCheff?",
        paragraphs: [
          "The Brainport area plus neighbourhood makers means unique flavours nearby.",
        ],
      },
      discover: {
        title: "What you can discover",
        paragraphs: [
          "See /maaltijden/eindhoven, then continue to the village square.",
        ],
      },
      cta: {
        primary: { label: "Discover local offers", href: "/dorpsplein" },
        secondary: { label: "Eindhoven meals hub", href: "/maaltijden/eindhoven" },
      },
    },
  },
];
