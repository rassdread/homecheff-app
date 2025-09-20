import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Statement HomeCheff</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Laatst bijgewerkt:</strong> {new Date().toLocaleDateString('nl-NL')}<br/>
              <strong>Versie:</strong> 1.0
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Inleiding</h2>
              <p className="text-gray-700 mb-4">
                HomeCheff B.V. (hierna: "HomeCheff", "wij", "ons" of "onze") respecteert uw privacy en is verantwoordelijk voor de verwerking van uw persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en de Nederlandse privacywetgeving.
              </p>
              <p className="text-gray-700">
                Dit privacy statement verklaart hoe wij uw persoonsgegevens verzamelen, gebruiken, opslaan en beschermen wanneer u gebruik maakt van onze platform en diensten.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Gegevensverantwoordelijke</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>HomeCheff B.V.</strong></p>
                <p className="text-gray-700 mb-2">KvK-nummer: [KvK-nummer]</p>
                <p className="text-gray-700 mb-2">BTW-nummer: [BTW-nummer]</p>
                <p className="text-gray-700 mb-2">Adres: [Bedrijfsadres]</p>
                <p className="text-gray-700 mb-2">E-mail: privacy@homecheff.nl</p>
                <p className="text-gray-700">Telefoon: [Telefoonnummer]</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Welke persoonsgegevens verwerken wij?</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Gegevens die u direct aan ons verstrekt:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Identificatiegegevens:</strong> Naam, e-mailadres, telefoonnummer, gebruikersnaam</li>
                <li><strong>Accountgegevens:</strong> Wachtwoord (gehashed), profielfoto, biografie</li>
                <li><strong>Locatiegegevens:</strong> Adres, postcode, plaats, GPS-coördinaten (optioneel)</li>
                <li><strong>Verkoopgegevens:</strong> Productinformatie, prijzen, voorraad, leveringsopties</li>
                <li><strong>Communicatiegegevens:</strong> Berichten, reviews, klachten, support tickets</li>
                <li><strong>Betalingsgegevens:</strong> Bankrekeningnummer, IBAN, rekeninghouder (alleen voor uitbetalingen)</li>
                <li><strong>Voorkeuren:</strong> Interesses, notificatie-instellingen, taalvoorkeur</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Gegevens die automatisch worden verzameld:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Technische gegevens:</strong> IP-adres, browser type, besturingssysteem, apparaat-ID</li>
                <li><strong>Gebruiksgegevens:</strong> Paginaweergaven, klikgedrag, sessieduur, zoekopdrachten</li>
                <li><strong>Cookies en tracking:</strong> Functionele, analytische en marketing cookies</li>
                <li><strong>Locatiegegevens:</strong> Geschatte locatie op basis van IP-adres</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Gegevens van derden:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Sociale media:</strong> Profielgegevens bij inloggen via Google/Facebook</li>
                <li><strong>Betalingsproviders:</strong> Stripe transactiegegevens</li>
                <li><strong>Verificatiediensten:</strong> Telefoonnummer verificatie via SMS</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Doeleinden van gegevensverwerking</h2>
              <p className="text-gray-700 mb-4">Wij verwerken uw persoonsgegevens voor de volgende doeleinden:</p>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Uitvoering van de overeenkomst:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Accountbeheer en authenticatie</li>
                <li>Faciliteren van transacties tussen kopers en verkopers</li>
                <li>Verwerking van betalingen en uitbetalingen</li>
                <li>Levering van platformfunctionaliteiten</li>
                <li>Klantenservice en ondersteuning</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Wettelijke verplichtingen:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Belasting- en boekhoudkundige verplichtingen</li>
                <li>Fraudepreventie en -detectie</li>
                <li>Identiteitsverificatie (KYC)</li>
                <li>Meldplichten aan toezichthouders</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Gerechtvaardigde belangen:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Platformverbetering en -ontwikkeling</li>
                <li>Gebruikerservaring optimalisatie</li>
                <li>Marketing en promotie (met toestemming)</li>
                <li>Statistieken en analytics</li>
                <li>Beveiliging en fraudepreventie</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Uw rechten</h2>
              <p className="text-gray-700 mb-4">U heeft de volgende rechten betreffende uw persoonsgegevens:</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Toegang en inzage</h3>
                  <p className="text-blue-800 text-sm">Overzicht van verwerkte gegevens, doeleinden van verwerking, categorieën van ontvangers</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Rectificatie</h3>
                  <p className="text-green-800 text-sm">Correctie van onjuiste gegevens, aanvulling van onvolledige gegevens</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Verwijdering</h3>
                  <p className="text-red-800 text-sm">"Recht om vergeten te worden" onder bepaalde voorwaarden</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Beperking</h3>
                  <p className="text-yellow-800 text-sm">Tijdelijke opschorting van verwerking bij geschillen over gegevens</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Overdraagbaarheid</h3>
                  <p className="text-purple-800 text-sm">Export van uw gegevens, overdracht naar andere dienstverleners</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">Bezwaar</h3>
                  <p className="text-orange-800 text-sm">Tegen verwerking op basis van gerechtvaardigd belang, tegen direct marketing</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Uitoefening van uw rechten</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">Voor het uitoefenen van uw rechten kunt u contact opnemen met:</p>
                <p className="text-gray-700 mb-2"><strong>E-mail:</strong> privacy@homecheff.nl</p>
                <p className="text-gray-700 mb-2"><strong>Post:</strong> HomeCheff B.V., [Adres], [Postcode] [Plaats]</p>
                <p className="text-gray-700 mb-4">Wij reageren binnen 1 maand op uw verzoek. In complexe gevallen kan deze termijn met 2 maanden worden verlengd.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Belastingverantwoordelijkheid</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Belangrijke waarschuwing</h3>
                    <p className="text-yellow-700 mb-4">
                      Als verkoper via HomeCheff ben je zelf verantwoordelijk voor het aangeven van je inkomsten bij de belastingdienst. 
                      HomeCheff is een platform en biedt geen belastingadvies.
                    </p>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      <li>Alle inkomsten moeten worden opgegeven (geen minimumbedrag)</li>
                      <li>BTW-plichtig vanaf €20.000 omzet per jaar</li>
                      <li>KvK-registratie bij structurele verkoop</li>
                      <li>Consulteer een accountant voor specifieke vragen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">Voor vragen over dit privacy statement of onze gegevensverwerking:</p>
                <p className="text-gray-700 mb-2"><strong>HomeCheff B.V.</strong></p>
                <p className="text-gray-700 mb-2"><strong>Privacy Officer</strong></p>
                <p className="text-gray-700 mb-2"><strong>E-mail:</strong> privacy@homecheff.nl</p>
                <p className="text-gray-700 mb-2"><strong>Telefoon:</strong> [Telefoonnummer]</p>
                <p className="text-gray-700"><strong>Adres:</strong> [Bedrijfsadres]</p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                Dit privacy statement is opgesteld in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en de Nederlandse privacywetgeving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
