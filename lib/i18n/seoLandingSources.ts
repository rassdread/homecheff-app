/**
 * Alle programmeerbare SEO-landingspagina’s (nl/en per key).
 * Wordt gemerged in `/api/i18n/[lang]` onder namespace-keys (bijv. cookingEarningPage.title).
 */

import { PHASE2_PROGRAMMATIC_SOURCES } from "@/lib/i18n/seoPhase2ClusterSources";

export type Bi = { nl: string; en: string };

/** Gedeelde FAQ voor alle programmeerbare SEO-landingspagina’s (Schema.org FAQPage). */
export const seoSharedFaq: Record<string, Bi> = {
  faqBlockTitle: {
    nl: "Veelgestelde vragen",
    en: "Frequently asked questions",
  },
  faq1Q: {
    nl: "Mag je eten verkopen vanuit huis?",
    en: "Are you allowed to sell food from home?",
  },
  faq1A: {
    nl: "Dat hangt af van je product, regio en wetgeving (o.a. hygiëne). HomeCheff is geen juridisch advies: check altijd officiële bronnen en gemeente-informatie voordat je start.",
    en: "It depends on your product, region and law (including hygiene). HomeCheff is not legal advice: always check official and municipal sources before you start.",
  },
  faq2Q: {
    nl: "Hoe begin je met thuis koken verkopen?",
    en: "How do you start selling home cooking?",
  },
  faq2A: {
    nl: "Begin met één duidelijk aanbod, vaste ophaalvensters en eerlijke foto’s. Zoek 5–10 testkopers in je buurt en verbeter communicatie voordat je uitbreidt.",
    en: "Start with one clear offer, fixed pickup windows and honest photos. Find 5–10 neighbourhood testers and improve communication before expanding.",
  },
  faq3Q: {
    nl: "Hoe vind je klanten lokaal?",
    en: "How do you find customers locally?",
  },
  faq3A: {
    nl: "Combineer buurtkanalen (apps, clubs) met zichtbaarheid waar mensen al zoeken. Op HomeCheff hoort daar ook de Growth-pagina bij voor structuur en ideeën.",
    en: "Combine neighbourhood channels (apps, clubs) with visibility where people already search. On HomeCheff, the Growth page adds structure and ideas.",
  },
  faq4Q: {
    nl: "Heb je een vergunning nodig?",
    en: "Do you need a permit?",
  },
  faq4A: {
    nl: "Soms wel, soms niet — afhankelijk van activiteit en gemeente. Vraag dit na bij je overheid; HomeCheff vervangt geen officiële informatie.",
    en: "Sometimes yes, sometimes not — depends on activity and municipality. Ask your authorities; HomeCheff does not replace official information.",
  },
  faq5Q: {
    nl: "Moet ik een webshop bouwen om te starten?",
    en: "Do I need a webshop to start?",
  },
  faq5A: {
    nl: "Niet per se. Een duidelijk marketplace-profiel met prijs, ophalen en allergenen kan sneller tot eerste verkopen leiden dan maanden site-bouwen zonder bezoekers.",
    en: "Not necessarily. A clear marketplace profile with price, pickup and allergens can reach first sales faster than months of site building without visitors.",
  },
  faq6Q: {
    nl: "Wat is het verschil met dropshipping?",
    en: "What is the difference from dropshipping?",
  },
  faq6A: {
    nl: "Bij dropshipping importeer je vaak anonieme massa-producten. Bij HomeCheff verkoop je iets dat jij maakt of oogst, lokaal en met direct contact — andere marge, andere relatie.",
    en: "With dropshipping you often import anonymous mass products. On HomeCheff you sell something you make or grow, locally with direct contact — different margin, different relationship.",
  },
};

const homeEarningPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Verdienen vanuit huis zonder dropshipping | HomeCheff",
    en: "Earn from home without dropshipping | HomeCheff",
  },
  metaDescription: {
    nl: "Alternatief voor dropshipping: lokaal unieke producten, thuisgekookt eten en tuinproducten verkopen met direct contact — via HomeCheff.",
    en: "A dropshipping alternative: sell unique local products, home-cooked food and garden goods with direct contact — on HomeCheff.",
  },
  title: {
    nl: "Verdienen vanuit huis zonder dropshipping (unieke producten, eten en lokaal verkopen)",
    en: "Make money from home without dropshipping (sell unique products, food and local goods)",
  },
  intro: {
    nl: "Steeds meer mensen proberen geld te verdienen via dropshipping, maar lopen tegen dezelfde problemen aan: massaproducten, veel concurrentie en lage marges. HomeCheff biedt een alternatief: lokaal, uniek en direct contact met klanten.",
    en: "More and more people try to make money with dropshipping, but face the same problems: mass products, high competition and low margins. HomeCheff offers a different approach: local, unique and direct customer connection.",
  },
  sectionNoDropshippingTitle: {
    nl: "Geld verdienen zonder dropshipping",
    en: "Make money without dropshipping",
  },
  sectionNoDropshippingText: {
    nl: "In plaats van anonieme massaproducten verkoop je iets unieks, lokaal en met echte waarde. Je bouwt op herhaling in de buurt: mensen weten wat je maakt en waarom jouw aanbod anders is dan een generiek item uit een catalogus.",
    en: "Instead of anonymous mass products, you sell something unique, local and valuable. You build repeat demand nearby: people understand what you make and why it beats a generic catalogue item.",
  },
  sectionCookingTitle: {
    nl: "Geld verdienen met koken",
    en: "Make money with cooking",
  },
  sectionCookingText: {
    nl: "Verkoop thuisgekookte maaltijden aan mensen in jouw buurt en bouw een vaste klantenkring op. Je voordeel is versheid en duidelijkheid: vaste ophaalmomenten, porties die kloppen, en geen race-to-the-bottom met identieke maaltijden van ver weg.",
    en: "Sell home-cooked meals nearby and build a loyal customer base. Your edge is freshness and clarity: pickup windows, honest portions, and no race-to-the-bottom against identical meals from far away.",
  },
  sectionGardenTitle: {
    nl: "Lokale en gezonde producten",
    en: "Local and healthy products",
  },
  sectionGardenText: {
    nl: "Steeds meer mensen zoeken alternatieven voor supermarktproducten met veel tussenstappen. Lokale producten bieden transparantie en vertrouwen: korte keten, seizoen, en een gezicht achter de oogst.",
    en: "More people want alternatives to supermarket chains with long steps in between. Local goods offer transparency and trust: shorter chains, seasonality, and a face behind the harvest.",
  },
  sectionDesignerTitle: {
    nl: "Unieke producten maken",
    en: "Create unique products",
  },
  sectionDesignerText: {
    nl: "Geen standaard dropshipping-producten, maar zelf ontworpen of aangepaste items. Denk aan maatwerk, kleine series en handwerk — dingen die je niet 1-op-1 uit een fulfilment-catalogus haalt.",
    en: "Not generic dropshipping items, but self-designed or customised work. Think bespoke pieces, small batches and craft — not something lifted straight from a fulfilment catalogue.",
  },
  sectionDeliveryTitle: {
    nl: "Bezorger worden",
    en: "Become a delivery partner",
  },
  sectionDeliveryText: {
    nl: "Verdien geld door lokale bestellingen te bezorgen en onderdeel te worden van de community. Flexibele ritten helpen makers én kopers met haalbare afspraken in dezelfde postcode.",
    en: "Earn money by delivering local orders and join the community. Flexible runs help makers and buyers with realistic handoffs in the same postcode.",
  },
  sectionCompareTitle: {
    nl: "Waarom HomeCheff anders is dan dropshipping",
    en: "Why HomeCheff is different from dropshipping",
  },
  sectionCompareText: {
    nl: "Dropshipping is vaak anoniem en gevoelig voor prijsconcurrentie. HomeCheff draait om persoonlijk, lokaal en uniek: direct contact en een aanbod dat jij zelf maakt of oogst.",
    en: "Dropshipping is often anonymous and price-sensitive. HomeCheff is personal, local and unique: direct contact and offers you cook or grow yourself.",
  },
  sectionHowCustomersTitle: {
    nl: "Hoe vind je klanten?",
    en: "How do you find customers?",
  },
  sectionHowCustomersText: {
    nl: "Het grootste probleem is niet beginnen, maar klanten vinden. HomeCheff helpt je zichtbaar te worden in je omgeving. Combineer platformzichtbaarheid met mond-tot-mondreclame in de buurt.",
    en: "The hardest part is not starting, but finding customers. HomeCheff helps you become visible nearby. Combine platform visibility with neighbourhood word of mouth.",
  },
  sectionStepsTitle: {
    nl: "Stappenplan",
    en: "Step-by-step plan",
  },
  step1: {
    nl: "Kies je route: koken, tuin (Garden) of creatief (Designer) — begin smal.",
    en: "Pick your route: cooking, garden (Garden) or creative (Designer) — start narrow.",
  },
  step2: {
    nl: "Maak je eerste concreet aanbod (prijs, portie of stuk, ophalen, foto die klopt).",
    en: "Create your first concrete offer (price, portion or unit, pickup, honest photos).",
  },
  step3: {
    nl: "Zet het op HomeCheff en maak je profiel begrijpelijk voor mensen die je nog niet kennen.",
    en: "List on HomeCheff and make your profile clear to strangers.",
  },
  step4: {
    nl: "Zoek eerste kopers lokaal (sportclub, buurtapp, vaste ophaaldag).",
    en: "Find first buyers locally (club, neighbourhood chat, fixed pickup day).",
  },
  step5: {
    nl: "Schaal pas op als levering en kwaliteit stabiel zijn.",
    en: "Scale only when fulfilment and quality are stable.",
  },
  sectionMistakesTitle: {
    nl: "Veelgemaakte fouten",
    en: "Common mistakes",
  },
  sectionMistakesText: {
    nl: "Alleen op prijs concurreren, te veel tegelijk verkopen, geen vaste ophaal-logistiek, en geen duidelijke unieke waarde. Houd het klein, helder en herhaalbaar.",
    en: "Competing only on price, offering too much at once, messy pickup logistics, no clear unique value. Keep it small, clear and repeatable.",
  },
  linkCooking: {
    nl: "Lees meer: geld verdienen met koken",
    en: "Read more: earn money with cooking",
  },
  linkCookingShort: {
    nl: "Gids: geld verdienen met koken",
    en: "Guide: earn money with cooking",
  },
  linkVerkopen: {
    nl: "Verkopen vanuit huis",
    en: "Selling from home",
  },
  linkPlatform: {
    nl: "Platform voor thuiskoks",
    en: "Platform for home cooks",
  },
  linkGrowth: {
    nl: "Growth: klanten en zichtbaarheid",
    en: "Growth: customers and visibility",
  },
  linkLocalProducts: {
    nl: "Lokale producten verkopen",
    en: "Sell local products",
  },
  linkUniqueProducts: {
    nl: "Unieke producten verkopen",
    en: "Sell unique products",
  },
  linkBezorger: {
    nl: "Bezorger worden",
    en: "Become a delivery partner",
  },
  linkAlternatief: {
    nl: "Alternatief voor dropshipping",
    en: "Alternative to dropshipping",
  },
  linkBijverdienenHub: {
    nl: "bijverdienen vanuit huis (routes en realiteit)",
    en: "side income from home (routes and reality)",
  },
  cta: {
    nl: "Start vandaag met verdienen via HomeCheff",
    en: "Start earning today with HomeCheff",
  },
  ctaSub: {
    nl: "Registreer, kies je rol en zet je eerste aanbod live — zonder dropshipping-stress.",
    en: "Sign up, pick your role and publish your first listing — without dropshipping stress.",
  },
  authorityDropshippingTitle: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  authorityDropshippingBody: {
    nl: "Omdat identieke producten en lage marges je op een hamsterwiel zetten: meer ads, minder merk, nul relatie met de koper. Lokaal maken op HomeCheff draait om herhaling in de buurt: mensen weten wie je bent en wat je levert.",
    en: "Because identical products and low margins put you on a hamster wheel: more ads, less brand, zero buyer relationship. Making locally on HomeCheff is about neighbourhood repeat: people know who you are and what you deliver.",
  },
  authorityLocal2026Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  authorityLocal2026Body: {
    nl: "Kopers vragen vaker naar herkomst en korte keten — niet als modegrap, maar omdat ze controle willen over wat ze eten en bij wie ze kopen. Platforms die ophalen en buurt-serieus nemen, passen daar beter bij dan anonieme schaal.",
    en: "Buyers ask more about origin and short chains — not as a fad, but because they want control over what they eat and from whom. Platforms that take pickup and neighbourhood seriously fit better than anonymous scale.",
  },
  authorityHomeCookedTitle: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  authorityHomeCookedBody: {
    nl: "Omdat het vaak persoonlijker is: seizoen, voorkeur, allergenen bespreekbaar, en geen anonieme schaal-keuken. Thuiskoks die leveren wat ze beloven, bouwen vaste ritten — dat is je echte concurrentievoordeel.",
    en: "Because it is often more personal: season, preference, allergens discussable, no anonymous scale kitchen. Cooks who deliver what they promise build steady runs — that is your real competitive edge.",
  },
  homeRp1a: {
    nl: "Wil je starten met koken voor anderen? Lees de ",
    en: "Want to start cooking for others? Read the ",
  },
  homeRp1b: {
    nl: " en zet daarna je eerste aanbod neer. ",
    en: " and then publish your first offer. ",
  },
  homeRp1c: {
    nl: " helpt je nadenken over zichtbaarheid in je buurt.",
    en: " helps you think about visibility nearby.",
  },
  homeRp2a: {
    nl: "Wil je breder dan alleen maaltijden? Bekijk ",
    en: "Want to go beyond meals? See ",
  },
  homeRp2b: {
    nl: " en lees ", en: " and read ",
  },
  homeRp2c: {
    nl: " voor het grotere plaatje rond lokaal verdienen.",
    en: " for the bigger picture of local earning.",
  },
  linkEtenVanuitHuis: {
    nl: "gids eten verkopen vanuit huis",
    en: "guide to selling food from home",
  },
  linkThuisgekooktCluster: {
    nl: "thuisgekookt eten verkopen (uitleg en structuur)",
    en: "selling home-cooked food (structure and explanation)",
  },
};

const cookingEarningPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Geld verdienen met koken vanuit huis | HomeCheff",
    en: "Earn money cooking from home | HomeCheff",
  },
  metaDescription: {
    nl: "Thuiskoken verkopen: ophalen, vaste klanten, lokaal — zonder webshop-stress. Praktische gids via HomeCheff.",
    en: "Sell home cooking: pickup, repeat customers, locally — without webshop stress. A practical HomeCheff guide.",
  },
  title: {
    nl: "Geld verdienen met koken vanuit huis (lokaal, concreet, zonder webshop-gedoe)",
    en: "Earn money cooking from home (local, concrete, without webshop hassle)",
  },
  intro: {
    nl: "Als je thuis kookt voor anderen, win je op smaak, versheid en vertrouwen — niet op wie de laagste prijs heeft voor een anonieme schaal. Het echte werk zit in duidelijke afspraken: wat lever je, wanneer, waar haal je op, en hoe blijft het veilig en voorspelbaar voor klanten.",
    en: "When you cook for others, you win on taste, freshness and trust — not on who has the lowest price for anonymous scale. The real work is clear agreements: what you deliver, when, where pickup happens, and how it stays safe and predictable.",
  },
  sec1Title: {
    nl: "Hoe werkt het in de praktijk?",
    en: "How it works in practice",
  },
  sec1Body: {
    nl: "Je maakt een beperkt aanbod met vaste momenten. Je communiceert porties, allergenen en ophaalvenster eerlijk. Je eerste klanten komen bijna altijd uit je buurt — daarom is zichtbaarheid dichterbij belangrijker dan een perfecte landingspagina ver weg.",
    en: "You offer a limited menu with fixed moments. You communicate portions, allergens and pickup honestly. First buyers almost always come from nearby — so local visibility matters more than a perfect landing page far away.",
  },
  sec2Title: {
    nl: "Wat kun je verkopen?",
    en: "What can you sell?",
  },
  sec2Body: {
    nl: "Maaltijden in schalen, meal-prep voor drukke gezinnen, kleine catering voor buurtborrels, soms sauzen of gebak als je dat aankunt qua planning. Begin met één lijn die je week overzichtelijk houdt — uitbreiden kan altijd als de rit er is.",
    en: "Tray meals, meal prep for busy families, small neighbourhood catering, sometimes sauces or baked goods if your planning allows. Start with one line that keeps your week manageable — expand when the rhythm is there.",
  },
  sec3Title: {
    nl: "Logistiek: ophalen en herhaling",
    en: "Logistics: pickup and repeat orders",
  },
  sec3Body: {
    nl: "Lokaal werkt het best met vaste ophaalpunten of duidelijke tijdvensters. Mensen bestellen opnieuw als het elke week hetzelfde voelt: zelfde kwaliteit, zelfde communicatie. Dat is sterker dan eenmalige viraliteit.",
    en: "Local works best with fixed pickup points or clear time windows. People reorder when it feels consistent week to week: same quality, same communication. That beats one-off virality.",
  },
  sec4Title: {
    nl: "Waarom dit anders is dan generieke e-commerce",
    en: "Why this differs from generic e-commerce",
  },
  sec4Body: {
    nl: "Een webshop-tool lost niet op dat niemand je vindt. Je hebt vooral buurt-vraag en vertrouwen nodig. HomeCheff helpt je in die context: makers, categorieën en een flow die past bij ophalen in plaats van wereldwijde verzendstress.",
    en: "A shop tool does not solve discovery. You mainly need neighbourhood demand and trust. HomeCheff fits that context: makers, categories and flows built around pickup instead of global shipping stress.",
  },
  linkPlatform: {
    nl: "Platform voor thuiskoks",
    en: "Platform for home cooks",
  },
  linkVerkopen: {
    nl: "Verkopen vanuit huis",
    en: "Selling from home",
  },
  linkGrowth: {
    nl: "Growth: meer klanten vinden",
    en: "Growth: find more customers",
  },
  linkVerdienenZonder: {
    nl: "Verdienen zonder dropshipping",
    en: "Earn without dropshipping",
  },
  linkLocalProducts: {
    nl: "Lokale producten verkopen",
    en: "Sell local products",
  },
  stepsTitle: {
    nl: "Stappenplan",
    en: "Step-by-step plan",
  },
  step1: {
    nl: "Kies één hoofdlijn (bijv. twee gerechten per week).",
    en: "Pick one main line (e.g. two dishes per week).",
  },
  step2: {
    nl: "Reken voor: ingrediënten, tijd, verpakking, ophaalvenster.",
    en: "Plan ingredients, time, packaging and pickup window.",
  },
  step3: {
    nl: "Zet je aanbod op HomeCheff met duidelijke foto’s en prijs.",
    en: "List on HomeCheff with clear photos and price.",
  },
  step4: {
    nl: "Vraag eerste kopers om feedback en herhaal wat werkt.",
    en: "Ask first buyers for feedback and repeat what works.",
  },
  step5: {
    nl: "Breid pas uit als je ritme stabiel is.",
    en: "Expand only when your rhythm is stable.",
  },
  mistakesTitle: {
    nl: "Veelgemaakte fouten",
    en: "Common mistakes",
  },
  mistakesBody: {
    nl: "Te groot menu, vage prijs, geen vaste ophaal-logistiek, en te weinig communicatie over allergenen. Houd het strak en voorspelbaar.",
    en: "Too large a menu, vague pricing, messy pickup logistics, weak allergen communication. Keep it tight and predictable.",
  },
  authorityDropshippingTitle: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  authorityDropshippingBody: {
    nl: "Dropshipping dwingt je naar identieke SKU’s en lage marge. Koken voor de buurt is het tegenovergestelde: je product is elke week iets anders, maar wél herkenbaar door jouw stijl en afspraken.",
    en: "Dropshipping pushes you to identical SKUs and low margin. Cooking for the neighbourhood is the opposite: the product changes weekly but stays recognisable through your style and agreements.",
  },
  authorityLocal2026Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  authorityLocal2026Body: {
    nl: "Mensen willen kortere ketens en duidelijkheid: wie kookt dit, hoe haal ik op. Dat past bij vaste ophaal en buurt-reviews — niet bij anonieme schaal-import.",
    en: "People want shorter chains and clarity: who cooked this, how do I pick up. That fits fixed pickup and neighbourhood reviews — not anonymous scale imports.",
  },
  authorityHomeCookedTitle: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  authorityHomeCookedBody: {
    nl: "Omdat het vaak voelt als “echt eten van iemand”, met ruimte voor voorkeur en allergenen. Als je dat professioneel aanpakt (zonder theater), bouw je sneller vaste klanten.",
    en: "Because it often feels like real food from someone, with room for preference and allergens. If you handle that professionally (without theatre), you build regulars faster.",
  },
  cookRp1a: {
    nl: "Zet je eerste stappen naast deze gids ook in ",
    en: "Take your first steps beyond this guide in ",
  },
  cookRp1b: {
    nl: " en gebruik ", en: " and use ",
  },
  cookRp1c: {
    nl: " om lokaal zichtbaar te worden.",
    en: " to become visible locally.",
  },
  cookRp2a: {
    nl: "Wil je weten hoe ", en: "Want to know how ",
  },
  cookRp2b: {
    nl: " past bij een platform? Lees ", en: " fits a platform? Read ",
  },
  cookRp2c: {
    nl: ".",
    en: ".",
  },
  linkEtenVanuitHuisCook: {
    nl: "eten verkopen vanuit huis (volledige route)",
    en: "selling food from home (full route)",
  },
  linkThuisgekooktCook: {
    nl: "thuisgekookt eten verkopen (structuur en tips)",
    en: "selling home-cooked food (structure and tips)",
  },
  linkThuisgekookt: {
    nl: "thuisgekookt eten verkopen",
    en: "sell home-cooked food",
  },
  cta: {
    nl: "Begin met koken voor je buurt via HomeCheff",
    en: "Start cooking for your neighbourhood on HomeCheff",
  },
  ctaSub: {
    nl: "Maak een account, kies je chef-rol en zet je eerste maaltijd live.",
    en: "Create an account, pick your chef role and publish your first meal.",
  },
};

const localProductsPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Lokale producten verkopen (tuin, vers, transparant) | HomeCheff",
    en: "Sell local products (garden, fresh, transparent) | HomeCheff",
  },
  metaDescription: {
    nl: "Groente, fruit, kruiden en planten lokaal verkopen: transparantie, versheid en vertrouwen — zonder supermarkt-keten.",
    en: "Sell vegetables, fruit, herbs and plants locally: transparency, freshness and trust — without supermarket chains.",
  },
  title: {
    nl: "Lokale producten verkopen vanuit je tuin of kas (vers, kleinschalig, dichtbij)",
    en: "Sell local products from your garden or greenhouse (fresh, small-scale, nearby)",
  },
  intro: {
    nl: "Mensen zoeken kortere ketens: minder stappen tussen oogst en bord, meer zicht op herkomst. Dat betekent niet dat je medische claims moet maken — wél dat je eerlijk vertelt wat je doet, hoe je teelt, en waarom jouw product in de buurt logischer is dan een doos die weken onderweg is.",
    en: "People want shorter chains: fewer steps between harvest and plate, clearer origin. That does not mean medical claims — it means honest storytelling about how you grow and why nearby makes sense compared to boxes travelling for weeks.",
  },
  sec1Title: {
    nl: "Wat kun je lokaal verkopen?",
    en: "What can you sell locally?",
  },
  sec1Body: {
    nl: "Groente en fruit in seizoen, kruiden, planten en stekjes, soms jams of andere verwerkte producten als je regels en planning aankunt. Begin met wat je betrouwbaar kunt leveren — kwaliteit boven volume.",
    en: "Seasonal veg and fruit, herbs, plants and cuttings, sometimes preserves if rules and planning allow. Start with what you can deliver reliably — quality over volume.",
  },
  sec2Title: {
    nl: "Supermarkt vs lokaal (zonder overdrijven)",
    en: "Supermarket vs local (without exaggeration)",
  },
  sec2Body: {
    nl: "Supermarkten zijn handig, maar abstract: keten, schaal, weinig persoon. Lokaal wint op verhaal en nabijheid: mensen weten bij wie ze kopen. Positioneer jezelf op transparantie en versheid — geen schreeuwende claims.",
    en: "Supermarkets are convenient but abstract: chain, scale, little personality. Local wins on story and proximity: people know who they buy from. Position on transparency and freshness — no shouting claims.",
  },
  sec3Title: {
    nl: "Hoe HomeCheff past bij tuin- en buurtverkoop",
    en: "How HomeCheff fits garden and neighbourhood sales",
  },
  sec3Body: {
    nl: "Je hebt een profiel, een aanbod en een plek waar buurtbewoners je kunnen vinden zonder eerst een eigen webshop te bouwen. Combineer dat met vaste ophaaldagen — dan wordt herhalen makkelijker.",
    en: "You get a profile, listings and a place neighbours can find you without building a webshop first. Combine that with fixed pickup days — that makes repeat orders easier.",
  },
  linkGrowth: {
    nl: "Growth: zichtbaarheid in je buurt",
    en: "Growth: visibility nearby",
  },
  linkVerdienenZonder: {
    nl: "Verdienen zonder dropshipping",
    en: "Earn without dropshipping",
  },
  linkCooking: {
    nl: "Geld verdienen met koken",
    en: "Earn money with cooking",
  },
  linkUniqueProducts: {
    nl: "Unieke producten verkopen",
    en: "Sell unique products",
  },
  linkLokaalEten: {
    nl: "lokaal eten verkopen (radius en ritme)",
    en: "sell local food (radius and rhythm)",
  },
  linkEtenVanuitHuisGarden: {
    nl: "eten verkopen vanuit huis (logistiek)",
    en: "selling food from home (logistics)",
  },
  stepsTitle: {
    nl: "Stappenplan",
    en: "Step-by-step plan",
  },
  step1: {
    nl: "Kies 1–3 producten die je stabiel kunt leveren.",
    en: "Pick 1–3 products you can supply steadily.",
  },
  step2: {
    nl: "Fotografeer eerlijk (licht, gewicht, versheid).",
    en: "Photograph honestly (light, weight, freshness).",
  },
  step3: {
    nl: "Zet prijs en ophaalvenster duidelijk op HomeCheff.",
    en: "Set clear price and pickup window on HomeCheff.",
  },
  step4: {
    nl: "Vraag vaste klanten om wekelijkse rit.",
    en: "Ask regulars for a weekly rhythm.",
  },
  step5: {
    nl: "Breid uit met seizoensproducten.",
    en: "Expand with seasonal items.",
  },
  mistakesTitle: {
    nl: "Veelgemaakte fouten",
    en: "Common mistakes",
  },
  mistakesBody: {
    nl: "Te veel beloven, geen vaste ophaal-logistiek, prijs te laag voor je tijd. Houd het realistisch.",
    en: "Overpromising, messy pickup, prices too low for your time. Stay realistic.",
  },
  authorityDropshippingTitle: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  authorityDropshippingBody: {
    nl: "Tuinverkoop heeft niets met import-catalogi te maken — maar hetzelfde valkuil-principe geldt: als je anoniem en prijs-only bent, win je niet. Lokaal tuinproduct is juist verhaal + ophalen.",
    en: "Garden sales are not import catalogues — but the same pitfall applies: if you are anonymous and price-only, you lose. Local garden goods are story plus pickup.",
  },
  authorityLocal2026Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  authorityLocal2026Body: {
    nl: "Mensen zoeken transparantie bij voedsel en planten: wie teelt dit, hoe vers is het. Dat is geen medische claim — wél een verwachting aan uitleg.",
    en: "People look for transparency in food and plants: who grows this, how fresh. That is not a medical claim — it is an expectation of explanation.",
  },
  authorityHomeCookedTitle: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  authorityHomeCookedBody: {
    nl: "Ook als jij tuin verkoopt, eten mensen elke dag. Thuiskoks en tuinmakers versterken elkaar in dezelfde buurt-apps: denk in combinaties (maaltijd + groente) zonder je te verspreiden.",
    en: "Even if you sell garden, people eat daily. Cooks and growers reinforce each other in the same neighbourhood apps: think combos without spreading yourself thin.",
  },
  gardenRp1a: { nl: "Combineer tuin met ", en: "Combine garden with " },
  gardenRp1b: { nl: " en lees ", en: " and read " },
  gardenRp1c: {
    nl: " voor bredere lokaal-strategie.",
    en: " for broader local strategy.",
  },
  cta: {
    nl: "Verkoop je tuinproducten lokaal via HomeCheff",
    en: "Sell your garden goods locally on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer, kies Garden en publiceer je eerste oogst of planten.",
    en: "Sign up, pick Garden and publish your first harvest or plants.",
  },
};

const uniqueProductsPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Unieke producten verkopen (handgemaakt, lokaal) | HomeCheff",
    en: "Sell unique products (handmade, local) | HomeCheff",
  },
  metaDescription: {
    nl: "Handgemaakt en maatwerk verkopen zonder massaproduct-dropshipping: lokaal, persoonlijk, direct.",
    en: "Sell handmade and bespoke work without mass dropshipping: local, personal, direct.",
  },
  title: {
    nl: "Unieke en creatieve producten verkopen (geen catalogus, wel jouw signatuur)",
    en: "Sell unique creative products (not a catalogue — your signature)",
  },
  intro: {
    nl: "Uniek betekent hier: jij ontwerpt, bewerkt of personaliseert — geen ‘gevonden product’ dat duizend shops tegelijk verkopen. Dat is precies het verschil met dropshipping: je concurrent is niet alleen prijs, maar vooral of mensen jouw stijl herkennen en willen.",
    en: "Unique here means you design, customise or personalise — not a found product sold by a thousand shops. That is the dropshipping difference: competition is not only price, but whether people recognise and want your style.",
  },
  sec1Title: {
    nl: "Wat telt als “uniek”?",
    en: "What counts as unique?",
  },
  sec1Body: {
    nl: "Maatwerk, kleine series, handbedrukte items, aangepaste cadeaus, restauratie-achtige bewerkingen — alles waar je uitleg bij kunt geven die klopt met wat de klant krijgt.",
    en: "Bespoke work, small batches, hand-printed items, tailored gifts, restoration-style edits — anything you can explain that matches what buyers receive.",
  },
  sec2Title: {
    nl: "Waarom dit niet hetzelfde is als Shopify + dropshipping",
    en: "Why this is not the same as Shopify plus dropshipping",
  },
  sec2Body: {
    nl: "Shopify helpt met een winkelmandje; het lost niet op dat je klanten moet vinden. HomeCheff richt zich op lokaal ophalen en community: minder shipping-complexiteit, meer directe afspraken met echte buren.",
    en: "Shopify helps with checkout; it does not solve discovery. HomeCheff focuses on local pickup and community: less shipping complexity, more direct agreements with real neighbours.",
  },
  sec3Title: {
    nl: "Zichtbaarheid zonder “influencer-stress”",
    en: "Visibility without influencer stress",
  },
  sec3Body: {
    nl: "Je hoeft geen content-machine te zijn. Wél: duidelijke foto’s, prijs, levertijd/ophaal en een profiel dat vertrouwen geeft. Combineer platform met één vaste buurtplek waar mensen je kennen.",
    en: "You do not need a content machine. You do need clear photos, price, pickup timing and a trustworthy profile. Combine the platform with one neighbourhood anchor where people know you.",
  },
  linkAlternatief: {
    nl: "Alternatief voor dropshipping",
    en: "Alternative to dropshipping",
  },
  linkVerdienenZonder: {
    nl: "Verdienen zonder dropshipping",
    en: "Earn without dropshipping",
  },
  linkGrowth: {
    nl: "Growth: klanten vinden",
    en: "Growth: find customers",
  },
  linkEtenVanuitHuisDesigner: {
    nl: "eten verkopen vanuit huis (zonder webshop-first)",
    en: "selling food from home (without webshop-first)",
  },
  linkZelfgemaakt: {
    nl: "zelfgemaakt eten verkopen",
    en: "sell homemade food",
  },
  stepsTitle: {
    nl: "Stappenplan",
    en: "Step-by-step plan",
  },
  step1: {
    nl: "Kies één productlijn (bijv. keramiek of prints).",
    en: "Pick one product line (e.g. ceramics or prints).",
  },
  step2: {
    nl: "Maak 3 voorbeelden en 1 duidelijke basisprijs.",
    en: "Make three examples and one clear base price.",
  },
  step3: {
    nl: "Zet het op HomeCheff met echte foto’s.",
    en: "List on HomeCheff with real photos.",
  },
  step4: {
    nl: "Bied ophalen of vaste afhaaldag aan.",
    en: "Offer pickup or a fixed pickup day.",
  },
  step5: {
    nl: "Voeg maatwerkopties toe als je ritme hebt.",
    en: "Add bespoke options once you have rhythm.",
  },
  mistakesTitle: {
    nl: "Veelgemaakte fouten",
    en: "Common mistakes",
  },
  mistakesBody: {
    nl: "Te veel variaties tegelijk, geen levertijd, geen duidelijke grenzen bij maatwerk. Houd het begrensd.",
    en: "Too many variants at once, unclear lead times, fuzzy bespoke boundaries. Keep it bounded.",
  },
  authorityDropshippingTitle: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  authorityDropshippingBody: {
    nl: "Uniek maatwerk is het antoniem van dropshipping: geen SKU die 10.000 shops delen. Als jij grenzen stelt en levert wat je belooft, bouw je marge via vertrouwen.",
    en: "Unique bespoke work is the opposite of dropshipping: no SKU shared by ten thousand shops. If you set boundaries and deliver what you promise, you build margin through trust.",
  },
  authorityLocal2026Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  authorityLocal2026Body: {
    nl: "Lokaal creatief werk schaalt via referrals: mensen laten fysiek zien wat je maakte. Dat werkt beter met ophalen dan met wereldwijde verzendstress.",
    en: "Local creative work scales through referrals: people show what you made physically. That works better with pickup than global shipping stress.",
  },
  authorityHomeCookedTitle: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  authorityHomeCookedBody: {
    nl: "Niet elke designer verkoopt eten — maar dezelfde buurt kan beide nodig hebben. Positioneer jezelf helder: wat doe jij wél, en waar verwijs je door voor maaltijden?",
    en: "Not every designer sells food — but the same neighbourhood may need both. Position clearly: what you do and where you refer for meals?",
  },
  designerRp1a: { nl: "Vergelijk met ", en: "Compare with " },
  designerRp1b: {
    nl: " en lees ", en: " and read ",
  },
  designerRp1c: {
    nl: " voor het bredere alternatief op anonieme e-commerce.",
    en: " for the broader alternative to anonymous e-commerce.",
  },
  cta: {
    nl: "Verkoop je unieke creaties via HomeCheff",
    en: "Sell your unique creations on HomeCheff",
  },
  ctaSub: {
    nl: "Kies Designer, bouw je portfolio en publiceer je eerste item.",
    en: "Pick Designer, build your portfolio and publish your first item.",
  },
};

const deliveryPartnerPage: Record<string, Bi> = {
  metaTitle: {
    nl: "Bezorger worden bij HomeCheff | Flexibel bijverdienen",
    en: "Become a HomeCheff delivery partner | Flexible side income",
  },
  metaDescription: {
    nl: "Lokaal bezorgen, flexibele ritten, community — praktische uitleg zonder juridische beloftes.",
    en: "Local delivery, flexible runs, community — practical overview without legal promises.",
  },
  title: {
    nl: "Bezorger worden: flexibel bijverdienen met lokale ritten",
    en: "Become a delivery partner: flexible side income with local runs",
  },
  intro: {
    nl: "Bezorgers maken het verschil voor makers die geen auto of tijd hebben, en voor kopers die wél willen maar niet kunnen ophalen. Het is geen “passief inkomen”, wél een concrete bijdrage in de buurt met duidelijke ritten en afspraken.",
    en: "Delivery partners matter for makers without a car or time, and for buyers who want food but cannot pick up. It is not passive income, but a concrete neighbourhood contribution with clear runs and agreements.",
  },
  sec1Title: {
    nl: "Wat doe je als bezorger?",
    en: "What do you do as a delivery partner?",
  },
  sec1Body: {
    nl: "Je haalt een bestelling op bij de maker en levert af bij de koper of op een afgesproken punt. Je bent het verlengstuk van lokaal vertrouwen: op tijd, netjes communiceren, en voorzichtig met eten en temperaturen waar dat nodig is.",
    en: "You pick up an order from the maker and drop it to the buyer or an agreed handoff. You extend local trust: on time, clear communication, careful with food and temperature where needed.",
  },
  sec2Title: {
    nl: "Flexibel werken (studenten, bijbaan, avonden)",
    en: "Flexible work (students, side job, evenings)",
  },
  sec2Body: {
    nl: "Veel bezorgers combineren met studie of werk: vaste blokken op bepaalde dagen werken vaak beter dan “altijd beschikbaar”. Begin klein zodat je betrouwbaar blijft — betrouwbaarheid is je reputatie.",
    en: "Many partners combine with study or work: fixed blocks on certain days often beat always on call. Start small so you stay reliable — reliability is your reputation.",
  },
  sec3Title: {
    nl: "Community en lokale economie",
    en: "Community and the local economy",
  },
  sec3Body: {
    nl: "Door lokaal te rijden houd je geld en relaties in de buurt. Dat voelt klein, maar schaalt in netwerk: mensen adviseren elkaar wanneer het goed gaat.",
    en: "Local runs keep money and relationships nearby. It feels small but scales through networks when it works well.",
  },
  linkVerdienenZonder: {
    nl: "Verdienen zonder dropshipping",
    en: "Earn without dropshipping",
  },
  linkHome: {
    nl: "Terug naar de homepage",
    en: "Back to homepage",
  },
  linkGrowth: {
    nl: "Growth",
    en: "Growth",
  },
  linkEtenVanuitHuisDeliv: {
    nl: "eten verkopen vanuit huis (waar bezorging helpt)",
    en: "selling food from home (where delivery helps)",
  },
  stepsTitle: {
    nl: "Stappenplan",
    en: "Step-by-step plan",
  },
  step1: {
    nl: "Check of bezorgen bij jou past (tijd, vervoer).",
    en: "Check delivery fits you (time, transport).",
  },
  step2: {
    nl: "Maak je profiel aan en kies bezorg-rol waar beschikbaar.",
    en: "Create your profile and pick delivery role where available.",
  },
  step3: {
    nl: "Start met korte ritten dichtbij huis.",
    en: "Start with short runs close to home.",
  },
  step4: {
    nl: "Communiceer duidelijk bij vertraging of drukte.",
    en: "Communicate clearly if delayed or busy.",
  },
  step5: {
    nl: "Breid uit als je betrouwbaarheid hebt opgebouwd.",
    en: "Expand once you have built reliability.",
  },
  mistakesTitle: {
    nl: "Veelgemaakte fouten",
    en: "Common mistakes",
  },
  mistakesBody: {
    nl: "Te veel ritten accepteren zonder buffer, onduidelijke afspraken, geen backup bij ziekte. Zeg nee als het niet past.",
    en: "Taking too many runs without buffer, unclear handoffs, no backup when ill. Say no when it does not fit.",
  },
  authorityDropshippingTitle: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  authorityDropshippingBody: {
    nl: "Bezorging is fysiek werk — geen “set and forget” webshop. Dat is juist gezond: je ziet direct of een rit klopt en of communicatie eerlijk is.",
    en: "Delivery is physical work — not a set-and-forget webshop. That is healthy: you see immediately if a run works and if communication is honest.",
  },
  authorityLocal2026Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  authorityLocal2026Body: {
    nl: "Lokale ritten houden euro’s in de buurt en verlagen faal-afstand: als iets misgaat, los je het sneller op dan bij anonieme schaal.",
    en: "Local runs keep money nearby and reduce failure distance: if something goes wrong, you fix it faster than at anonymous scale.",
  },
  authorityHomeCookedTitle: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  authorityHomeCookedBody: {
    nl: "Bezorgers maken thuisgekookt haalbaar voor mensen zonder auto of tijd. Daarmee zit je midden in het verhaal “lokaal eten zonder gedoe”.",
    en: "Delivery partners make home-cooked feasible for people without a car or time. That puts you in the story of local food without hassle.",
  },
  delivRp1a: { nl: "Lees ", en: "Read " },
  delivRp1b: {
    nl: " en bekijk ", en: " and see ",
  },
  delivRp1c: {
    nl: " voor makers die jij helpt met ritten.",
    en: " for makers you help with runs.",
  },
  cta: {
    nl: "Meld je aan als bezorger op HomeCheff",
    en: "Sign up as a delivery partner on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer en volg de onboarding voor bezorgers in jouw regio.",
    en: "Register and follow delivery onboarding for your area.",
  },
};

const dropshippingAlternativePage: Record<string, Bi> = {
  metaTitle: {
    nl: "Alternatief voor dropshipping (lokaal, uniek) | HomeCheff",
    en: "Alternative to dropshipping (local, unique) | HomeCheff",
  },
  metaDescription: {
    nl: "Waarom dropshipping verzadigd raakt en hoe lokaal verkopen met HomeCheff wél klantrelatie en marge kan geven — zonder webshop-complexiteit.",
    en: "Why dropshipping saturates and how local selling on HomeCheff can bring margin and real relationships — without webshop complexity.",
  },
  title: {
    nl: "Alternatief voor dropshipping: lokaal verkopen met echte producten en contact",
    en: "Alternative to dropshipping: sell locally with real products and contact",
  },
  intro: {
    nl: "Dropshipping belooft snel schaal; in de praktijk betekent het vaak lage marges, leveringsstress en nul band met je klant. Een lokaal alternatief is simpel uit te leggen: je verkoopt iets dat je zelf maakt of oogst, mensen kennen je buurt, en je concurrentie is niet de hele wereld tegelijk.",
    en: "Dropshipping promises fast scale; in practice it often means low margins, shipping stress and zero bond with buyers. A local alternative is simple: you sell what you make or grow, people know your area, and your competition is not the entire world at once.",
  },
  sec1Title: {
    nl: "Waarom dropshipping verzadigt",
    en: "Why dropshipping saturates",
  },
  sec1Body: {
    nl: "Iedereen kan dezelfde SKU importeren. Prijs wordt het wapen, en marges zakken. Je merk voelt anoniem omdat het product overal hetzelfde is.",
    en: "Anyone can import the same SKU. Price becomes the weapon and margins fall. The brand feels anonymous because the product is the same everywhere.",
  },
  sec2Title: {
    nl: "Wat mensen wél willen (en betalen)",
    en: "What people actually want (and pay for)",
  },
  sec2Body: {
    nl: "Versheid, herkomst, persoonlijke service en duidelijke afspraken. Dat is tastbaar — en dat past bij buurtverkoop en ophalen in plaats van anonieme warehouses.",
    en: "Freshness, origin, personal service and clear agreements. That is tangible — it fits neighbourhood pickup instead of anonymous warehouses.",
  },
  sec3Title: {
    nl: "HomeCheff als lokaal alternatief",
    en: "HomeCheff as a local alternative",
  },
  sec3Body: {
    nl: "Je zet een profiel en aanbod neer waar buurtbewoners op zoeken. Je praat rechtstreeks met kopers, plant ophalen en bouwt reputatie door herhaling — niet door advertentie-bidding op hetzelfde gadget.",
    en: "You publish a profile and listings where neighbours look. You talk directly to buyers, plan pickup and build reputation through repeat orders — not by bidding ads on the same gadget.",
  },
  sec4Title: {
    nl: "Community-gedreven in plaats van anonieme schaal",
    en: "Community-driven instead of anonymous scale",
  },
  sec4Body: {
    nl: "Lokaal betekent: mensen zien je weer, geven tips door, en bestellen opnieuw als het goed voelt. Dat is een ander groeimodel dan one-shot dropship-conversies.",
    en: "Local means people see you again, refer friends, and reorder when it feels right. That is a different growth model than one-shot dropship conversions.",
  },
  linkVerdienenZonderLang: {
    nl: "Uitgebreide gids: verdienen zonder dropshipping",
    en: "Full guide: earn without dropshipping",
  },
  linkCooking: {
    nl: "Geld verdienen met koken",
    en: "Earn money with cooking",
  },
  linkLocalProducts: {
    nl: "Lokale producten verkopen",
    en: "Sell local products",
  },
  linkGrowth: {
    nl: "Growth: klanten en zichtbaarheid",
    en: "Growth: customers and visibility",
  },
  stepsTitle: {
    nl: "Stappenplan",
    en: "Step-by-step plan",
  },
  step1: {
    nl: "Kies één productcategorie die je zelf maakt of oogst.",
    en: "Pick one category you make or grow yourself.",
  },
  step2: {
    nl: "Maak een helder aanbod met prijs en ophalen.",
    en: "Create a clear offer with price and pickup.",
  },
  step3: {
    nl: "Publiceer op HomeCheff en vraag eerste buurt-testkopers.",
    en: "Publish on HomeCheff and ask first neighbourhood testers.",
  },
  step4: {
    nl: "Verzamel reviews en verbeter je ritme.",
    en: "Collect feedback and improve your rhythm.",
  },
  step5: {
    nl: "Breid uit met tweede productlijn als het stabiel is.",
    en: "Add a second line only when stable.",
  },
  mistakesTitle: {
    nl: "Veelgemaakte fouten",
    en: "Common mistakes",
  },
  mistakesBody: {
    nl: "Nog steeds anonieme import proberen te combineren met “lokaal” label — dat breekt vertrouwen. Kies één eerlijk verhaal.",
    en: "Trying to combine anonymous imports with a local label — that breaks trust. Pick one honest story.",
  },
  authorityDropshippingTitle: {
    nl: "Waarom mensen stoppen met dropshipping",
    en: "Why people quit dropshipping",
  },
  authorityDropshippingBody: {
    nl: "Omdat schaal zonder merk en zonder service uitput. Lokaal alternatief betekent: tastbaar product, echte afspraken, herhaalbare buurt.",
    en: "Because scale without brand and service exhausts you. A local alternative means tangible product, real agreements, repeatable neighbourhood.",
  },
  authorityLocal2026Title: {
    nl: "Waarom lokaal verkopen groeit in 2026",
    en: "Why local selling keeps growing in 2026",
  },
  authorityLocal2026Body: {
    nl: "Kopers zoeken makers en korte ketens — niet alleen lagere prijs. Platforms die ophalen en profielen serieus nemen, passen bij die shift.",
    en: "Buyers look for makers and short chains — not only lower price. Platforms that take pickup and profiles seriously fit that shift.",
  },
  authorityHomeCookedTitle: {
    nl: "Waarom mensen kiezen voor thuisgekookt eten",
    en: "Why people choose home-cooked food",
  },
  authorityHomeCookedBody: {
    nl: "Omdat het dichtbij en bespreekbaar is. Thuiskoks zijn vaak de eerste “lokale makers” die mensen proberen — daarna volgen tuin en creatief.",
    en: "Because it is nearby and discussable. Home cooks are often the first local makers people try — then garden and creative follow.",
  },
  dsAltRp1a: { nl: "Lees ook ", en: "Also read " },
  dsAltRp1b: {
    nl: " en ", en: " and ",
  },
  dsAltRp1c: {
    nl: " als je het topic “eten vanuit huis” wilt domineren.",
    en: " if you want to own the “food from home” topic.",
  },
  linkEtenVanuitHuisDs: {
    nl: "eten verkopen vanuit huis (topic cluster)",
    en: "selling food from home (topic cluster)",
  },
  linkThuisgekooktDs: {
    nl: "thuisgekookt eten verkopen (kernpagina)",
    en: "selling home-cooked food (core page)",
  },
  linkBijverdienenDs: {
    nl: "bijverdienen vanuit huis (realistische inkomsten)",
    en: "side income from home (realistic earnings)",
  },
  cta: {
    nl: "Kies lokaal in plaats van dropshipping — start op HomeCheff",
    en: "Choose local over dropshipping — start on HomeCheff",
  },
  ctaSub: {
    nl: "Registreer en zet vandaag nog je eerste echte aanbod live.",
    en: "Register and publish your first real listing today.",
  },
};

export const PROGRAMMATIC_PAGE_SOURCES: Record<string, Record<string, Bi>> = {
  seoSharedFaq,
  homeEarningPage,
  cookingEarningPage,
  localProductsPage,
  uniqueProductsPage,
  deliveryPartnerPage,
  dropshippingAlternativePage,
  ...PHASE2_PROGRAMMATIC_SOURCES,
};

/** Gegroepeerde programmeerbare links op /seo-hub en /en/seo-hub. */
export const SEO_HUB_PROGRAMMATIC_SECTIONS = [
  {
    sectionTitle: {
      nl: "Geld verdienen vanuit huis",
      en: "Earning from home",
    },
    links: [
      {
        href: "/verdienen-zonder-dropshipping",
        label: {
          nl: "Verdienen vanuit huis zonder dropshipping",
          en: "Earn from home without dropshipping",
        },
      },
      {
        href: "/bijverdienen-vanuit-huis",
        label: {
          nl: "Bijverdienen vanuit huis",
          en: "Side income from home",
        },
      },
      {
        href: "/alternatief-voor-dropshipping",
        label: {
          nl: "Alternatief voor dropshipping",
          en: "Alternative to dropshipping",
        },
      },
      {
        href: "/growth",
        label: {
          nl: "Growth — klanten en zichtbaarheid",
          en: "Growth — customers and visibility",
        },
      },
    ],
  },
  {
    sectionTitle: {
      nl: "Eten verkopen",
      en: "Selling food",
    },
    links: [
      {
        href: "/eten-verkopen-vanuit-huis",
        label: {
          nl: "Eten verkopen vanuit huis",
          en: "Sell food from home",
        },
      },
      {
        href: "/thuisgekookt-eten-verkopen",
        label: {
          nl: "Thuisgekookt eten verkopen",
          en: "Sell home-cooked food",
        },
      },
      {
        href: "/zelfgemaakt-eten-verkopen",
        label: {
          nl: "Zelfgemaakt eten verkopen",
          en: "Sell homemade food",
        },
      },
      {
        href: "/lokaal-eten-verkopen",
        label: {
          nl: "Lokaal eten verkopen",
          en: "Sell local food",
        },
      },
      {
        href: "/geld-verdienen-met-koken",
        label: {
          nl: "Geld verdienen met koken",
          en: "Earn money with cooking",
        },
      },
      {
        href: "/eten-verkopen-rotterdam",
        label: {
          nl: "Eten verkopen in Rotterdam (voorbeeld stad)",
          en: "Sell food in Rotterdam (example city)",
        },
      },
    ],
  },
  {
    sectionTitle: {
      nl: "Producten & platform",
      en: "Products & platform",
    },
    links: [
      {
        href: "/lokale-producten-verkopen",
        label: {
          nl: "Lokale producten verkopen",
          en: "Sell local products",
        },
      },
      {
        href: "/unieke-producten-verkopen",
        label: {
          nl: "Unieke producten verkopen",
          en: "Sell unique products",
        },
      },
      {
        href: "/platform-voor-thuiskoks",
        label: {
          nl: "Platform voor thuiskoks",
          en: "Platform for home cooks",
        },
      },
      {
        href: "/verkopen-vanuit-huis",
        label: {
          nl: "Verkopen vanuit huis",
          en: "Selling from home",
        },
      },
    ],
  },
  {
    sectionTitle: {
      nl: "Bezorger & eerdere gidsen",
      en: "Delivery partner & more guides",
    },
    links: [
      {
        href: "/bezorger-worden",
        label: {
          nl: "Bezorger worden",
          en: "Become a delivery partner",
        },
      },
      {
        href: "/verdienen-zonder-dropshipping",
        label: {
          nl: "Verdienen zonder dropshipping (lang)",
          en: "Earn without dropshipping (long guide)",
        },
      },
    ],
  },
] as const;
