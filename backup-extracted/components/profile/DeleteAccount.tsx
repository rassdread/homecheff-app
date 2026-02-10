'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, AlertTriangle, Shield, CheckCircle, XCircle, Download, Clock, Lock, Database, Users, MessageSquare, Star, Heart, Camera, Settings } from 'lucide-react';

interface DeleteAccountProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  onAccountDeleted: () => void;
}

export default function DeleteAccount({ user, onAccountDeleted }: DeleteAccountProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dataExportRequested, setDataExportRequested] = useState(false);
  const confirmationInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentStep === 3) {
      const focusTimer = setTimeout(() => {
        if (confirmationInputRef.current) {
          confirmationInputRef.current.focus();
          confirmationInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      return () => clearTimeout(focusTimer);
    }
  }, [currentStep]);

  const handleDataExport = async () => {
    setDataExportRequested(true);
    // In een echte implementatie zou je hier een API call maken om data te exporteren
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Data export is gestart. Je ontvangt een email met je gegevens.' });
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'VERWIJDEREN') {
      setMessage({ type: 'error', text: 'Je moet "VERWIJDEREN" typen om je account te verwijderen' });
      return;
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Wachtwoord is verplicht' });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          confirmationText
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Account succesvol verwijderd. Je wordt uitgelogd en doorgestuurd naar de homepage.' });
        
        // Clear all local storage and session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Sign out from NextAuth
        setTimeout(async () => {
          try {
            const { signOut } = await import('next-auth/react');
            await signOut({ 
              callbackUrl: '/',
              redirect: true 
            });
          } catch (error) {
            console.error('Error signing out:', error);
            // Force redirect even if signOut fails
            window.location.href = '/';
          }
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Er is een fout opgetreden bij het verwijderen van je account' });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Er is een fout opgetreden. Probeer het opnieuw.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderDataOverview();
      case 2:
        return renderDataExport();
      case 3:
        return renderFinalConfirmation();
      default:
        return renderDataOverview();
    }
  };

  const renderDataOverview = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verwijderen</h2>
          <p className="text-gray-600">Voordat je je account verwijdert, bekijk wat er verloren gaat</p>
        </div>

        {/* Data Overview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Je opgeslagen gegevens
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900">Profiel & Account</div>
                  <div className="text-sm text-gray-500">Naam, email, foto's, bio</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Camera className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900">Producten & Content</div>
                  <div className="text-sm text-gray-500">Items, foto's, recepten, projecten</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900">Communicatie</div>
                  <div className="text-sm text-gray-500">Berichten, conversaties</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="font-medium text-gray-900">Reviews & Beoordelingen</div>
                  <div className="text-sm text-gray-500">Ontvangen en gegeven reviews</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <div className="font-medium text-gray-900">Sociale Connecties</div>
                  <div className="text-sm text-gray-500">Favorieten, volgrelaties</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Settings className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Instellingen</div>
                  <div className="text-sm text-gray-500">Voorkeuren, notificaties</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Permanent verwijderd</h4>
              <p className="text-red-800 text-sm">
                Alle gegevens worden permanent en onomkeerbaar verwijderd. 
                Deze actie kan niet ongedaan worden gemaakt.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(2)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Data Exporteren
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Verder met Verwijderen
          </button>
        </div>
      </div>
    );
  };

  const renderDataExport = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Exporteren</h2>
          <p className="text-gray-600">Download een kopie van je gegevens voordat je je account verwijdert</p>
        </div>

        {/* Export Options */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wat wordt geëxporteerd?</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Je profielgegevens en instellingen
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Alle producten en bijbehorende foto's
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Berichten en conversaties
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Reviews en beoordelingen
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Werkruimte content (recepten, projecten)
            </li>
          </ul>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Terug
          </button>
          <button
            onClick={handleDataExport}
            disabled={dataExportRequested}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {dataExportRequested ? 'Export Gestart...' : 'Data Exporteren'}
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Verder met Verwijderen
          </button>
        </div>
      </div>
    );
  };

  const renderFinalConfirmation = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Laatste Bevestiging</h2>
          <p className="text-gray-600">Je staat op het punt je account permanent te verwijderen</p>
        </div>

        {/* Final Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Dit kan niet ongedaan worden gemaakt</h3>
              <p className="text-red-800 text-sm mb-4">
                Alle gegevens worden permanent verwijderd en kunnen niet worden hersteld. 
                Zorg ervoor dat je een backup hebt gemaakt als je je gegevens wilt bewaren.
              </p>
              <div className="bg-red-100 border border-red-300 rounded p-3">
                <p className="text-red-800 font-medium text-sm">
                  <strong>Account:</strong> {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Confirmation Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ "VERWIJDEREN" om te bevestigen
            </label>
            <input
              type="text"
              ref={confirmationInputRef}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="VERWIJDEREN"
              className="w-full px-3 py-3 border border-red-200 bg-white rounded-lg text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Dit is een extra beveiligingscontrole. Gebruik hoofdletters: <span className="font-semibold">VERWIJDEREN</span>.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Je wachtwoord
            </label>
            <input
              type="password"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Voer je wachtwoord in"
              className="w-full px-3 py-3 border border-gray-300 bg-white rounded-lg text-base focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              We vragen je wachtwoord om zeker te weten dat jij deze actie uitvoert.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isDeleting}
          >
            Annuleren
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmationText !== 'VERWIJDEREN' || !password}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verwijderen...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Account Definitief Verwijderen
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-8 h-0.5 ml-2 ${
                currentStep > step ? 'bg-red-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
