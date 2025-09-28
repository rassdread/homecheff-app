'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setMessage({ type: 'success', text: 'Account succesvol verwijderd. Je wordt doorgestuurd naar de homepage.' });
        setTimeout(() => {
          onAccountDeleted();
          window.location.href = '/';
        }, 2000);
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

  if (!showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Account Verwijderen
              </h3>
              <p className="text-red-800 mb-4">
                Dit is een permanente actie. Je account en alle bijbehorende gegevens worden 
                definitief verwijderd en kunnen niet worden hersteld.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Wat wordt er verwijderd?</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Je profiel en persoonlijke gegevens
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Alle producten en listings
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Bestellingen en transactiegeschiedenis
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Berichten en conversaties
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Reviews en beoordelingen
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Favorieten en volgrelaties
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Alternatieven</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              Overweeg eerst om je account tijdelijk te deactiveren in plaats van te verwijderen. 
              Je kunt altijd contact opnemen met onze support voor hulp.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          Account Verwijderen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Laatste Waarschuwing
            </h3>
            <p className="text-red-800 mb-4">
              Je staat op het punt om je account permanent te verwijderen. Deze actie kan niet ongedaan worden gemaakt.
            </p>
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ "VERWIJDEREN" om te bevestigen
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="VERWIJDEREN"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Je wachtwoord
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Voer je wachtwoord in"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirmation(false)}
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
              Definitief Verwijderen
            </>
          )}
        </button>
      </div>
    </div>
  );
}
