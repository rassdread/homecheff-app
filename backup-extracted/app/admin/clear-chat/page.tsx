'use client';

import { useState } from 'react';

export default function ClearChatPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleClear = async () => {
    if (!confirm('Weet je ZEKER dat je ALLE berichten wilt wissen? Dit kan niet ongedaan worden!')) {
      return;
    }

    setIsClearing(true);
    setResult('Berichten wissen...');

    try {
      const response = await fetch('/api/admin/clear-messages', {
        method: 'DELETE'
      });

      if (response.ok) {
        setResult('✅ Alle berichten succesvol gewist!');
      } else {
        throw new Error('Failed to clear messages');
      }
    } catch (error) {
      setResult('❌ Fout bij wissen van berichten');
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🗑️ Wis Alle Berichten
        </h1>
        
        <p className="text-gray-600 mb-6">
          Dit wist ALLE berichten uit de database voor een clean start.
        </p>

        <button
          onClick={handleClear}
          disabled={isClearing}
          className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isClearing ? 'Bezig met wissen...' : 'Wis Alle Berichten'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm">{result}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <a
            href="/messages"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            ← Terug naar berichten
          </a>
        </div>
      </div>
    </div>
  );
}

