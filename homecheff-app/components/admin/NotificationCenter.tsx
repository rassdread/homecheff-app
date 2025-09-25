'use client';

import { useState } from 'react';
import { Send, Users, Mail, Bell, AlertCircle } from 'lucide-react';

export default function NotificationCenter() {
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      alert('Voer een bericht in');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          targetType,
        }),
      });

      if (response.ok) {
        alert('Bericht succesvol verzonden!');
        setMessage('');
      } else {
        alert('Fout bij het verzenden van het bericht');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fout bij het verzenden van het bericht');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Berichtencentrum</h2>
        <p className="text-gray-600">Stuur berichten naar gebruikers</p>
      </div>

      {/* Send Message Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSendMessage} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doelgroep
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Alle gebruikers</option>
              <option value="sellers">Alleen verkopers</option>
              <option value="buyers">Alleen kopers</option>
              <option value="active">Alleen actieve gebruikers</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bericht
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Typ je bericht hier..."
              maxLength={500}
            />
            <div className="mt-1 text-sm text-gray-500">
              {message.length}/500 karakters
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <Bell className="w-4 h-4 mr-2" />
              <span>Dit bericht wordt als notificatie verzonden</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verzenden...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Verstuur bericht
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Gebruikers</h3>
              <p className="text-sm text-gray-500">Bekijk alle gebruikers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">E-mail</h3>
              <p className="text-sm text-gray-500">Stuur e-mail naar gebruikers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Alerts</h3>
              <p className="text-sm text-gray-500">Beheer platform alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Informatie</h4>
            <p className="text-sm text-blue-800 mt-1">
              Berichten worden verzonden als notificaties naar gebruikers. 
              Gebruikers kunnen deze notificaties beheren in hun profielinstellingen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}











