'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetchSessionData(sessionId);
    }
  }, [searchParams]);

  const fetchSessionData = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Betaling verwerken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Betaling succesvol!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Je bestelling is bevestigd en de verkoper is op de hoogte gesteld.
          </p>

          {/* Order Details */}
          {sessionData && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestelgegevens</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{sessionData.metadata?.productId || 'Onbekend'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Aantal:</span>
                  <span className="font-medium">{sessionData.metadata?.quantity || '1'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Levering:</span>
                  <span className="font-medium">
                    {sessionData.metadata?.deliveryMode === 'pickup' ? 'Afhalen' : 'Bezorgen'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Totaal:</span>
                  <span className="font-bold text-green-600">
                    €{((sessionData.amount_total || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Volgende stappen</h3>
            <div className="text-left space-y-2 text-blue-800">
              <p>• De verkoper ontvangt een e-mail met je bestelling</p>
              <p>• Je ontvangt een bevestigingsmail op je e-mailadres</p>
              <p>• De verkoper neemt contact met je op voor verdere afspraken</p>
              {sessionData?.metadata?.deliveryMode === 'pickup' && (
                <p>• Afhaaladres: {sessionData.metadata?.address || 'Niet opgegeven'}</p>
              )}
              {sessionData?.metadata?.deliveryMode === 'delivery' && (
                <p>• Bezorgadres: {sessionData.metadata?.address || 'Niet opgegeven'}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
            <p className="text-gray-600 mb-4">
              Heb je vragen over je bestelling? Neem contact op met de verkoper.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Bellen
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Terug naar Home
            </Button>
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              className="flex-1"
            >
              Mijn Profiel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}


