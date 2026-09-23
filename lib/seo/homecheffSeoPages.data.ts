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
        "Op HomeCheff koop je eten dat iemand bij jou in de buurt zelf heeft gekookt. Je ziet wie het maakt, wat het kost en of je het ophaalt of laat bezorgen. Dat laatste bepaalt de maker per gerecht.",
        "Het aanbod verschilt per buurt en per dag, omdat het afhangt van wie er op dat moment kookt. Op het dorpsplein zie je wat er nu te krijgen is.",
      ],
      sections: [
        {
          title: "Zo bestel je",
          paragraphs: [
            "Open het dorpsplein en kijk wat er bij jou in de buurt wordt aangeboden. Bij elk gerecht staan de prijs, een omschrijving van de maker en de manier van afhalen of bezorgen.",
            "Leg wat je wilt in je winkelmand en reken af via de checkout. De maker gaat daarna aan de slag, en je haalt je bestelling op of krijgt hem gebracht zoals bij het gerecht staat.",
            "Achteraf kun je een beoordeling geven. Daar hebben andere kopers in de buurt wat aan, en de maker ook.",
          ],
        },
        {
          title: "Waar je op let voordat je bestelt",
          paragraphs: [
            "Lees de omschrijving goed. Daarin vermeldt de maker wat erin zit en welke allergenen erin kunnen zitten. Twijfel je ergens over, stuur dan eerst een bericht.",
            "De maker is verantwoordelijk voor de juiste productinformatie. HomeCheff zorgt dat je het aanbod vindt en dat de betaling goed verloopt.",
          ],
        },
        {
          title: "Meer dan maaltijden",
          paragraphs: [
            "Naast maaltijden bieden mensen ook baksels, groente uit eigen tuin en andere zelfgemaakte dingen aan. Wil je eerst ideeën opdoen, dan vind je bij Inspiratie recepten en projecten die niet te koop zijn.",
          ],
        },
      ],
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Bekijk inspiratie", href: "/?chip=inspiration" },
      },
    },
    en: {
      title: "Buy Home-Cooked Food | Fresh Meals from Local Cooks | HomeCheff",
      description:
        "Order home-cooked meals from cooks near you. Fresh, local and direct on HomeCheff — browse the village square and buy with confidence.",
      h1: "Buy home-cooked food from local makers",
      intro: [
        "On HomeCheff you buy food that someone near you has cooked themselves. You can see who made it, what it costs, and whether you collect it or have it delivered. The maker decides that per dish.",
        "What's available changes by neighbourhood and by day, because it depends on who is cooking. The village square shows what you can get right now.",
      ],
      sections: [
        {
          title: "How to order",
          paragraphs: [
            "Open the village square and see what people near you are offering. Each dish lists the price, the maker's own description, and how pickup or delivery works.",
            "Add what you want to your cart and pay at checkout. The maker then prepares it, and you collect it or have it brought to you as described on the listing.",
            "Afterwards you can leave a review. That helps other buyers nearby, and it helps the maker too.",
          ],
        },
        {
          title: "What to check before you order",
          paragraphs: [
            "Read the description properly. The maker lists what's in the dish and which allergens it may contain. If you're unsure about anything, send a message first.",
            "The maker is responsible for accurate product information. HomeCheff makes the offer findable and handles the payment.",
          ],
        },
        {
          title: "Not only meals",
          paragraphs: [
            "Alongside meals, people offer baked goods, vegetables from their own garden and other things they make. If you'd rather start with ideas, Inspiration has recipes and projects that aren't for sale.",
          ],
        },
      ],
      cta: {
        primary: { label: "Discover local offers", href: "/?chip=sale" },
        secondary: { label: "Explore inspiration", href: "/?chip=inspiration" },
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        primary: { label: "Bekijk wat anderen maken", href: "/?chip=inspiration" },
        secondary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
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
        primary: { label: "Explore what others make", href: "/?chip=inspiration" },
        secondary: { label: "Discover local offers", href: "/?chip=sale" },
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Bekijk inspiratie", href: "/?chip=inspiration" },
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
        secondary: { label: "Explore inspiration", href: "/?chip=inspiration" },
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
        "Kook je graag en vaak, dan kun je daar op HomeCheff iets mee verdienen. Jij bepaalt wat je maakt, wat het kost en of je bezorgt of mensen het laten ophalen.",
        "Hoeveel je overhoudt, hangt af van je prijzen, je kosten, de tijd die je erin steekt en de vraag in jouw buurt. Een vast bedrag kan niemand je beloven.",
      ],
      sections: [
        {
          title: "Wat je verkoopt en aan wie",
          paragraphs: [
            "Denk aan maaltijden op vaste dagen, een wekelijks menu of seizoensgerechten. Je kopers zijn mensen uit je omgeving die op het dorpsplein kijken. Een eigen webshop heb je niet nodig: je profiel en je aanbod staan op HomeCheff.",
          ],
        },
        {
          title: "Wat je overhoudt",
          paragraphs: [
            "Wat kopers betalen, is je omzet. Daar gaan je kosten af, zoals ingrediënten en verpakking, en de platformfee die HomeCheff per verkoop inhoudt. Wat overblijft, is je resultaat.",
            "Afhankelijk van je situatie telt dat resultaat mee voor de inkomstenbelasting en kan het gevolgen hebben voor toeslagen. Met VerdienCheck kun je dat voor je eigen situatie doorrekenen.",
          ],
        },
        {
          title: "Verstandig beginnen",
          paragraphs: [
            "Begin met één gerecht en een klein aantal porties, zodat je ziet wat werkt. Lees de regels voor eten verkopen vanuit huis voordat je live gaat. Ook als je af en toe verkoopt, werk je veilig en hygiënisch en vermeld je allergenen.",
            "Beoordelingen van kopers helpen je om in de buurt vertrouwen op te bouwen.",
          ],
        },
      ],
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
        "If you cook often and enjoy it, you can earn something from it on HomeCheff. You decide what you make, what it costs, and whether you deliver or people collect.",
        "What you keep depends on your prices, your costs, the time you put in and demand in your area. Nobody can promise you a fixed amount.",
      ],
      sections: [
        {
          title: "What you sell and to whom",
          paragraphs: [
            "Think of meals on set days, a weekly menu or seasonal dishes. Your buyers are people nearby who browse the village square. You don't need your own web shop: your profile and listings live on HomeCheff.",
          ],
        },
        {
          title: "What you actually keep",
          paragraphs: [
            "What buyers pay is your revenue. Your costs come off that, such as ingredients and packaging, and so does the platform fee HomeCheff charges on each sale. What's left is your profit.",
            "Depending on your situation, that profit counts towards income tax and can affect Dutch benefits (toeslagen). VerdienCheck lets you work that out for your own situation.",
          ],
        },
        {
          title: "Starting sensibly",
          paragraphs: [
            "Start with one dish and a small number of portions so you can see what works. Read the rules for selling food from home before you go live. Even if you only sell occasionally, you need to work safely and hygienically and list allergens.",
            "Reviews from buyers help you build trust in your neighbourhood.",
          ],
        },
      ],
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
        "Beginnen als thuiskok draait vooral om een paar keuzes die je maakt voordat je iets online zet. Wat kook je, hoe vaak, voor hoeveel mensen, en hoe komt het eten bij de koper?",
      ],
      sections: [
        {
          title: "Stap 1: bepaal wat je aanbiedt",
          paragraphs: [
            "Begin met één gerecht dat je vaak maakt en goed kunt herhalen. Bedenk hoeveel porties je per keer aankunt en op welke dagen.",
            "Reken uit wat het je kost aan ingrediënten, verpakking en tijd, en kies een prijs waar je zelf achter staat.",
          ],
        },
        {
          title: "Stap 2: lees de regels",
          paragraphs: [
            "Ook als je maar af en toe verkoopt, werk je veilig en hygiënisch en vertel je kopers welke allergenen erin zitten. Verkoop je meerdere keren per jaar eten of drinken, dan wordt NVWA-registratie relevant.",
            "Houd daarnaast bij wat je verkoopt en wat het je kost. Afhankelijk van je situatie kan wat je verdient gevolgen hebben voor belasting of toeslagen.",
          ],
        },
        {
          title: "Stap 3: zet je eerste gerecht online",
          paragraphs: [
            "Maak een account aan, doorloop de verkopersstappen en plaats je gerecht met een duidelijke foto, een eerlijke omschrijving, de prijs en de manier van afhalen of bezorgen. Daarna staat het op het dorpsplein.",
            "Bestellingen en betalingen lopen waar mogelijk via het platform, zodat de koper weet wat hij betaalt en jij weet dat er betaald is.",
          ],
        },
        {
          title: "Stap 4: leer van je eerste bestellingen",
          paragraphs: [
            "Vraag je eerste kopers wat ze ervan vonden. Een betere foto of een duidelijkere omschrijving maakt vaak al verschil, en beoordelingen helpen nieuwe kopers om je te vertrouwen. Weet je wat goed gaat, dan kun je uitbreiden.",
          ],
        },
      ],
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
        "Starting as a home cook mostly comes down to a few decisions you make before anything goes online. What will you cook, how often, for how many people, and how does the food reach the buyer?",
      ],
      sections: [
        {
          title: "Step 1: decide what you'll offer",
          paragraphs: [
            "Start with one dish you make often and can repeat reliably. Work out how many portions you can manage at a time and on which days.",
            "Add up what it costs you in ingredients, packaging and time, and pick a price you're comfortable with.",
          ],
        },
        {
          title: "Step 2: read the rules",
          paragraphs: [
            "Even if you only sell now and then, you need to work safely and hygienically and tell buyers which allergens are in the food. If you sell food or drink several times a year, NVWA registration becomes relevant.",
            "Keep track of what you sell and what it costs you as well. Depending on your situation, what you earn can affect tax or benefits.",
          ],
        },
        {
          title: "Step 3: put your first dish online",
          paragraphs: [
            "Create an account, go through the seller steps and publish your dish with a clear photo, an honest description, the price and how pickup or delivery works. It then appears on the village square.",
            "Orders and payments run through the platform where possible, so the buyer knows what they're paying and you know the payment has gone through.",
          ],
        },
        {
          title: "Step 4: learn from your first orders",
          paragraphs: [
            "Ask your first buyers what they thought. A better photo or a clearer description often makes a real difference, and reviews help new buyers trust you. Once you know what works, you can expand.",
          ],
        },
      ],
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
        secondary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
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
        secondary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Met thuisgekookt eten bedoelen we op HomeCheff gerechten die een particulier of kleine maker zelf heeft bereid, meestal in een gewone keuken of een kleine werkruimte. Het tegenovergestelde is een grote centrale keuken waarvan je niet weet wie er kookt.",
      ],
      sections: [
        {
          title: "Wat het wel en niet zegt",
          paragraphs: [
            "Thuisgekookt zegt iets over wie er kookt en waar. Het zegt niets over hoe gezond of hoe lekker het is. Het betekent vooral dat je kunt zien wie het gerecht heeft gemaakt en hoe die het aanbiedt.",
            "Het is ook geen keurmerk. De maker blijft zelf verantwoordelijk voor de juiste productinformatie.",
          ],
        },
        {
          title: "Hoe je het herkent op HomeCheff",
          paragraphs: [
            "Bij elk gerecht staat wie het maakt, met een profiel en vaak beoordelingen van eerdere kopers. De maker vermeldt zelf of je kunt afhalen of laten bezorgen en welke allergenen erin zitten. Lees dat altijd voordat je bestelt.",
          ],
        },
        {
          title: "Wat geldt er voor wie het verkoopt?",
          paragraphs: [
            "Wie thuisgekookt eten verkoopt, moet veilig en hygiënisch werken en kopers informeren over allergenen, ook bij af en toe verkopen. Verkoop je meerdere keren per jaar eten of drinken, dan wordt NVWA-registratie relevant. Op de pagina over regels voor eten verkopen vanuit huis lees je meer.",
          ],
        },
      ],
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Veelgestelde vragen", href: "/faq" },
      },
    },
    en: {
      title: "What Is Home-Cooked Food? | HomeCheff",
      description:
        "What does home-cooked food mean on HomeCheff? How makers work, what freshness means, and how it differs from typical delivery chains.",
      h1: "What is home-cooked food?",
      intro: [
        "On HomeCheff, home-cooked food means dishes prepared by an individual or a small maker, usually in an ordinary kitchen or a small workspace. The opposite is a large central kitchen where you have no idea who is cooking.",
      ],
      sections: [
        {
          title: "What it does and doesn't tell you",
          paragraphs: [
            "Home-cooked tells you who cooks and where. It says nothing about how healthy or how tasty the food is. Mostly it means you can see who made the dish and how they offer it.",
            "It isn't a quality mark either. The maker remains responsible for accurate product information.",
          ],
        },
        {
          title: "How to recognise it on HomeCheff",
          paragraphs: [
            "Every dish shows who made it, with a profile and often reviews from earlier buyers. The maker states whether you can collect it or have it delivered, and which allergens it contains. Always read that before you order.",
          ],
        },
        {
          title: "What applies to people who sell it?",
          paragraphs: [
            "Anyone selling home-cooked food has to work safely and hygienically and tell buyers about allergens, even if they only sell now and then. If you sell food or drink several times a year, NVWA registration becomes relevant. The page on rules for selling food from home explains more.",
          ],
        },
      ],
      cta: {
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Eten verkopen vanuit huis: wat je op HomeCheff regelt, waar je zelf verantwoordelijk voor bent. Geen juridisch advies. NVWA-registratie wordt relevant bij meerdere keren per jaar.",
      h1: "Eten verkopen vanuit huis: regels en uitleg",
      intro: [
        "Verkoop je meerdere keren per jaar eten of drinken? Dan wordt NVWA-registratie relevant. Ook als je maar af en toe verkoopt, moet je veilig en hygiënisch werken en klanten informeren over allergenen. HomeCheff is een marketplace en geen juridisch adviseur.",
        "Op het platform vragen we makers om eerlijke productinformatie en duidelijke voorwaarden richting klanten.",
        "Door transparant te zijn over ingrediënten, allergenen en ophaal-/bezorgafspraken help je jezelf en je klanten.",
      ],
      howItWorks: {
        title: "Hoe HomeCheff werkt",
        paragraphs: [
          "De onboarding helpt je de stappen te zien die horen bij verkopen op HomeCheff.",
          "Daarnaast ben jij zelf verantwoordelijk om te voldoen aan regels die voor jou gelden.",
          "Bij twijfel: NVWA, KVK of een adviseur raadplegen. HomeCheff bepaalt niet of jij ondernemer bent.",
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
        "Orientation on selling food from home: what HomeCheff handles, what you remain responsible for. Not legal advice. NVWA registration becomes relevant if you sell several times a year.",
      h1: "Rules for selling food from home",
      intro: [
        "If you sell food or drink several times a year, NVWA registration becomes relevant. Even if you sell only occasionally, you must work safely and hygienically and inform customers about allergens. HomeCheff is a marketplace, not a legal adviser.",
        "We ask sellers for honest product information and clear customer-facing terms.",
        "Transparency on ingredients, allergens, and pickup/delivery helps everyone.",
      ],
      howItWorks: {
        title: "How HomeCheff works",
        paragraphs: [
          "Seller onboarding shows steps relevant to selling on HomeCheff.",
          "You remain responsible for rules that apply to you.",
          "When in doubt, check NVWA, KVK, or an adviser. HomeCheff does not decide whether you are an entrepreneur.",
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
        "Lokale producten zijn op HomeCheff alles wat mensen in jouw omgeving zelf maken, kweken of bereiden. Dat is eten, maar ook groente en fruit uit eigen tuin, jam, planten en handgemaakte spullen.",
        "Je koopt ze op één plek en rekent op dezelfde manier af, in plaats van langs verschillende markten en losse accounts te gaan.",
      ],
      sections: [
        {
          title: "Wat je kunt vinden",
          paragraphs: [
            "Wat er te koop is, hangt af van wie er in jouw regio actief is en van het seizoen. Denk aan seizoensgroente, zelfgemaakte jam, maaltijden, stekjes en planten of creaties van ontwerpers.",
          ],
        },
        {
          title: "Zoeken en volgen",
          paragraphs: [
            "Op het dorpsplein filter je op afstand, categorie of soort maker. Makers die je bevallen kun je volgen als fan, zodat je een melding krijgt als ze iets nieuws plaatsen.",
          ],
        },
        {
          title: "Kopen en ophalen",
          paragraphs: [
            "Bestellen werkt hetzelfde als bij andere producten op HomeCheff. Of je iets ophaalt of laat bezorgen, staat bij het product. Beoordelingen van andere kopers helpen je om betrouwbare makers te vinden.",
            "Je koopt bij iemand uit je eigen omgeving, en die maker heeft geen eigen website nodig om gevonden te worden.",
          ],
        },
      ],
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Inspiratie", href: "/?chip=inspiration" },
      },
    },
    en: {
      title: "Buy Local Products | HomeCheff",
      description:
        "Buy local products from makers near you—food, produce, design and more on HomeCheff. Browse the village square today.",
      h1: "Buy local products",
      intro: [
        "On HomeCheff, local products are anything people near you make, grow or prepare themselves. That includes food, but also fruit and vegetables from their garden, jam, plants and handmade goods.",
        "You buy them in one place and pay the same way each time, instead of going round different markets and separate accounts.",
      ],
      sections: [
        {
          title: "What you can find",
          paragraphs: [
            "What's for sale depends on who is active in your area and on the season. Think of seasonal vegetables, homemade jam, meals, cuttings and plants, or pieces by designers.",
          ],
        },
        {
          title: "Searching and following makers",
          paragraphs: [
            "On the village square you can filter by distance, category or type of maker. You can follow makers you like as a fan, so you get a notification when they post something new.",
          ],
        },
        {
          title: "Buying and collecting",
          paragraphs: [
            "Ordering works the same as for any other product on HomeCheff. Each listing says whether you collect or have it delivered. Reviews from other buyers help you find makers you can rely on.",
            "You're buying from someone in your own area, and that maker doesn't need their own website to be found.",
          ],
        },
      ],
      cta: {
        primary: { label: "Discover local offers", href: "/?chip=sale" },
        secondary: { label: "Inspiration", href: "/?chip=inspiration" },
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
        "Grote bezorgapps zijn handig als je snel iets wilt van een restaurant of keten. HomeCheff werkt anders: je koopt bij mensen uit de buurt die zelf koken of maken.",
        "Dat heeft voor- en nadelen, en het is goed om die te kennen voordat je bestelt.",
      ],
      sections: [
        {
          title: "Wat er anders is",
          paragraphs: [
            "In een bezorgapp kies je uit restaurants. Op HomeCheff kies je uit wat buurtbewoners en kleine makers aanbieden. Je ziet wie het maakt en kunt die persoon een bericht sturen.",
            "Het aanbod hangt af van wie er actief is. In de ene buurt is er meer te vinden dan in de andere.",
          ],
        },
        {
          title: "Wat je niet moet verwachten",
          paragraphs: [
            "HomeCheff belooft niet dat je eten binnen twintig minuten voor de deur staat. Vaak bestel je vooruit of haal je het zelf op, afhankelijk van wat de maker aanbiedt. Er is ook geen vast menu dat elke avond hetzelfde is.",
          ],
        },
        {
          title: "Wanneer HomeCheff een goede keuze is",
          paragraphs: [
            "Als je wilt weten wie je eten heeft gekookt, als je een maker uit de buurt wilt steunen of als je iets zoekt dat je niet op een restaurantmenu vindt. Wil je vanavond binnen een half uur eten, dan is een bezorgapp waarschijnlijk handiger.",
          ],
        },
        {
          title: "Zelf koken voor de buurt",
          paragraphs: [
            "Kook je zelf graag, dan kun je ook aanbieden op HomeCheff. Je bepaalt zelf wat je maakt, voor welke prijs en of je bezorgt.",
          ],
        },
      ],
      cta: {
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Start met verkopen", href: "/sell" },
      },
    },
    en: {
      title: "Alternative to Takeaway Platforms | HomeCheff",
      description:
        "Looking beyond big delivery apps? HomeCheff connects you with home cooks and local makers—closer, more personal food.",
      h1: "An alternative to big takeaway platforms",
      intro: [
        "Big delivery apps are convenient when you want something quickly from a restaurant or chain. HomeCheff works differently: you buy from people nearby who cook or make things themselves.",
        "That has upsides and downsides, and it helps to know them before you order.",
      ],
      sections: [
        {
          title: "What's different",
          paragraphs: [
            "In a delivery app you choose between restaurants. On HomeCheff you choose from what neighbours and small makers are offering. You can see who made it and send them a message.",
            "What's on offer depends on who is active. Some neighbourhoods have more than others.",
          ],
        },
        {
          title: "What not to expect",
          paragraphs: [
            "HomeCheff doesn't promise food at your door in twenty minutes. You often order ahead or collect it yourself, depending on what the maker offers. There's no fixed menu that stays the same every night either.",
          ],
        },
        {
          title: "When HomeCheff is a good fit",
          paragraphs: [
            "When you want to know who cooked your food, when you'd like to support a maker nearby, or when you're after something you won't find on a restaurant menu. If you need dinner within half an hour tonight, a delivery app is probably the easier choice.",
          ],
        },
        {
          title: "Cooking for your neighbourhood",
          paragraphs: [
            "If you enjoy cooking yourself, you can offer food on HomeCheff too. You decide what you make, what it costs and whether you deliver.",
          ],
        },
      ],
      cta: {
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Op HomeCheff bieden thuiskoks en makers in en rond Rotterdam hun gerechten aan. Wat er te krijgen is, hangt af van wie er op dat moment kookt.",
        "Op het dorpsplein zie je wat er nu bij jou in de buurt wordt aangeboden, wie het maakt en of je het ophaalt of laat bezorgen.",
        "Bestel je daar, dan koop je rechtstreeks bij iemand uit de regio.",
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Meer over maaltijden Rotterdam", href: "/maaltijden/rotterdam" },
      },
    },
    en: {
      title: "Meals in Rotterdam | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Rotterdam from local makers on HomeCheff. Discover home-cooked food near you—browse the village square today.",
      h1: "Meals in Rotterdam",
      intro: [
        "On HomeCheff, home cooks and makers in and around Rotterdam list the dishes they make. What is available depends on who is cooking at the time.",
        "The village square shows what is on offer near you right now, who made it, and whether you pick it up or have it delivered.",
        "When you order there, you buy directly from someone in the area.",
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Op HomeCheff bieden thuiskoks en makers in en rond Amsterdam hun gerechten aan. Wat er te krijgen is, hangt af van wie er op dat moment kookt.",
        "Op het dorpsplein zie je wat er nu bij jou in de buurt wordt aangeboden, wie het maakt en of je het ophaalt of laat bezorgen.",
        "Bestel je daar, dan koop je rechtstreeks bij iemand uit de regio.",
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Maaltijden Amsterdam", href: "/maaltijden/amsterdam" },
      },
    },
    en: {
      title: "Meals in Amsterdam | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Amsterdam on HomeCheff. Find home cooks and local food—fresh and nearby on the village square.",
      h1: "Meals in Amsterdam",
      intro: [
        "On HomeCheff, home cooks and makers in and around Amsterdam list the dishes they make. What is available depends on who is cooking at the time.",
        "The village square shows what is on offer near you right now, who made it, and whether you pick it up or have it delivered.",
        "When you order there, you buy directly from someone in the area.",
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Op HomeCheff bieden thuiskoks en makers in en rond Den Haag hun gerechten aan. Wat er te krijgen is, hangt af van wie er op dat moment kookt.",
        "Op het dorpsplein zie je wat er nu bij jou in de buurt wordt aangeboden, wie het maakt en of je het ophaalt of laat bezorgen.",
        "Bestel je daar, dan koop je rechtstreeks bij iemand uit de regio.",
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Maaltijden Den Haag", href: "/maaltijden/den-haag" },
      },
    },
    en: {
      title: "Meals in The Hague | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in The Hague from local makers on HomeCheff. Home-cooked dishes near you—check the village square.",
      h1: "Meals in The Hague",
      intro: [
        "On HomeCheff, home cooks and makers in and around The Hague list the dishes they make. What is available depends on who is cooking at the time.",
        "The village square shows what is on offer near you right now, who made it, and whether you pick it up or have it delivered.",
        "When you order there, you buy directly from someone in the area.",
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Op HomeCheff bieden thuiskoks en makers in en rond Utrecht hun gerechten aan. Wat er te krijgen is, hangt af van wie er op dat moment kookt.",
        "Op het dorpsplein zie je wat er nu bij jou in de buurt wordt aangeboden, wie het maakt en of je het ophaalt of laat bezorgen.",
        "Bestel je daar, dan koop je rechtstreeks bij iemand uit de regio.",
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Maaltijden Utrecht", href: "/maaltijden/utrecht" },
      },
    },
    en: {
      title: "Meals in Utrecht | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Utrecht on HomeCheff. Local home cooks and fresh listings—start on the village square.",
      h1: "Meals in Utrecht",
      intro: [
        "On HomeCheff, home cooks and makers in and around Utrecht list the dishes they make. What is available depends on who is cooking at the time.",
        "The village square shows what is on offer near you right now, who made it, and whether you pick it up or have it delivered.",
        "When you order there, you buy directly from someone in the area.",
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
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
        "Op HomeCheff bieden thuiskoks en makers in en rond Eindhoven hun gerechten aan. Wat er te krijgen is, hangt af van wie er op dat moment kookt.",
        "Op het dorpsplein zie je wat er nu bij jou in de buurt wordt aangeboden, wie het maakt en of je het ophaalt of laat bezorgen.",
        "Bestel je daar, dan koop je rechtstreeks bij iemand uit de regio.",
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
        primary: { label: "Ontdek lokaal aanbod", href: "/?chip=sale" },
        secondary: { label: "Maaltijden Eindhoven", href: "/maaltijden/eindhoven" },
      },
    },
    en: {
      title: "Meals in Eindhoven | Local Home Cooks and Fresh Dishes | HomeCheff",
      description:
        "Meals in Eindhoven on HomeCheff. Find home cooks in the region—the village square shows current listings.",
      h1: "Meals in Eindhoven",
      intro: [
        "On HomeCheff, home cooks and makers in and around Eindhoven list the dishes they make. What is available depends on who is cooking at the time.",
        "The village square shows what is on offer near you right now, who made it, and whether you pick it up or have it delivered.",
        "When you order there, you buy directly from someone in the area.",
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
        primary: { label: "Discover local offers", href: "/?chip=sale" },
        secondary: { label: "Eindhoven meals hub", href: "/maaltijden/eindhoven" },
      },
    },
  },
];
