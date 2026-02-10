import React from 'react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Algemene Voorwaarden HomeCheff</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Laatst bijgewerkt:</strong> {new Date().toLocaleDateString('nl-NL')}<br/>
              <strong>Versie:</strong> 1.0
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Algemene bepalingen</h2>
              <p className="text-gray-700 mb-4">
                Deze algemene voorwaarden zijn van toepassing op alle diensten die HomeCheff B.V. (hierna: "HomeCheff", "wij", "ons") levert via het platform homecheff.eu en gerelateerde diensten.
              </p>
              <p className="text-gray-700 mb-4">
                Door gebruik te maken van onze diensten, gaat u akkoord met deze voorwaarden. Wij behouden ons het recht voor om deze voorwaarden te wijzigen.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definities</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Platform:</strong> Het HomeCheff platform en alle gerelateerde diensten</li>
                <li><strong>Gebruiker:</strong> Iedereen die gebruik maakt van het platform</li>
                <li><strong>Verkoper:</strong> Gebruiker die producten aanbiedt via het platform</li>
                <li><strong>Koper:</strong> Gebruiker die producten koopt via het platform</li>
                <li><strong>Transactie:</strong> Overeenkomst tussen koper en verkoper via het platform</li>
                <li><strong>Producten:</strong> Gerechten, groenten, handgemaakte items en andere aanbiedingen</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Gebruik van het platform</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Algemene verplichtingen</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>U bent verantwoordelijk voor de juistheid van uw gegevens</li>
                <li>U mag geen illegale of schadelijke content plaatsen</li>
                <li>U respecteert de rechten van andere gebruikers</li>
                <li>U gebruikt het platform alleen voor legale doeleinden</li>
                <li>U mag geen valse of misleidende informatie verstrekken</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account verplichtingen</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>U bent verantwoordelijk voor de beveiliging van uw account</li>
                <li>U mag uw account niet delen met anderen</li>
                <li>U moet uw gegevens actueel houden</li>
                <li>U bent verantwoordelijk voor alle activiteiten onder uw account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Verkoop en transacties</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Verkoopverplichtingen</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Verkopers zijn zelf verantwoordelijk voor belastingaangifte</li>
                <li>Producten moeten voldoen aan Nederlandse wetgeving</li>
                <li>HomeCheff is een platform, geen partij in transacties</li>
                <li>Verkopers zijn verantwoordelijk voor productkwaliteit en veiligheid</li>
                <li>Alle producten moeten accuraat worden beschreven</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Belastingverantwoordelijkheid</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">Belangrijke waarschuwing</h4>
                    <p className="text-sm text-yellow-700">
                      Verkopers zijn zelf verantwoordelijk voor het aangeven van inkomsten bij de belastingdienst. 
                      Er is geen minimumbedrag - alle inkomsten moeten worden opgegeven.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Transactieverwerking</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Betalingen worden verwerkt via Stripe</li>
                <li>Platformkosten worden in rekening gebracht</li>
                <li>Uitbetalingen vinden plaats volgens afgesproken voorwaarden</li>
                <li>HomeCheff bemiddelt bij geschillen</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy en gegevensbescherming</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Wij verwerken gegevens volgens de AVG/GDPR</li>
                <li>Gebruikers hebben rechten op toegang, rectificatie en verwijdering</li>
                <li>Gegevens worden veilig opgeslagen en beschermd</li>
                <li>Marketingcommunicatie alleen met toestemming</li>
                <li>Zie ons <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">Privacy Statement</a> voor details</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Aansprakelijkheid en garanties</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Platform aansprakelijkheid</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>HomeCheff is een platform, geen partij in transacties</li>
                <li>Wij zijn niet aansprakelijk voor productkwaliteit</li>
                <li>Wij bemiddelen bij geschillen maar zijn niet verantwoordelijk</li>
                <li>Platform wordt geleverd "as is" zonder garanties</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Gebruiker aansprakelijkheid</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Gebruikers zijn verantwoordelijk voor hun eigen handelingen</li>
                <li>Verkopers zijn aansprakelijk voor hun producten</li>
                <li>Gebruikers dragen de kosten van geschillen</li>
                <li>Schade door misbruik wordt verhaald op de gebruiker</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Geschillen en rechtspraak</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Geschillen worden eerst via bemiddeling opgelost</li>
                <li>Nederlands recht is van toepassing</li>
                <li>Geschillen worden voorgelegd aan de bevoegde rechter in Nederland</li>
                <li>Consumenten kunnen gebruik maken van het Europees Online Geschillenplatform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Wijzigingen en opzegging</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Wijzigingen voorwaarden</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Wij kunnen deze voorwaarden wijzigen</li>
                <li>Wijzigingen worden 30 dagen van tevoren aangekondigd</li>
                <li>Gebruik na wijziging betekent acceptatie</li>
                <li>Belangrijke wijzigingen worden per e-mail gecommuniceerd</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Opzegging diensten</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Gebruikers kunnen hun account opzeggen</li>
                <li>Abonnementen kunnen worden opgezegd met 30 dagen opzegtermijn</li>
                <li>Wij kunnen accounts opzeggen bij schending van voorwaarden</li>
                <li>Gegevens worden 1 jaar bewaard na opzegging</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">Voor vragen over deze voorwaarden:</p>
                <p className="text-gray-700 mb-2"><strong>HomeCheff B.V.</strong></p>
                <p className="text-gray-700 mb-2"><strong>E-mail:</strong> info@homecheff.nl</p>
                <p className="text-gray-700 mb-2"><strong>Telefoon:</strong> [Telefoonnummer]</p>
                <p className="text-gray-700"><strong>Adres:</strong> [Bedrijfsadres]</p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                Deze algemene voorwaarden zijn opgesteld in overeenstemming met het Nederlandse recht en de Europese consumentenwetgeving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

