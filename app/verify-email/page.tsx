"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Mail, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

type VerificationState = {
  status: 'loading' | 'success' | 'error' | 'expired' | 'pending';
  message: string;
  email?: string;
  canResend: boolean;
  isResending: boolean;
};

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const email = searchParams?.get('email');
  
  const [state, setState] = useState<VerificationState>({
    status: 'pending',
    message: '',
    email: email || '',
    canResend: false,
    isResending: false
  });

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setState(prev => ({ ...prev, status: 'loading', message: 'E-mailadres wordt geverifieerd...' }));
    
    try {
      const response = await fetch(`/api/auth/verify-email-simple?token=${verificationToken}`);

      const data = await response.json();

      if (response.ok && data.success) {
        setState({
          status: 'success',
          message: data.message,
          email: data.user?.email || email,
          canResend: false,
          isResending: false
        });
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setState({
          status: 'error',
          message: data.error || 'Verificatie mislukt',
          email: email || '',
          canResend: true,
          isResending: false
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setState({
        status: 'error',
        message: 'Er is een fout opgetreden bij het verifiëren van je e-mailadres',
        email: email || '',
        canResend: true,
        isResending: false
      });
    }
  };

  const resendVerification = async () => {
    if (!state.email) {
      setState(prev => ({ ...prev, message: 'E-mailadres is vereist voor het opnieuw verzenden' }));
      return;
    }

    setState(prev => ({ ...prev, isResending: true, message: 'Verificatie-e-mail wordt opnieuw verzonden...' }));
    
    try {
      const response = await fetch('/api/auth/resend-verification-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: state.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState(prev => ({
          ...prev,
          status: 'pending',
          message: data.message,
          canResend: false,
          isResending: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          message: data.error || 'Fout bij het opnieuw verzenden van de verificatie-e-mail',
          isResending: false
        }));
      }
    } catch (error) {
      console.error('Resend error:', error);
      setState(prev => ({
        ...prev,
        message: 'Er is een fout opgetreden bij het opnieuw verzenden van de verificatie-e-mail',
        isResending: false
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, email: e.target.value }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {state.status === 'success' ? (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              ) : state.status === 'error' || state.status === 'expired' ? (
                <AlertCircle className="w-8 h-8 text-red-600" />
              ) : (
                <Mail className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {state.status === 'success' ? 'E-mail Geverifieerd!' : 
               state.status === 'error' || state.status === 'expired' ? 'Verificatie Mislukt' :
               'E-mail Verificatie'}
            </h1>
            <p className="text-gray-600">
              {state.status === 'success' ? 'Je account is nu volledig actief!' :
               state.status === 'error' || state.status === 'expired' ? 'Er is iets misgegaan' :
               'Controleer je e-mail voor de verificatielink'}
            </p>
          </div>

          {/* Status Message */}
          {state.message && (
            <div className={`mb-6 p-4 rounded-xl ${
              state.status === 'success' ? 'bg-green-50 border border-green-200' :
              state.status === 'error' || state.status === 'expired' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {state.status === 'loading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                )}
                <p className={`text-sm ${
                  state.status === 'success' ? 'text-green-800' :
                  state.status === 'error' || state.status === 'expired' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {state.message}
                </p>
              </div>
            </div>
          )}

          {/* Email Input for Resend */}
          {state.canResend && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                value={state.email}
                onChange={handleEmailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="je@email.com"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {state.status === 'success' && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Je wordt automatisch doorgestuurd naar de homepage...
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  Naar Homepage
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}

            {state.status === 'error' || state.status === 'expired' ? (
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  disabled={state.isResending || !state.email}
                  className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {state.isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Verificatie-e-mail Opnieuw Verzenden
                    </>
                  )}
                </button>
                
                <Link
                  href="/login"
                  className="block w-full text-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Terug naar Inloggen
                </Link>
              </div>
            ) : state.status === 'pending' && !token ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  We hebben een verificatie-e-mail gestuurd naar je e-mailadres.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={resendVerification}
                    disabled={state.isResending || !state.email}
                    className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {state.isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verzenden...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Verificatie-e-mail Opnieuw Verzenden
                      </>
                    )}
                  </button>
                  
                  <Link
                    href="/login"
                    className="block w-full text-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Terug naar Inloggen
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Hulp nodig?</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Controleer je spam/junk folder</li>
              <li>• Verificatielinks zijn 24 uur geldig</li>
              <li>• Neem contact op via <a href="mailto:support@homecheff.nl" className="text-emerald-600 hover:text-emerald-700">support@homecheff.nl</a></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
