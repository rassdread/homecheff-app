'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, CreditCard, Shield, Truck, User, FileText, AlertTriangle } from 'lucide-react';

const faqCategories = [
  {
    id: 'general',
    title: 'Algemeen',
    icon: HelpCircle,
    color: 'blue'
  },
  {
    id: 'sustainability',
    title: 'Duurzaamheid & Verspilling',
    icon: HelpCircle,
    color: 'green'
  },
  {
    id: 'handmade',
    title: 'Handgemaakt',
    icon: AlertTriangle,
    color: 'amber'
  },
  {
    id: 'selling',
    title: 'Verkopen',
    icon: User,
    color: 'green'
  },
  {
    id: 'buying',
    title: 'Kopen',
    icon: CreditCard,
    color: 'purple'
  },
  {
    id: 'payments',
    title: 'Betalingen',
    icon: CreditCard,
    color: 'emerald'
  },
  {
    id: 'delivery',
    title: 'Levering',
    icon: Truck,
    color: 'orange'
  },
  {
    id: 'taxes',
    title: 'Belastingen',
    icon: FileText,
    color: 'red'
  },
  {
    id: 'safety',
    title: 'Veiligheid',
    icon: Shield,
    color: 'indigo'
  }
];

const faqData = {
  general: [
    {
      question: "Wat is HomeCheff?",
      answer: "HomeCheff is een lokaal platform waar particulieren hun handgemaakte producten kunnen verkopen. We richten ons op thuisgemaakte gerechten, verse producten uit eigen tuin en handgemaakte creaties. Het platform verbindt lokale makers met consumenten in hun buurt.\n\n🎯 Onze missie: Het tegengaan van voedselverspilling door het delen van overtollige maaltijden en producten. Als je voor jezelf kookt en er teveel van hebt, kun je dat delen met anderen in je buurt. Dit draagt bij aan een duurzamere en socialere gemeenschap.\n\n💰 PRAKTISCHE VOORDELEN:\n• Extra inkomen voor je hobby bekostigen\n• Uitgaven aftrekken van je omzet\n• Jaarlijks een leuke vakantie (max €2000)\n• Maandelijkse aanvulling op uitkering mogelijk\n• Verbouwing of extraatjes bekostigen"
    },
    {
      question: "Hoe werkt HomeCheff?",
      answer: "Voor particuliere verkopers is het platform volledig gratis! Je betaalt alleen transactiekosten zodat de app kan blijven bestaan. Bedrijven met een KVK nummer kunnen kiezen voor een abonnement. Kopers kunnen zoeken, filteren en lokale producten kopen.\n\n🤝 GEMEENSCHAP:\n• Lokale makers en kopers verbinden\n• Verspilling tegengaan door delen\n• Handgemaakte producten ondersteunen\n• Bewuste consumptie stimuleren"
    },
    {
      question: "Is HomeCheff gratis te gebruiken?",
      answer: "Ja! Voor particuliere verkopers is HomeCheff volledig gratis. Je betaalt geen maandelijkse kosten, alleen transactiekosten op elke verkoop. Voor bedrijven met een KVK nummer zijn er abonnementen beschikbaar."
    },
    {
      question: "In welke steden is HomeCheff beschikbaar?",
      answer: "HomeCheff is momenteel beschikbaar in heel Nederland. We richten ons op lokale communities en breiden geleidelijk uit naar meer regio's."
    },
    {
      question: "Hoe kan ik contact opnemen met HomeCheff?",
      answer: "Je kunt ons bereiken via support@homecheff.eu, onze helpdesk in de app, of via de contactpagina. We reageren meestal binnen 24 uur."
    },
    {
      question: "Kan ik bijverdienen naast mijn uitkering?",
      answer: "Ja, je kunt bijverdienen naast je uitkering, maar er zijn wel regels:\n\n💰 UITKERINGEN EN BIJVERDIENEN:\n• Wajong: 70% van je inkomsten wordt verrekend met je uitkering\n• Bijstand: Je mag een deel van je inkomsten houden\n• Alle inkomsten moeten binnen 1 week worden gemeld aan het UWV\n\n💡 PRAKTISCHE TIPS:\n• Houd je uitgaven bij voor aftrek van je omzet\n• Overleg met het UWV over je specifieke situatie\n• Gebruik je hobby om extra inkomen te genereren\n• Maak gebruik van de vrijstellingen die er zijn\n\n⚠️ BELANGRIJK: Neem altijd contact op met het UWV voordat je begint met verkopen! HomeCheff is alleen een platform en biedt geen belasting- of uitkeringsadvies."
    },
    {
      question: "Wat is de aansprakelijkheid van HomeCheff?",
      answer: "⚠️ BELANGRIJKE JURIDISCHE INFORMATIE:\n\nHomeCheff is alleen een platform dat verkopers en kopers met elkaar verbindt. Wij zijn NIET verantwoordelijk voor:\n• De kwaliteit van producten\n• Geschillen tussen verkopers en kopers\n• Schade door producten\n• Verlies of diefstal tijdens levering\n• Belastingaangifte van gebruikers\n• Uitkeringsregelingen\n\nAlle transacties zijn tussen verkoper en koper. HomeCheff bemiddelt alleen bij geschillen maar is niet aansprakelijk voor de uitkomst.\n\nDoor gebruik te maken van HomeCheff ga je akkoord met deze voorwaarden."
    }
  ],
  selling: [
    {
      question: "Hoe word ik verkoper op HomeCheff?",
      answer: "Registreer je account, kies een verkopersrol (Chef, Garden, Designer) en vul je bankgegevens in. Voor particulieren is er geen abonnement nodig - je kunt direct beginnen met verkopen! Kleine bedrijven kunnen optioneel een abonnement kiezen voor voordelige tarieven.\n\n🤝 LOKALE GEMEENSCHAP:\n• Focus op het tegengaan van verspilling\n• Hergebruik materialen en ingrediënten\n• Deel je handgemaakte verhaal\n• Inspireer anderen tot bewust consumeren"
    },
    {
      question: "Welke abonnementen zijn er voor verkopers?",
      answer: "Voor particulieren: Volledig gratis! Je betaalt alleen transactiekosten.\n\nVoor kleine bedrijven zijn er optionele abonnementen beschikbaar met verschillende tarieven. Je kunt altijd upgraden of downgraden naar een ander abonnement.\n\n🤝 LOKALE GEMEENSCHAP:\n• Geen extra kosten voor handgemaakte producten\n• Ondersteuning voor lokale makers\n• Beloning voor verspilling tegengaan\n\nVoor specifieke prijzen en tarieven kun je inloggen op je account en naar de abonnementssectie gaan."
    },
    {
      question: "Wat mag ik verkopen op HomeCheff?",
      answer: "Alleen handgemaakte producten van eigen makelij die verspilling tegengaan:\n\n🍳 CHEF (Lokaal koken):\n• Thuisgemaakte gerechten van lokale ingrediënten\n• Overtollige maaltijden om verspilling tegen te gaan\n• Seizoensgebonden gerechten\n• Hergebruik van restjes en ingrediënten\n\n🌱 GARDEN (Lokaal tuinieren):\n• Zelf gekweekte groenten, fruit, kruiden\n• Overtollige oogst delen\n• Zaden en stekjes van eigen planten\n• Lokale biodiversiteit ondersteunen\n\n🎨 DESIGNER (Handgemaakt creëren):\n• Upcycled en gerecyclede items\n• Handgemaakte kunst van restmaterialen\n• Herstelde en opgeknapte spullen\n• Lokale materialen gebruiken\n\n🤝 Geen handel of doorverkoop van fabrieksproducten. Alle producten moeten bijdragen aan de lokale gemeenschap."
    },
    {
      question: "Hoe krijg ik mijn geld uitbetaald?",
      answer: "Uitbetalingen gebeuren automatisch via Stripe Connect naar je opgegeven bankrekening. Voor nieuwe accounts is de uitbetalingstermijn 7 dagen na de betaling. Naarmate je account ouder wordt en een positieve geschiedenis opbouwt, kunnen uitbetalingen sneller worden (2-3 werkdagen).\n\n💰 PRAKTISCHE VOORDELEN:\n• Snellere uitbetaling voor handgemaakte producten\n• Extra beloning voor verspilling tegengaan\n• Transparante kosten voor lokale makers\n• Uitgaven aftrekken van je omzet\n\nJe ontvangt een email wanneer de uitbetaling is verwerkt.\n\n⚠️ BELANGRIJK: HomeCheff is alleen een platform. Wij zijn niet verantwoordelijk voor de kwaliteit van producten of geschillen tussen verkopers en kopers."
    },
    {
      question: "Hoe kan ik effectief verkopen op HomeCheff?",
      answer: "Focus op handgemaakte kwaliteit en verspilling tegengaan:\n\n♻️ TEGEN VERSPILLING:\n• Hergebruik materialen en ingrediënten\n• Repareer en upcycle oude spullen\n• Deel overtollige producten\n• Vermeld hoe je verspilling tegengaat\n\n🌿 LOKALE PRAKTIJKEN:\n• Gebruik lokale en seizoensgebonden ingrediënten\n• Minimaliseer verpakkingsmateriaal\n• Kies voor lokale materialen\n• Inspireer anderen tot bewust leven\n\n🤝 GEMEENSCHAP:\n• Deel je handgemaakte verhaal\n• Leer anderen hoe ze kunnen upcyclen\n• Bouw een bewuste verkoopcultuur op"
    },
    {
      question: "Kan ik mijn producten bewerken of verwijderen?",
      answer: "Ja, je kunt je producten altijd bewerken, voorraad aanpassen, prijzen wijzigen of producten tijdelijk deactiveren. Verwijderen kan ook, maar dit beïnvloedt je statistieken.\n\n🤝 LOKALE GEMEENSCHAP:\n• Update handgemaakte productinformatie\n• Voeg nieuwe lokale aspecten toe\n• Pas verpakkingsinformatie aan\n• Deel updates over je verspilling tegengaan initiatieven"
    },
    {
      question: "Hoe kan ik toekomstige producten aanbieden?",
      answer: "HomeCheff's reserveringssysteem helpt je verspilling tegen te gaan door vooruit te plannen:\n\n📅 TOEKOMSTIGE BESCHIKBAARHEID:\n• Bied producten maximaal 1 week vooruit aan\n• Perfect voor wanneer je weet dat je teveel gaat maken\n• Laat kopers vooraf reserveren\n• Voorkom verspilling door planning\n\n🎯 VOORBEELDEN:\n• BBQ weekend: 'Extra hamburgers - reserveer vooraf'\n• Feestje: 'Taart te groot voor ons gezin'\n• Kookdag: 'Extra porties pasta - 3 dagen vooruit'\n\n♻️ VOORDELEN:\n• Je weet precies hoeveel te maken\n• Geen voedselverspilling meer\n• Kopers kunnen plannen\n• Betere verdiensten door planning\n\n💡 TIP: Als je weet dat je altijd teveel maakt, bied het vooraf aan!"
    }
  ],
  buying: [
    {
      question: "Hoe koop ik producten op HomeCheff?",
      answer: "Zoek naar handgemaakte producten, bekijk de productinformatie, voeg toe aan winkelwagen en ga naar checkout. Betaling gebeurt via Stripe (veilig en snel). Na betaling ontvang je bevestiging en contactgegevens van de verkoper.\n\n🤝 LOKALE GEMEENSCHAP:\n• Kies voor lokale en seizoensgebonden producten\n• Ondersteun handgemaakte creaties\n• Voorkom verspilling door lokaal kopen\n• Verbind met makers in je buurt"
    },
    {
      question: "Welke betaalmethoden worden geaccepteerd?",
      answer: "We accepteren alle belangrijke betaalmethoden via Stripe: iDEAL, creditcards, Bancontact, SEPA en meer. Alle betalingen zijn beveiligd en gecodeerd.\n\n🤝 LOKALE GEMEENSCHAP:\n• Elektronische betalingen ondersteunen lokale makers\n• Geen contant geld = veiliger voor community\n• Digitale bonnen zijn praktischer\n• Transparante kosten voor handgemaakte producten"
    },
    {
      question: "Kan ik producten reserveren?",
      answer: "Ja! HomeCheff biedt een uniek reserveringssysteem voor toekomstige producten. Dit is perfect voor bijvoorbeeld BBQ's, feestjes of speciale gelegenheden.\n\n📅 TOEKOMSTIGE BESCHIKBAARHEID:\n• Producten kunnen maximaal 1 week vooruit worden aangeboden\n• Reserveer vooraf om verspilling te voorkomen\n• Verkopers weten precies hoeveel ze moeten maken\n• Ideaal voor overtollige maaltijden\n\n♻️ TEGEN VERSPILLING:\n• Voorkomt verspilling door planning\n• Minder impulsaankopen\n• Betere voorraadbeheer voor verkopers\n• Minder voedselverspilling\n\n💡 VOORBEELD: Planning een BBQ weekend? Bied je overtollige porties vooraf aan en laat mensen reserveren!"
    },
    {
      question: "Wat als ik niet tevreden ben over mijn aankoop?",
      answer: "Neem eerst contact op met de verkoper. Als dat niet lukt, kunnen wij bemiddelen. We hebben een klachtenprocedure en kunnen in extreme gevallen een terugbetaling regelen.\n\n♻️ TEGEN VERSPILLING:\n• Hergebruik van producten waar mogelijk\n• Compostering van organische producten\n• Feedback voor verbetering\n• Leren van handgemaakte praktijken\n\n⚠️ BELANGRIJK: HomeCheff is alleen een platform. Wij zijn niet verantwoordelijk voor de kwaliteit van producten of geschillen tussen verkopers en kopers."
    },
    {
      question: "Kan ik verkopers volgen?",
      answer: "Ja! Word fan van je favoriete handgemaakte verkopers om op de hoogte te blijven van nieuwe producten. Je ontvangt notificaties wanneer ze nieuwe handgemaakte items toevoegen.\n\n🤝 LOKALE GEMEENSCHAP:\n• Ondersteun lokale makers\n• Leer van handgemaakte technieken\n• Deel tips en ervaringen\n• Bouw een bewuste community op"
    },
    {
      question: "Hoe werkt toekomstige beschikbaarheid en reserveringen?",
      answer: "HomeCheff's unieke reserveringssysteem helpt verspilling tegen te gaan door vooruit plannen:\n\n📅 TOEKOMSTIGE PRODUCTEN:\n• Maximaal 1 week vooruit aanbieden\n• Perfect voor BBQ's, feestjes, speciale gelegenheden\n• Verkopers weten precies hoeveel te maken\n• Kopers kunnen vooraf reserveren\n\n🎯 VOORBEELDEN:\n• 'BBQ weekend - reserveer je portie' (3 dagen vooruit)\n• 'Extra taart voor verjaardag' (1 week vooruit)\n• 'Overtollige pasta vanavond' (vandaag)\n\n♻️ VOORDELEN:\n• Voorkomt voedselverspilling\n• Betere planning voor verkopers\n• Kopers weten wat ze kunnen verwachten\n• Minder impulsaankopen\n\n💡 TIP: Als je weet dat je teveel gaat maken, bied het vooraf aan!"
    }
  ],
  payments: [
    {
      question: "Zijn betalingen veilig op HomeCheff?",
      answer: "Ja, alle betalingen worden verwerkt via Stripe, een van de meest veilige betaalproviders ter wereld. Je bankgegevens worden nooit opgeslagen op onze servers."
    },
    {
      question: "Wanneer wordt mijn geld afgeschreven?",
      answer: "Betalingen worden direct afgeschreven bij het afronden van je bestelling. Voor abonnementen wordt maandelijks automatisch geïncasseerd."
    },
    {
      question: "Kan ik een betaling annuleren?",
      answer: "Betalingen kunnen alleen worden geannuleerd voordat de transactie is voltooid. Na voltooiing moet je contact opnemen met de verkoper of onze klantenservice."
    },
    {
      question: "Wat zijn de transactiekosten?",
      answer: "Transactiekosten variëren per abonnementstype. Deze kosten worden automatisch afgetrokken van je verkoopopbrengst. Voor de exacte tarieven kun je inloggen op je account en naar de abonnementssectie gaan."
    },
    {
      question: "Kan ik mijn uitbetalingen volgen?",
      answer: "Ja, je kunt je uitbetalingen volgen in je verkopersdashboard. Daar zie je alle transacties, uitbetalingen en kosten overzichtelijk bij elkaar.\n\n⚠️ BELANGRIJK: HomeCheff is alleen een platform. Wij zijn niet verantwoordelijk voor de kwaliteit van producten of geschillen tussen verkopers en kopers."
    }
  ],
  delivery: [
    {
      question: "Hoe werkt levering op HomeCheff?",
      answer: "Verkopers kunnen kiezen voor afhalen, bezorgen, of beide. Bij bezorgen regelen verkoper en koper de details onderling. HomeCheff bemiddelt niet in de levering zelf.\n\n🤝 LOKALE GEMEENSCHAP:\n• Lokale bezorging ondersteunt de buurt\n• Fietsbezorging is praktischer\n• Afhalen voorkomt extra verpakking\n• Gecombineerde bezorging is efficiënter\n\n⚠️ BELANGRIJK: HomeCheff is alleen een platform. Wij zijn niet verantwoordelijk voor levering of geschillen tussen verkopers en kopers."
    },
    {
      question: "Wat zijn de leverkosten?",
      answer: "Leverkosten worden door de verkoper bepaald en zijn zichtbaar bij elk product. Sommige verkopers bieden gratis levering vanaf een bepaald bedrag."
    },
    {
      question: "Kan ik mijn bestelling laten bezorgen?",
      answer: "Dat hangt af van de verkoper. Sommige bieden alleen afhalen, anderen ook bezorgen. Check de productpagina voor leveropties en neem contact op met de verkoper."
    },
    {
      question: "Wat als mijn bestelling niet aankomt?",
      answer: "Neem direct contact op met de verkoper. Als dat niet lukt, kunnen wij bemiddelen. Houd je bewijs van betaling bij voor eventuele claims."
    },
    {
      question: "Kan ik een bestelling ophalen?",
      answer: "Ja, als de verkoper afhalen aanbiedt. Je ontvangt het adres en afhaaltijd na je bestelling. Zorg dat je je bewijs van betaling meeneemt."
    },
    {
      question: "Hoe word ik bezorger op HomeCheff?",
      answer: "Bezorgers kunnen zich aanmelden via /delivery/signup. Je moet tussen de 15-23 jaar oud zijn, een geldig identiteitsbewijs hebben en akkoord gaan met onze voorwaarden. Minderjarigen hebben ouderlijke toestemming nodig.\n\n🤝 LOKALE GEMEENSCHAP:\n• Fietsbezorging is de voorkeur\n• Lokale routes ondersteunen de buurt\n• Gecombineerde bezorging is efficiënter\n• Herbruikbare verpakking gebruiken\n\n⚠️ BELANGRIJK: Als bezorger ben je zelfstandige ondernemer. HomeCheff is alleen een platform en niet je werkgever."
    },
    {
      question: "Wat verdien ik als bezorger?",
      answer: "Je verdient per bezorging. Het exacte bedrag hangt af van de afstand en complexiteit. Je bent zelfstandige ondernemer en bent zelf verantwoordelijk voor belastingen en verzekeringen.\n\n💰 PRAKTISCHE VOORDELEN:\n• Extra beloning voor fietsbezorging\n• Bonus voor gecombineerde routes\n• Beloning voor herbruikbare verpakking\n• Incentive voor lokale bezorging\n\n⚠️ BELANGRIJK: HomeCheff is alleen een platform. Wij zijn niet je werkgever en bieden geen werkgeversverzekeringen."
    },
    {
      question: "Welke verzekeringen heb ik nodig als bezorger?",
      answer: "Je bent verplicht om een aansprakelijkheidsverzekering (min. €1.000.000) en ongevallenverzekering af te sluiten. Ook moet je je vervoersmiddel verzekeren. HomeCheff biedt geen werkgeversverzekeringen."
    },
    {
      question: "Hoe werkt de betaling voor bezorgers?",
      answer: "Je verdiensten worden automatisch uitbetaald via het platform. Je bent zelf verantwoordelijk voor het opgeven van je inkomsten bij de Belastingdienst en het betalen van belastingen."
    },
    {
      question: "Kan ik als bezorger mijn werktijden zelf bepalen?",
      answer: "Ja, als zelfstandige bezorger bepaal je zelf wanneer je beschikbaar bent. Je kunt je beschikbaarheid instellen in je bezorger dashboard en bezorgingen accepteren of weigeren."
    },
    {
      question: "Wat als er iets misgaat tijdens een bezorging?",
      answer: "Als bezorger ben je zelf verantwoordelijk voor schade of problemen tijdens bezorging. Zorg voor adequate verzekeringen. Bij ernstige incidenten kun je contact opnemen met onze support."
    },
    {
      question: "Hoe wordt mijn locatie gebruikt als bezorger?",
      answer: "We gebruiken je locatie alleen om je te matchen met nabijgelegen bezorgingen en om de route te optimaliseren. Je locatie wordt niet gedeeld met derden en wordt niet opgeslagen na de bezorging."
    }
  ],
  taxes: [
    {
      question: "Moet ik belasting betalen over mijn verkopen?",
      answer: "Ja, als verkoper ben je zelf verantwoordelijk voor het opgeven van alle inkomsten bij de Belastingdienst. Er is geen minimumbedrag - alle inkomsten moeten worden opgegeven."
    },
    {
      question: "Vanaf welk bedrag moet ik BTW betalen?",
      answer: "Je bent BTW-plichtig vanaf €20.000 omzet per jaar. Onder dit bedrag hoef je geen BTW te betalen, maar je moet wel je inkomsten opgeven voor de inkomstenbelasting."
    },
    {
      question: "Geeft HomeCheff mijn gegevens door aan de Belastingdienst?",
      answer: "Ja, volgens de EU-richtlijn DAC7 zijn we verplicht om je gegevens door te geven als je meer dan 30 transacties per jaar uitvoert of meer dan €2.000 omzet behaalt."
    },
    {
      question: "Moet ik me inschrijven bij de KvK?",
      answer: "Bij structurele verkoop (regelmatig verkopen) moet je je inschrijven bij de Kamer van Koophandel. Voor incidentele verkoop is dit meestal niet nodig."
    },
    {
      question: "Biedt HomeCheff belastingadvies?",
      answer: "Nee, HomeCheff biedt geen belastingadvies. Consulteer een accountant of belastingadviseur voor specifieke vragen over je situatie."
    }
  ],
  handmade: [
    {
      question: "Wat betekent 'handgemaakt' op HomeCheff?",
      answer: "Handgemaakt betekent dat je het product zelf hebt gemaakt, gekweekt of bereid met duurzaamheid in gedachten. Het gaat om het hergebruiken van materialen, het tegengaan van verspilling en het creëren van unieke, duurzame producten. We moedigen creativiteit aan die bijdraagt aan een circulaire economie."
    },
    {
      question: "Mag ik oude spullen oplappen en verkopen?",
      answer: "Ja, dat is juist geweldig! Het herstellen en upcyclen van oude spullen is een prachtige vorm van duurzaamheid. Denk aan:\n\n♻️ UPGRADEN VAN SPULLEN:\n• Oude kleding herstellen en personaliseren\n• Meubels opknappen en een nieuwe look geven\n• Elektronica repareren en moderniseren\n• Keukengerei restaureren en verbeteren\n\n🌱 DUURZAAMHEID:\n• Voorkomt verspilling van grondstoffen\n• Verlengt de levensduur van producten\n• Vermindert afval\n• Creëert unieke, persoonlijke items\n\n💡 Tip: Beschrijf duidelijk wat je hebt gedaan en waarom het duurzaam is!"
    },
    {
      question: "Hoe kan ik duurzaam handgemaakt werk verkopen?",
      answer: "Focus op duurzaamheid en hergebruik in je producten:\n\n🌿 DUURZAME MATERIALEN:\n• Gebruik restjes en overtollige materialen\n• Kies voor biologische of gerecyclede ingrediënten\n• Hergebruik verpakkingen en containers\n• Maak van oude spullen iets nieuws\n\n♻️ CIRCULAIRE ECONOMIE:\n• Repareer in plaats van weggooien\n• Geef oude items een tweede leven\n• Vermeld de duurzame aspecten in je beschrijving\n• Inspireer anderen tot duurzaam leven\n\n🤝 GEMEENSCHAP:\n• Deel je duurzaamheidsverhaal\n• Leer anderen hoe ze kunnen upcyclen\n• Bouw een bewuste community op"
    },
    {
      question: "Wat als ik producten maak van gerecyclede materialen?",
      answer: "Dat is fantastisch! Gerecyclede materialen zijn de toekomst van duurzaam handgemaakt werk:\n\n♻️ GEREYCLEDE MATERIALEN:\n• Oude kleding omtoveren tot nieuwe items\n• Glaswerk hergebruiken voor decoratie\n• Hout van oude meubels verwerken\n• Plastic verpakkingen omzetten in kunst\n\n🌱 VOORDELEN:\n• Vermindert afval drastisch\n• Bespaart nieuwe grondstoffen\n• Creëert unieke, verhalende producten\n• Inspireert tot bewuster consumeren\n\n💡 Tip: Vertel het verhaal van je materialen - waar komen ze vandaan en hoe heb je ze getransformeerd?"
    },
    {
      question: "Hoe kan ik mijn handgemaakte producten duurzaam verpakken?",
      answer: "Duurzame verpakking is een belangrijk onderdeel van je duurzame aanpak:\n\n🌿 DUURZAME VERPAKKING:\n• Hergebruik oude dozen en zakken\n• Gebruik biologisch afbreekbare materialen\n• Maak je eigen herbruikbare verpakkingen\n• Kies voor minimalistische, functionele verpakking\n\n♻️ CIRCULAIRE VERPAKKING:\n• Verpakkingen die opnieuw gebruikt kunnen worden\n• Ingebedde zaden in verpakkingsmateriaal\n• Composteerbare verpakkingen\n• Geen plastic, wel natuurlijke materialen\n\n🤝 INSPIREREN:\n• Laat zien hoe je duurzaam verpakt\n• Geef tips voor hergebruik van verpakking\n• Bouw een bewuste verpakkingscultuur op"
    },
    {
      question: "Wat zijn voorbeelden van toegestane producten?",
      answer: "✅ Thuisgebakken taarten, zelfgemaakte jam, verse pasta\n✅ Zelf gekweekte tomaten, kruiden uit eigen tuin\n✅ Handgemaakte sieraden, gebreide truien, schilderijen\n❌ Fabriekskoekjes, groothandel groenten, massaproductie kleding"
    }
  ],
  safety: [
    {
      question: "Hoe weet ik dat verkopers betrouwbaar zijn?",
      answer: "We hebben een verificatiesysteem, reviews van andere gebruikers, en een klachtenprocedure. Nieuwe verkopers worden extra gecontroleerd. Lees altijd reviews voordat je koopt.\n\n⚠️ BELANGRIJK: HomeCheff is alleen een platform. Wij zijn niet verantwoordelijk voor de kwaliteit, veiligheid of geschillen van producten. Alle transacties zijn tussen verkoper en koper."
    },
    {
      question: "Wat als ik problemen heb met een verkoper?",
      answer: "Neem eerst contact op met de verkoper. Als dat niet lukt, kun je een klacht indienen via onze helpdesk. We bemiddelen bij geschillen en kunnen in extreme gevallen actie ondernemen."
    },
    {
      question: "Zijn mijn persoonsgegevens veilig?",
      answer: "Ja, we beschermen je gegevens volgens de AVG/GDPR. We gebruiken encryptie, veilige servers en delen je gegevens alleen met derden wanneer wettelijk verplicht."
    },
    {
      question: "Kan ik anoniem kopen?",
      answer: "Je account is nodig voor transacties, maar je kunt je profiel privé houden. Verkopers zien alleen je naam en contactgegevens die nodig zijn voor de transactie."
    },
    {
      question: "Wat als een product niet is zoals beschreven?",
      answer: "Neem contact op met de verkoper voor een oplossing. Als dat niet lukt, kunnen wij bemiddelen. Houd foto's en beschrijvingen bij als bewijs."
    }
  ],
  sustainability: [
    {
      question: "Hoe draagt HomeCheff bij aan het tegengaan van voedselverspilling?",
      answer: "🌱 HomeCheff helpt voedselverspilling tegen te gaan door het delen van overtollige maaltijden en producten. Als je voor jezelf kookt en er teveel van hebt, kun je dat delen met anderen in je buurt. Dit is niet alleen duurzaam, maar ook sociaal - je helpt anderen terwijl je verspilling voorkomt.\n\n💡 Denk aan: Extra portie pasta, overtollige groenten uit je tuin, of een taart die te groot was voor je gezin. In plaats van weggooien, deel je het met je gemeenschap."
    },
    {
      question: "Valt het delen van overtollig eten onder commerciële verkoop?",
      answer: "❌ Nee, dit valt onder 'delen van overtollig voedsel' en niet onder commerciële voedselproductie. Je kookt voor jezelf en deelt alleen wat je over hebt. Dit is vergelijkbaar met het delen van eten met buren of vrienden - alleen dan via een platform.\n\n✅ Je bent geen restaurant of commerciële keuken. Je deelt gewoon je overtollige maaltijden om verspilling tegen te gaan."
    },
    {
      question: "Moet ik me registreren bij de NVWA als ik overtollig eten deel?",
      answer: "❌ Nee, voor het delen van overtollig eten hoef je je niet te registreren bij de NVWA. Dit geldt alleen voor commerciële voedselproductie. Omdat je voor jezelf kookt en alleen deelt wat over is, val je niet onder de voedselinspectie wetten.\n\n🏠 Je keuken blijft een particuliere keuken, geen commerciële keuken. Je deelt gewoon je overtollige maaltijden met je buurt."
    },
    {
      question: "Wat is het verschil tussen verkopen en delen van overtollig eten?",
      answer: "🔄 Het verschil zit in de intentie:\n\n📤 DELEN (wat wij doen):\n• Je kookt voor jezelf\n• Je hebt teveel gemaakt\n• Je deelt de overtollige portie\n• Kleine vergoeding voor ingrediënten\n\n💰 VERKOPEN (commercieel):\n• Je kookt specifiek voor verkoop\n• Je produceert op bestelling\n• Je bent een commerciële keuken\n• Volledige winstmarge\n\nHomeCheff richt zich op het eerste: delen van overtollig eten!"
    },
    {
      question: "Zijn er limieten aan hoeveel ik kan delen?",
      answer: "📊 Ja, om onder de radar te blijven van voedselinspectie:\n\n✅ TOEGESTAAN:\n• Incidentele verkoop van overtollig eten\n• Kleine hoeveelheden (1-5 porties per keer)\n• Thuisgemaakte maaltijden\n• Verse producten uit eigen tuin\n\n❌ NIET TOEGESTAAN:\n• Grote commerciële productie\n• Dagelijkse verkoop van dezelfde producten\n• Professionele keuken setup\n• Massaproductie\n\n🎯 Blijf binnen de 'delen' categorie, niet 'verkopen'!"
    },
    {
      question: "Hoe kan ik veilig overtollig eten delen?",
      answer: "🛡️ Volg deze richtlijnen voor veilig delen:\n\n🍽️ HYGIËNE:\n• Was je handen voor het koken\n• Gebruik schone keukenapparatuur\n• Bewaar eten koel tot uitgifte\n• Vermeld bereidingsdatum\n\n📝 TRANSPARANTIE:\n• Beschrijf wat je hebt gemaakt\n• Noem de ingrediënten\n• Vermeld allergenen\n• Wees eerlijk over versheid\n\n🤝 COMMUNICATIE:\n• Reageer snel op vragen\n• Geef duidelijke instructies\n• Wees vriendelijk en behulpzaam\n\nZo bouw je vertrouwen op en draag je bij aan een veilige gemeenschap!"
    },
    {
      question: "Mag ik zelf gekweekte groenten en tuinproducten delen?",
      answer: "🌱 Ja! Het delen van overtollige groenten uit je eigen tuin valt onder dezelfde categorie als overtollig eten. Je kweekt voor jezelf en deelt alleen wat je over hebt.\n\n✅ TOEGESTAAN:\n• Overtollige tomaten, komkommers, sla\n• Teveel kruiden (basilicum, peterselie, tijm)\n• Extra fruit van je fruitbomen\n• Bloemen en planten die je over hebt\n• Zaden en stekjes van je planten\n\n🏡 Dit is geen commerciële landbouw - je deelt gewoon je tuinoogst!"
    },
    {
      question: "Valt het delen van tuinproducten onder landbouwwetgeving?",
      answer: "❌ Nee, voor het delen van overtollige tuinproducten hoef je je niet te registreren bij de NVWA. Dit geldt alleen voor commerciële landbouw en voedselproductie.\n\n🌿 Jouw situatie:\n• Particuliere tuin (geen commerciële kwekerij)\n• Je kweekt voor jezelf\n• Je deelt alleen wat over is\n• Geen grootschalige productie\n\n✅ Je bent geen boer of kweker - je deelt gewoon je tuinoogst om verspilling tegen te gaan!"
    },
    {
      question: "Wat als ik teveel planten heb gekweekt?",
      answer: "🌱 Perfect! Veel tuiniers kweken graag planten maar hebben er teveel van. Dit is een geweldige manier om verspilling tegen te gaan:\n\n🌿 DELEN VAN PLANTEN:\n• Extra zaailingen die je over hebt\n• Stekjes van je favoriete planten\n• Bloembollen die je teveel hebt\n• Kamerplanten die je wilt delen\n\n🤝 GEMEENSCHAP:\n• Andere tuiniers helpen\n• Plantenverspilling tegengaan\n• Lokale biodiversiteit ondersteunen\n• Groene gemeenschap opbouwen\n\n💡 Tip: Veel mensen vinden kweken leuk maar hebben niet altijd groene vingers - jij helpt hen!"
    },
    {
      question: "Zijn er limieten aan het delen van tuinproducten?",
      answer: "📊 Ja, om binnen de 'delen' categorie te blijven:\n\n✅ TOEGESTAAN (incidenteel delen):\n• Kleine hoeveelheden overtollige groenten\n• Enkele planten/stekjes per keer\n• Verse kruiden uit je tuin\n• Bloemen die je over hebt\n• Zaden van je eigen planten\n\n❌ NIET TOEGESTAAN (commerciële productie):\n• Grote hoeveelheden van dezelfde groente\n• Dagelijkse verkoop van tuinproducten\n• Professionele kwekerij setup\n• Massaproductie van planten\n\n🎯 Blijf binnen de 'hobbytuinier deelt overtollige oogst' categorie!"
    },
    {
      question: "Hoe kan ik veilig tuinproducten delen?",
      answer: "🛡️ Volg deze richtlijnen voor veilig delen van tuinproducten:\n\n🌱 HYGIËNE:\n• Was groenten en fruit goed\n• Gebruik schone emmers/dozen\n• Vermijd contact met grond\n• Bewaar koel tot uitgifte\n\n📝 TRANSPARANTIE:\n• Beschrijf wat je hebt gekweekt\n• Vermeld groeimethode (biologisch/conventioneel)\n• Geef bewaaradvies\n• Wees eerlijk over versheid\n\n🌿 PLANTEN DELEN:\n• Geef verzorgingsinstructies\n• Vermeld zon/water behoeften\n• Leg uit hoe te verpotten\n• Deel je ervaring en tips\n\n🤝 Zo help je anderen en bouw je een groene gemeenschap op!"
    }
  ]
};

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (itemKey: string) => {
    setOpenItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      amber: 'bg-amber-50 border-amber-200 text-amber-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getIconColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      emerald: 'text-emerald-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      indigo: 'text-indigo-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Veelgestelde Vragen</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vind hier antwoorden op de meest gestelde vragen over HomeCheff. 
            Staat je vraag er niet bij? Neem contact met ons op!
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorieën</h2>
              <nav className="space-y-2">
                {faqCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeCategory === category.id
                          ? getColorClasses(category.color)
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${getIconColor(category.color)}`} />
                      <span className="font-medium">{category.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border p-8">
              <div className="flex items-center space-x-3 mb-8">
                {(() => {
                  const category = faqCategories.find(c => c.id === activeCategory);
                  const Icon = category?.icon || HelpCircle;
                  return (
                    <>
                      <Icon className={`w-6 h-6 ${getIconColor(category?.color || 'blue')}`} />
                      <h2 className="text-2xl font-bold text-gray-900">
                        {category?.title || 'Algemeen'}
                      </h2>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-4">
                {faqData[activeCategory as keyof typeof faqData]?.map((item, index) => {
                  const itemKey = `${activeCategory}-${index}`;
                  const isOpen = openItems[itemKey];
                  
                  return (
                    <div key={itemKey} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-6">
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Contact CTA */}
              <div className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Staat je vraag er niet bij?
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Onze klantenservice helpt je graag verder. We reageren meestal binnen 24 uur.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="mailto:support@homecheff.eu"
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        E-mail ons
                      </a>
                      <a
                        href="/contact"
                        className="inline-flex items-center px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Contactformulier
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
