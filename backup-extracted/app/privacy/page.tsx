import { Shield, Lock, Eye, Database, Users, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-4 mb-4">
              <Shield className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold">Privacybeleid</h1>
                <p className="text-blue-100 mt-2">
                  Jouw privacy en veiligheid zijn onze prioriteit
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <div className="prose prose-lg max-w-none">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <Lock className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    Veilige Data Opslag
                  </h3>
                  <p className="text-green-700">
                    Alle persoonlijke gegevens worden versleuteld opgeslagen en zijn alleen toegankelijk voor jou en onze beveiligde systemen.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <Eye className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    Geen Data Delen
                  </h3>
                  <p className="text-blue-700">
                    We delen jouw persoonlijke informatie nooit met derden. Jouw data blijft privé en wordt alleen gebruikt voor de werking van de app.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <Database className="w-8 h-8 text-purple-600 mb-4" />
                  <h3 className="text-xl font-semibold text-purple-900 mb-2">
                    Volledige Controle
                  </h3>
                  <p className="text-purple-700">
                    Je hebt altijd volledige controle over je data. Je kunt je account verwijderen en alle data wordt permanent gewist.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <Users className="w-8 h-8 text-orange-600 mb-4" />
                  <h3 className="text-xl font-semibold text-orange-900 mb-2">
                    Transparantie
                  </h3>
                  <p className="text-orange-700">
                    We zijn volledig transparant over hoe we jouw data gebruiken. Geen verborgen tracking of data verzameling.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Wat We Verzamelen
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Essentiële Gegevens (Verplicht)
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>E-mailadres:</strong> Voor account verificatie en communicatie</li>
                  <li>• <strong>Naam:</strong> Voor persoonlijke herkenning op het platform</li>
                  <li>• <strong>Wachtwoord:</strong> Versleuteld opgeslagen voor account beveiliging</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Optionele Gegevens
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Profielfoto:</strong> Voor persoonlijke herkenning</li>
                  <li>• <strong>Locatie:</strong> Alleen als je dit expliciet toestaat voor lokale producten</li>
                  <li>• <strong>Telefoonnummer:</strong> Voor bezorging communicatie</li>
                  <li>• <strong>Adres:</strong> Alleen voor bezorging van bestellingen</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Hoe We Je Data Beschermen
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Versleuteling
                  </h3>
                  <p className="text-gray-700">
                    Alle gevoelige data wordt versleuteld met industry-standard encryptie (AES-256). 
                    Wachtwoorden worden gehashed met bcrypt.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Beveiligde Servers
                  </h3>
                  <p className="text-gray-700">
                    Onze servers draaien in beveiligde datacenters met 24/7 monitoring en 
                    regelmatige security audits.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Toegangscontrole
                  </h3>
                  <p className="text-gray-700">
                    Alleen geautoriseerd personeel heeft toegang tot systemen, en alle 
                    toegang wordt gelogd en gemonitord.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Je Rechten
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Recht op Toegang
                  </h3>
                  <p className="text-gray-700">
                    Je kunt altijd vragen om een overzicht van alle data die we van jou hebben opgeslagen.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Recht op Correctie
                  </h3>
                  <p className="text-gray-700">
                    Je kunt altijd je gegevens aanpassen of corrigeren via je profiel instellingen.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Recht op Verwijdering
                  </h3>
                  <p className="text-gray-700">
                    Je kunt je account en alle bijbehorende data permanent verwijderen.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Recht op Portabiliteit
                  </h3>
                  <p className="text-gray-700">
                    Je kunt je data exporteren in een standaard formaat voor gebruik elders.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Cookies en Tracking
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  Minimale Cookie Gebruik
                </h3>
                <p className="text-yellow-800 mb-4">
                  We gebruiken alleen essentiële cookies die nodig zijn voor de werking van de app:
                </p>
                <ul className="space-y-2 text-yellow-800">
                  <li>• <strong>Sessie cookies:</strong> Om je ingelogd te houden</li>
                  <li>• <strong>Voorkeur cookies:</strong> Voor je taal en thema instellingen</li>
                  <li>• <strong>Beveiliging cookies:</strong> Voor CSRF bescherming</li>
                </ul>
                <p className="text-yellow-800 mt-4">
                  <strong>Geen tracking cookies, advertentie cookies of analytics van derden.</strong>
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Contact
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Heb je vragen over dit privacybeleid of wil je je rechten uitoefenen? 
                  Neem dan contact met ons op:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>📧 E-mail: privacy@homecheff.nl</p>
                  <p>📱 WhatsApp: +31 6 12345678</p>
                  <p>📍 Adres: Privacy Team, HomeCheff BV, Amsterdam</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}