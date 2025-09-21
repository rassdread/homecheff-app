'use client';
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft, Package, CreditCard } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams?.get('payment_id');
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      // Hier zou je de betaling details ophalen
      // Voor nu simuleren we een succesvolle betaling
      setTimeout(() => {
        setPayment({
          id: paymentId,
          amount: 25.99,
          productTitle: "Huisgemaakte Pasta",
          sellerName: "Maria's Kitchen",
          status: "completed",
          completedAt: new Date().toISOString(),
        });
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [paymentId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Betaling verwerken...</p>
        </div>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Betaling niet gevonden</h1>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            Betaling succesvol!
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            Je betaling is verwerkt en de verkoper is op de hoogte gesteld.
          </p>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Betaling Details</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-600">Product:</span>
                <span className="font-medium">{payment.productTitle}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-600">Verkoper:</span>
                <span className="font-medium">{payment.sellerName}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-600">Bedrag:</span>
                <span className="font-semibold text-lg">€{payment.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-600">Status:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  Voltooid
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-neutral-600">Datum:</span>
                <span className="font-medium">
                  {new Date(payment.completedAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Wat gebeurt er nu?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <p className="text-blue-800">De verkoper ontvangt een melding van je bestelling</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <p className="text-blue-800">Je ontvangt een bevestigingsmail met alle details</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <p className="text-blue-800">De verkoper neemt contact met je op voor levering/afhaling</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            >
              <Package className="w-5 h-5" />
              Bekijk meer producten
            </Link>
            <Link
              href="/profile"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors font-semibold"
            >
              <CreditCard className="w-5 h-5" />
              Mijn bestellingen
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Laden...</p>
        </div>
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}


