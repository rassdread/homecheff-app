'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function ClearChatClient() {
  const { t } = useTranslation();
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [reason, setReason] = useState('');

  const handleClear = async () => {
    if (!reason.trim()) {
      alert('Reason is required for this destructive action.');
      return;
    }

    if (
      !confirm(
        'SUPERADMIN ONLY: This permanently deletes ALL messages. Type OK in the next prompt to continue.',
      )
    ) {
      return;
    }

    const typed = prompt('Type DELETE ALL MESSAGES to confirm');
    if (typed !== 'DELETE ALL MESSAGES') return;

    setIsClearing(true);
    setResult(t('common.clearingMessages'));

    try {
      const response = await fetch('/api/admin/clear-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(
          `${t('common.messagesClearedSuccess')} (${data.deletedCount ?? 0} messages)`,
        );
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed');
      }
    } catch (error) {
      setResult(t('errors.clearMessagesError'));
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border-2 border-red-200">
        <p className="text-xs font-semibold text-red-700 uppercase mb-2">Superadmin danger zone</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('common.clearAllMessages')}
        </h1>

        <p className="text-gray-600 mb-4 text-sm">{t('common.clearAllMessagesDescription')}</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (required)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm mb-4"
          rows={3}
          placeholder="Why is this wipe necessary?"
        />

        <button
          onClick={handleClear}
          disabled={isClearing || !reason.trim()}
          className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isClearing ? t('common.clearingMessages') : t('common.clearAllMessages')}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm">{result}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <Link href="/admin?domain=platform&tab=settings" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to admin
          </Link>
        </div>
      </div>
    </div>
  );
}
