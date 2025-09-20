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
    id: 'handmade',
    title: 'Handgemaakt',
    icon: AlertTriangle,
    color: 'amber'
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
      answer: "HomeCheff is een lokaal platform waar particulieren hun handgemaakte producten kunnen verkopen. We richten ons op thuisgemaakte gerechten, verse producten uit eigen tuin en handgemaakte creaties. Het platform verbindt lokale makers met consumenten in hun buurt."
    },
    {
      question: "Hoe werkt HomeCheff?",
      answer: "Voor particuliere verkopers is het platform volledig gratis! Je betaalt alleen een klein percentage op het aankoopbedrag zodat de app kan blijven bestaan. Bedrijven met een KVK nummer kunnen kiezen voor een abonnement. Kopers kunnen zoeken, filteren en producten kopen."
    },
    {
      question: "Is HomeCheff gratis te gebruiken?",
      answer: "Ja! Voor particuliere verkopers is HomeCheff volledig gratis. Je betaalt geen maandelijkse kosten, alleen een klein percentage op elke verkoop. Voor bedrijven met een KVK nummer zijn er abonnementen."
    },
    {
      question: "In welke steden is HomeCheff beschikbaar?",
      answer: "HomeCheff is momenteel beschikbaar in heel Nederland. We richten ons op lokale communities en breiden geleidelijk uit naar meer regio's."
    },
    {
      question: "Hoe kan ik contact opnemen met HomeCheff?",
      answer: "Je kunt ons bereiken via support@homecheff.nl, onze helpdesk in de app, of via de contactpagina. We reageren meestal binnen 24 uur."
    }
  ],
  selling: [
    {
      question: "Hoe word ik verkoper op HomeCheff?",
      answer: "Registreer je account, kies een verkopersrol (Chef, Garden, Designer) en vul je bankgegevens in. Voor particulieren is er geen abonnement nodig - je kunt direct beginnen met verkopen! Kleine bedrijven kunnen optioneel een abonnement kiezen voor lagere transactiekosten."
    },
    {
      question: "Welke abonnementen zijn er voor verkopers?",
      answer: "Voor particulieren: Volledig gratis! Alleen transactiekosten (2-7%)\n\nVoor kleine bedrijven (optioneel):\n• Basic: €39/maand, 4% transactiekosten\n• Pro: €99/maand, 3% transactiekosten\n• Premium: €199/maand, 2% transactiekosten\n\nJe kunt altijd upgraden of downgraden."
    },
    {
      question: "Wat mag ik verkopen op HomeCheff?",
      answer: "Alleen handgemaakte producten van eigen makelij:\n• Chef: Thuisgemaakte gerechten, snacks, desserts (eigen keuken)\n• Garden: Zelf gekweekte groenten, fruit, kruiden, planten (eigen tuin)\n• Designer: Handgemaakte items, kunst, decoratie, kleding (eigen creatie)\n\nGeen handel of doorverkoop van fabrieksproducten. Alle producten moeten voldoen aan Nederlandse wetgeving en veiligheidsvoorschriften."
    },
    {
      question: "Hoe krijg ik mijn geld uitbetaald?",
      answer: "Uitbetalingen gebeuren automatisch via Stripe Connect naar je opgegeven bankrekening. Voor nieuwe accounts is de uitbetalingstermijn 7 dagen na de betaling. Naarmate je account ouder wordt en een positieve geschiedenis opbouwt, kunnen uitbetalingen sneller worden (2-3 werkdagen). Je ontvangt een email wanneer de uitbetaling is verwerkt."
    },
    {
      question: "Kan ik mijn producten bewerken of verwijderen?",
      answer: "Ja, je kunt je producten altijd bewerken, voorraad aanpassen, prijzen wijzigen of producten tijdelijk deactiveren. Verwijderen kan ook, maar dit beïnvloedt je statistieken."
    }
  ],
  buying: [
    {
      question: "Hoe koop ik producten op HomeCheff?",
      answer: "Zoek naar producten, bekijk details, voeg toe aan winkelwagen en ga naar checkout. Betaling gebeurt via Stripe (veilig en snel). Na betaling ontvang je bevestiging en contactgegevens van de verkoper."
    },
    {
      question: "Welke betaalmethoden worden geaccepteerd?",
      answer: "We accepteren alle belangrijke betaalmethoden via Stripe: iDEAL, creditcards, Bancontact, SEPA en meer. Alle betalingen zijn beveiligd en gecodeerd."
    },
    {
      question: "Kan ik producten reserveren?",
      answer: "Ja, veel verkopers bieden reservering aan. Je kunt een product reserveren en later ophalen of laten bezorgen, afhankelijk van wat de verkoper aanbiedt."
    },
    {
      question: "Wat als ik niet tevreden ben over mijn aankoop?",
      answer: "Neem eerst contact op met de verkoper. Als dat niet lukt, kunnen wij bemiddelen. We hebben een klachtenprocedure en kunnen in extreme gevallen een terugbetaling regelen."
    },
    {
      question: "Kan ik verkopers volgen?",
      answer: "Ja! Volg je favoriete verkopers om op de hoogte te blijven van nieuwe producten. Je ontvangt notificaties wanneer ze nieuwe items toevoegen."
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
      answer: "Transactiekosten variëren per abonnement: Basic 7%, Pro 4%, Premium 2%. Deze kosten worden automatisch afgetrokken van je verkoopopbrengst."
    },
    {
      question: "Hoe werkt de uitbetaling voor verkopers?",
      answer: "Uitbetalingen gebeuren automatisch via Stripe Connect naar je opgegeven bankrekening. Voor nieuwe accounts is de uitbetalingstermijn 7 dagen na de betaling. Naarmate je account ouder wordt en een positieve geschiedenis opbouwt, kunnen uitbetalingen sneller worden (2-3 werkdagen). Je kunt je uitbetalingen volgen in je verkopersdashboard."
    }
  ],
  delivery: [
    {
      question: "Hoe werkt levering op HomeCheff?",
      answer: "Verkopers kunnen kiezen voor afhalen, bezorgen, of beide. Bij bezorgen regelen verkoper en koper de details onderling. HomeCheff bemiddelt niet in de levering zelf."
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
      answer: "Handgemaakt betekent dat je het product zelf hebt gemaakt, gekweekt of bereid. Het moet van jouw eigen creativiteit en werk komen, niet van een fabriek of groothandel. We controleren dit om de authenticiteit te waarborgen."
    },
    {
      question: "Mag ik fabrieksproducten verkopen?",
      answer: "Nee, HomeCheff is uitsluitend voor handgemaakte producten. Geen doorverkoop van fabrieksproducten, groothandel of dropshipping. We willen echte makers en hun unieke creaties ondersteunen."
    },
    {
      question: "Hoe controleert HomeCheff of iets handgemaakt is?",
      answer: "We vragen om foto's van het maakproces, ingrediënten of materialen. Bij twijfel kunnen we om bewijs vragen. We hebben een community die elkaar helpt en meldt verdachte activiteit. Handel wordt niet getolereerd."
    },
    {
      question: "Wat als ik een recept van internet gebruik?",
      answer: "Dat is prima! Zolang je het zelf maakt in je eigen keuken, is het handgemaakt. We moedigen creativiteit en leren aan. Het gaat om jouw eigen productie, niet om de origine van het recept."
    },
    {
      question: "Kan ik producten verkopen die ik van anderen heb gekregen?",
      answer: "Alleen als je ze zelf hebt gemaakt. Producten van vrienden, familie of andere makers mogen niet worden doorverkocht. HomeCheff is voor jouw eigen creaties, niet voor handel in andermans werk."
    },
    {
      question: "Wat zijn voorbeelden van toegestane producten?",
      answer: "✅ Thuisgebakken taarten, zelfgemaakte jam, verse pasta\n✅ Zelf gekweekte tomaten, kruiden uit eigen tuin\n✅ Handgemaakte sieraden, gebreide truien, schilderijen\n❌ Fabriekskoekjes, groothandel groenten, massaproductie kleding"
    }
  ],
  safety: [
    {
      question: "Hoe weet ik dat verkopers betrouwbaar zijn?",
      answer: "We hebben een verificatiesysteem, reviews van andere gebruikers, en een klachtenprocedure. Nieuwe verkopers worden extra gecontroleerd. Lees altijd reviews voordat je koopt."
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
                        href="mailto:support@homecheff.nl"
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
