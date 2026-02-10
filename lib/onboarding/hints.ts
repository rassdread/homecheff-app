/**
 * Hint configuratie voor alle pagina's en functies
 * Alle teksten in HomeCheff stijl: vriendelijk, Nederlands, informeel maar professioneel
 */

export interface HintConfig {
  id: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  targetSelector?: string; // Voor tour steps
  forceCenter?: boolean; // Forceer gecentreerde tooltip (fullscreen-achtig)
}

export interface PageHints {
  pageId: string;
  pageName: string;
  hints: Record<string, HintConfig>;
  tourSteps?: HintConfig[]; // Stappen voor volledige tour
}

/**
 * Alle hints per pagina
 */
export const PAGE_HINTS: Record<string, PageHints> = {
  home: {
    pageId: 'home',
    pageName: 'Homepage',
    hints: {
      search: {
        id: 'home-search',
        title: '🔍 Zoeken naar producten',
        description: 'Zoek op naam, ingredient of verkoper. Je kunt ook filteren op categorie, prijs en afstand. Probeer eens te zoeken op "pasta" of "vegetarisch"!',
      },
      filters: {
        id: 'home-filters',
        title: '🎯 Geavanceerde filters',
        description: 'Verfijn je zoekopdracht met filters voor categorie (Chef, Garden, Designer), bezorging, prijs en meer. Perfect om precies te vinden wat je zoekt!',
      },
      radius: {
        id: 'home-radius',
        title: '📍 Afstand filter',
        description: 'Pas de zoekradius aan om producten in je buurt te vinden. Hoe kleiner de radius, hoe lokaler de resultaten. Ideaal voor verse producten!',
      },
      favorites: {
        id: 'home-favorites',
        title: '❤️ Favorieten',
        description: 'Sla producten op die je later wilt bekijken. Klik op het hartje om iets aan je favorieten toe te voegen - handig om niet te vergeten!',
      },
      props: {
        id: 'home-props',
        title: '👏 Props geven',
        description: 'Geef props aan verkopers waarvan je genoten hebt! Props zijn een manier om waardering te tonen en help verkopers opvallen.',
      },
    },
    tourSteps: [
      {
        id: 'tour-home-welcome',
        title: '👋 Welkom bij HomeCheff!',
        description: 'Hier begint alles: kopen én op het dorpsplein te koop zetten. Vind lokaal moois om te bestellen, of breng jouw eigen creaties naar het plein. We leiden je kort langs de belangrijkste plekken.',
        placement: 'bottom',
      },
      {
        id: 'tour-home-search',
        title: '🔍 Zoeken',
        description: 'Begin hier met zoeken naar producten, gerechten of verkopers. Je kunt ook filteren op categorie, prijs en afstand om precies te vinden wat je zoekt.',
        placement: 'bottom',
        targetSelector: '[data-tour="search"]',
      },
      {
        id: 'tour-home-filters',
        title: '🎯 Filters gebruiken',
        description: 'Gebruik filters om je zoekopdracht te verfijnen. Kies een categorie, bezorgoptie of prijsrange - handig om snel te vinden wat je nodig hebt!',
        placement: 'bottom',
        targetSelector: '[data-tour="filters"]',
      },
      {
        id: 'tour-home-product-card',
        title: '📦 Producttegel',
        description: 'Elke tegel toont een product met afbeeldingen, titel, beschrijving en prijs. Klik op een tegel om meer details te zien.',
        placement: 'top',
        targetSelector: '[data-tour="product-card"]',
      },
      {
        id: 'tour-home-favorite-button',
        title: '❤️ Favorieten',
        description: 'Klik op het hartje om producten aan je favorieten toe te voegen. Zo kun je ze later makkelijk terugvinden!',
        placement: 'top',
        targetSelector: '[data-tour="favorite-button"]',
      },
      {
        id: 'tour-home-category-badge',
        title: '🏷️ Categorieën',
        description: 'Elk product heeft een categorie: Chef (gerechten), Garden (oogst) of Designer (mode). Filter hierop om precies te vinden wat je zoekt.',
        placement: 'top',
        targetSelector: '[data-tour="category-badge"]',
      },
      {
        id: 'tour-home-delivery-info',
        title: '🚚 Bezorging',
        description: 'Producten kunnen worden opgehaald, bezorgd, of beide. Kijk naar de badges om te zien welke opties beschikbaar zijn.',
        placement: 'top',
        targetSelector: '[data-tour="delivery-info"]',
      },
      {
        id: 'tour-home-location',
        title: '📍 Locatie',
        description: 'Zie waar het product vandaan komt en hoe ver het van jou verwijderd is. Handig om lokaal te kopen!',
        placement: 'top',
        targetSelector: '[data-tour="location-info"]',
      },
      {
        id: 'tour-home-seller-stats',
        title: '👤 Verkoper informatie',
        description: 'Bekijk de statistieken van de maker: fans, favorieten, reviews en rating. Klik op de verkoper om hun profiel te bezoeken.',
        placement: 'top',
        targetSelector: '[data-tour="seller-stats"]',
      },
    ],
  },

  messages: {
    pageId: 'messages',
    pageName: 'Berichten',
    hints: {
      conversations: {
        id: 'messages-conversations',
        title: '💬 Gesprekken',
        description: 'Alle je chats met verkopers en kopers staan hier. Klik op een gesprek om het te openen en berichten te versturen.',
      },
      notifications: {
        id: 'messages-notifications',
        title: '🔔 Notificaties',
        description: 'Blijf op de hoogte van nieuwe props, fans, bestellingen en berichten. Klik hier om al je updates te zien.',
      },
      startChat: {
        id: 'messages-start-chat',
        title: '✉️ Gesprek starten',
        description: 'Wil je een vraag stellen over een product? Klik op "Stuur bericht" op een productpagina om direct contact op te nemen met de verkoper.',
      },
      orderChat: {
        id: 'messages-order-chat',
        title: '📋 Bestelling chat',
        description: 'Voor vragen over een specifieke bestelling, gebruik de knop bij je bestelling. Je berichten worden automatisch gelabeld met het bestelnummer.',
      },
    },
    tourSteps: [
      {
        id: 'tour-messages-welcome',
        title: '💬 Je berichtencentrum',
        description: 'Hier beheer je al je gesprekken en notificaties. Blijf in contact met verkopers en kopers, en krijg updates over je activiteit.',
        placement: 'bottom',
      },
      {
        id: 'tour-messages-conversations',
        title: '📨 Gesprekken bekijken',
        description: 'Alle chats staan hier. Open een gesprek om berichten te versturen en ontvangen. Perfect voor vragen over producten of bestellingen!',
        placement: 'right',
        targetSelector: '[data-tour="conversations-list"]',
      },
      {
        id: 'tour-messages-notifications',
        title: '🔔 Notificaties tab',
        description: 'Klik hier om alle updates te zien: nieuwe props, fans, bestellingen en meer. Blijf op de hoogte van alles wat er gebeurt!',
        placement: 'bottom',
        targetSelector: '[data-tour="notifications-tab"]',
      },
    ],
  },

  orders: {
    pageId: 'orders',
    pageName: 'Bestellingen',
    hints: {
      orderStatus: {
        id: 'orders-status',
        title: '📦 Bestelstatus',
        description: 'Volg je bestelling door de verschillende statussen: Wachtend → Bevestigd → In behandeling → Verzonden → Bezorgd. Duidelijk overzicht van waar je bestelling zich bevindt!',
      },
      orderChat: {
        id: 'orders-order-chat',
        title: '💬 Chat met verkoper',
        description: 'Heb je een vraag over je bestelling? Klik hier om direct met de verkoper te chatten. Je berichten worden automatisch gelabeld met het bestelnummer.',
      },
      filterStatus: {
        id: 'orders-filter-status',
        title: '🔍 Filter op status',
        description: 'Filter je bestellingen op status om snel te vinden wat je zoekt. Handig om alle bezorgde of wachtende bestellingen in één keer te zien!',
      },
    },
    tourSteps: [
      {
        id: 'tour-orders-welcome',
        title: '📦 Je bestellingen',
        description: 'Hier zie je al je bestellingen: als koper en als verkoper. Volg de status, bekijk details en chat met de andere partij.',
        placement: 'bottom',
      },
      {
        id: 'tour-orders-filter',
        title: '🔍 Filteren',
        description: 'Filter je bestellingen op status. Perfect om snel alle bezorgde of wachtende bestellingen te vinden!',
        placement: 'bottom',
        targetSelector: '[data-tour="order-filter"]',
      },
      {
        id: 'tour-orders-card',
        title: '📋 Bestelinfo',
        description: 'Elke bestelling toont alle belangrijke info: producten, status, datum en bezorging. Klik voor meer details of om te chatten met de verkoper.',
        placement: 'top',
        targetSelector: '[data-tour="order-card"]',
      },
    ],
  },

  sell: {
    pageId: 'sell',
    pageName: 'Op het plein zetten',
    hints: {
      sellButton: {
        id: 'sell-sell-button',
        title: '💼 Begin op het plein',
        description: 'Klaar om je creaties te delen? Klik hier om je eerste product te plaatsen. Je kunt gerechten, groenten of handgemaakte items op het dorpsplein te koop zetten!',
      },
      productForm: {
        id: 'sell-product-form',
        title: '📝 Product toevoegen',
        description: 'Vul hier alle details in: titel, beschrijving, foto\'s, prijs en bezorging. Maak je product aantrekkelijk met goede foto\'s en een duidelijke beschrijving!',
      },
      pricing: {
        id: 'sell-pricing',
        title: '💰 Prijs bepalen',
        description: 'Bedenk een eerlijke prijs voor je product. Onthoud: er is een kleine platform fee (12%). Je kunt ook zien hoeveel je uiteindelijk ontvangt met de fee calculator.',
      },
    },
  },

  profile: {
    pageId: 'profile',
    pageName: 'Profiel',
    hints: {
      editProfile: {
        id: 'profile-edit',
        title: '✏️ Profiel bewerken',
        description: 'Maak je profiel compleet! Voeg foto\'s toe, schrijf een bio en vertel wie je bent. Een goed profiel trekt meer kopers en fans aan.',
      },
      stats: {
        id: 'profile-stats',
        title: '📊 Jouw statistieken',
        description: 'Zie hoeveel fans je hebt, hoeveel props je hebt gekregen en hoeveel views je profiel heeft. Een leuke manier om je groei te volgen!',
      },
      products: {
        id: 'profile-products',
        title: '🛍️ Jouw producten',
        description: 'Al je producten staan hier. Beheer ze, pas prijzen aan of voeg nieuwe toe. Organiseer je aanbod duidelijk zodat kopers gemakkelijk vinden wat ze zoeken.',
      },
      fans: {
        id: 'profile-fans',
        title: '❤️ Fans',
        description: 'Dit zijn mensen die je volgen en op de hoogte blijven van je nieuwe producten. Fans krijgen notificaties wanneer je iets nieuws plaatst!',
      },
    },
  },

  product: {
    pageId: 'product',
    pageName: 'Product Detail',
    hints: {
      favorite: {
        id: 'product-favorite',
        title: '❤️ Favoriet maken',
        description: 'Sla dit product op om later terug te komen. Handig als je nog niet zeker weet of je het wilt kopen of als je het cadeau wilt doen!',
      },
      props: {
        id: 'product-props',
        title: '👏 Props geven',
        description: 'Geef de verkoper props als je genoten hebt van een product! Props helpen verkopers opvallen en laten anderen zien dat dit een goede verkoper is.',
      },
      follow: {
        id: 'product-follow',
        title: '⭐ Fan worden',
        description: 'Word fan van deze verkoper! Je krijgt dan notificaties wanneer ze nieuwe producten plaatsen. Perfect om op de hoogte te blijven van je favoriete makers.',
      },
      chat: {
        id: 'product-chat',
        title: '💬 Bericht sturen',
        description: 'Heb je een vraag over dit product? Stuur de verkoper een bericht! Je kunt vragen stellen over ingredienten, bezorging of custom orders.',
      },
      buy: {
        id: 'product-buy',
        title: '🛒 In winkelwagen',
        description: 'Voeg dit product toe aan je winkelwagen. Je kunt meerdere producten verzamelen en dan in één keer afrekenen.',
      },
    },
  },

  cart: {
    pageId: 'cart',
    pageName: 'Winkelwagen',
    hints: {
      checkout: {
        id: 'cart-checkout',
        title: '💳 Checkout',
        description: 'Klaar om af te rekenen? Klik hier om naar de checkout te gaan waar je veilig kunt betalen met Stripe. Je kunt meerdere producten tegelijk kopen!',
      },
      remove: {
        id: 'cart-remove',
        title: '🗑️ Product verwijderen',
        description: 'Niet meer nodig? Klik hier om een product uit je winkelwagen te halen. Je kunt altijd weer toevoegen als je van gedachten verandert!',
      },
      quantity: {
        id: 'cart-quantity',
        title: '🔢 Aantal aanpassen',
        description: 'Pas het aantal aan dat je wilt kopen. Let op: sommige verkopers hebben minimaal aantal of speciale aanbiedingen bij grotere hoeveelheden.',
      },
    },
    tourSteps: [
      {
        id: 'tour-cart-welcome',
        title: '🛒 Je winkelwagen',
        description: 'Hier staan alle producten die je hebt toegevoegd. Je kunt de hoeveelheid aanpassen of producten verwijderen voordat je afrekent.',
        placement: 'bottom',
      },
      {
        id: 'tour-cart-items',
        title: '📦 Je producten',
        description: 'Bekijk alle details: prijs, verkoper en bezorging. Klik op een product om terug te gaan naar de productpagina voor meer informatie.',
        placement: 'top',
        targetSelector: '[data-tour="cart-items"]',
      },
      {
        id: 'tour-cart-checkout',
        title: '💳 Afrekenen',
        description: 'Klaar om te kopen? Klik hier om naar de checkout te gaan waar je veilig kunt betalen. Stripe zorgt voor een veilige betaling!',
        placement: 'top',
        targetSelector: '[data-tour="checkout-button"]',
      },
    ],
  },

  register: {
    pageId: 'register',
    pageName: 'Registratie',
    hints: {
      welcome: {
        id: 'register-welcome',
        title: '👋 Welkom bij HomeCheff!',
        description: 'Op HomeCheff kun je je creaties een podium geven! Als Chef deel je recepten en zet je gerechten op het plein te koop. Als Garden deel je wat je kweekt en breng je groenten en kruiden naar het dorpsplein. Als Designer toon je je handwerk en plaats je unieke items op het plein. Iedereen kan ook koper zijn en lokale parels ontdekken!',
        placement: 'bottom',
      },
      chef: {
        id: 'register-chef',
        title: '👨‍🍳 Chef - Recepten & Gerechten',
        description: 'Als Chef kun je je beste recepten delen en je gerechten op het dorpsplein te koop zetten. Maak een kookvideo, deel je verhaal en ontvang bestellingen van mensen in je buurt. Perfect voor thuiskoks die hun passie willen delen!',
        placement: 'right',
      },
      garden: {
        id: 'register-garden',
        title: '🌱 Garden - Kweken & Oogsten',
        description: 'Als Garden deel je wat je kweekt in je tuin, balkon of moestuin. Breng verse groenten, kruiden, bloemen of stekjes naar het dorpsplein. Perfect voor iedereen met groene vingers die lokaal en duurzaam wil bijdragen!',
        placement: 'right',
      },
      designer: {
        id: 'register-designer',
        title: '🎨 Designer - Handwerk & Creaties',
        description: 'Als Designer toon je je handgemaakte items en plaats je je creaties op het plein. Van sieraden tot meubels, van kleding tot kunst - alles is mogelijk! Perfect voor makers die hun vakmanschap willen delen!',
        placement: 'right',
      },
      buyer: {
        id: 'register-buyer',
        title: '🛍️ Koper - Ontdek Lokale Parels',
        description: 'Als koper ontdek je unieke producten van mensen in je buurt. Van vers gebakken brood tot handgemaakte cadeaus - vind precies wat je zoekt dichtbij huis!',
        placement: 'bottom',
      },
      email: {
        id: 'register-email',
        title: '📧 E-mailadres',
        description: 'Dit e-mailadres gebruik je om in te loggen en ontvang je bevestigingsmails en updates. Zorg dat het een actief e-mailadres is!',
        placement: 'right',
      },
      username: {
        id: 'register-username',
        title: '👤 Gebruikersnaam',
        description: 'Je gebruikersnaam is uniek en zichtbaar voor anderen. Kies iets wat bij je past! Je kunt deze later niet meer veranderen, dus kies wijs.',
        placement: 'right',
      },
      password: {
        id: 'register-password',
        title: '🔐 Wachtwoord',
        description: 'Kies een sterk wachtwoord met minimaal 8 karakters. Gebruik letters, cijfers en symbolen voor extra beveiliging. Dit wachtwoord beschermt je account!',
        placement: 'right',
      },
      location: {
        id: 'register-location',
        title: '📍 Locatie',
        description: 'Je locatie helpt andere gebruikers om producten in je buurt te vinden. Deze gegevens zijn privé en worden alleen gebruikt voor afstandsberekening.',
        placement: 'bottom',
      },
      bio: {
        id: 'register-bio',
        title: '📝 Bio',
        description: 'Vertel anderen wie je bent en wat je maakt! Een goede bio trekt meer kopers en fans aan. Laat je passie en persoonlijkheid zien!',
        placement: 'bottom',
      },
      business: {
        id: 'register-business',
        title: '🏢 Bedrijfsaccount',
        description: 'Registreer je als bedrijf als je een KVK-nummer hebt. Bedrijven kunnen abonnementen kiezen met lagere fees en krijgen meer zichtbaarheid op het platform.',
        placement: 'bottom',
      },
      privacy: {
        id: 'register-privacy',
        title: '🔒 Privacy & Voorwaarden',
        description: 'Lees onze privacyverklaring en algemene voorwaarden goed door. Deze regels beschermen jou en andere gebruikers op het platform.',
        placement: 'top',
      },
    },
    tourSteps: [
      {
        id: 'tour-register-welcome',
        title: '👋 Welkom bij HomeCheff!',
        description: 'Welkom! Op HomeCheff krijg je een podium voor je creaties. Als Chef deel je recepten en verkoop je gerechten. Als Garden deel je je oogst en verkoop je groenten. Als Designer toon je je handwerk en verkoop je je creaties. En iedereen kan koper zijn om lokale parels te ontdekken!',
        placement: 'bottom',
      },
    ],
  },

  inspiratie: {
    pageId: 'inspiratie',
    pageName: 'Inspiratie',
    hints: {
      welcome: {
        id: 'inspiratie-welcome',
        title: '💡 Inspiratie ontdekken & bewaren',
        description: 'Hier verzamel je ideeën: recepten, kweken en designs. Sla je favorieten op voor jezelf en bouw zo je eigen stijl en smaak op HomeCheff.',
      },
      categories: {
        id: 'inspiratie-categories',
        title: '🗂️ Recepten, Kweken en Designs',
        description: 'Wissel tussen de drie werelden. Subcategorieën helpen je gericht zoeken. Alles wat je mooi vindt, kun je bewaren en later delen.',
      },
      viewsAndProps: {
        id: 'inspiratie-views-props',
        title: '📊 Views en Props',
        description: 'Zie wat leeft in de community: bekekingen en props. Handig om populaire items te spotten en je favorietenlijst te vullen.',
      },
    },
    tourSteps: [
      {
        id: 'tour-inspiratie-welcome',
        title: '💡 Welkom bij Inspiratie',
        description: 'Hier verzamel je ideeën uit de community: gerechten, kweken en designs. Sla je favorieten op en maak jouw eigen selectie die bij je past.',
        placement: 'bottom',
      },
      {
        id: 'tour-inspiratie-categories',
        title: '🗂️ Recepten, Kweken en Designs',
        description: 'Kies een categorie en verfijn met subcategorieën. Zo vind je snel precies wat je zoekt en kun je het opslaan voor later.',
        placement: 'bottom',
        targetSelector: '[data-tour="filters"]',
      },
      {
        id: 'tour-inspiratie-stats',
        title: '📊 Populariteit',
        description: 'Check views en props om snel kwaliteit te vinden. Bewaar wat je aanspreekt en deel je profiel: jouw atelier, tuin of keuken met al je items.',
        placement: 'top',
        targetSelector: '[data-tour="inspiration-grid"]',
        forceCenter: true,
      },
    ],
  },
};

/**
 * Get hints voor een specifieke pagina
 */
export function getHintsForPage(pageId: string): PageHints | null {
  return PAGE_HINTS[pageId] || null;
}

/**
 * Get een specifieke hint
 */
export function getHint(pageId: string, hintId: string): HintConfig | null {
  const pageHints = getHintsForPage(pageId);
  if (!pageHints) return null;
  return pageHints.hints[hintId] || null;
}

/**
 * Get tour steps voor een pagina
 */
export function getTourStepsForPage(pageId: string): HintConfig[] {
  const pageHints = getHintsForPage(pageId);
  if (!pageHints || !pageHints.tourSteps) return [];
  return pageHints.tourSteps;
}

