'use client';

import { useState } from 'react';
import { RefreshCw, Database, CheckCircle, AlertCircle } from 'lucide-react';

export default function MigrateOrdersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMigrate = async (dryRun: boolean = false) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, limit: 100 })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error migrating orders:', error);
      setResult({
        success: false,
        error: 'Failed to migrate orders'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migreer Bestaande Bestellingen
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Creëer transactions en payouts voor bestaande bestellingen zonder financial tracking
          </p>
        </div>
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message || result.error}
              </p>
              {result.results && (
                <div className="mt-2 text-sm space-y-1">
                  <p>Verwerkt: {result.results.processed}</p>
                  <p>Aangemaakt: {result.results.created}</p>
                  <p>Overgeslagen: {result.results.skipped}</p>
                  {result.results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Fouten:</p>
                      <ul className="list-disc list-inside">
                        {result.results.errors.slice(0, 5).map((error: string, i: number) => (
                          <li key={i} className="text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleMigrate(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Test Run (Dry Run)
        </button>
        <button
          onClick={() => handleMigrate(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50"
        >
          <Database className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Migreren...' : 'Migreer Nu'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        ⚠️ Let op: Dit proces verwerkt maximaal 100 orders per keer. Herhaal indien nodig voor meer orders.
      </p>
    </div>
  );
}




