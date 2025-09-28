'use client';

import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface MessageEncryptionProps {
  messageId: string;
  isEncrypted: boolean;
  onEncrypt: (messageId: string, key: string) => Promise<void>;
  onDecrypt: (messageId: string, key: string) => Promise<string>;
}

export default function MessageEncryption({ 
  messageId, 
  isEncrypted, 
  onEncrypt, 
  onDecrypt 
}: MessageEncryptionProps) {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleEncrypt = async () => {
    if (!encryptionKey.trim()) {
      setError('Voer een encryptie sleutel in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onEncrypt(messageId, encryptionKey);
      setEncryptionKey('');
      setShowKeyInput(false);
    } catch (err) {
      setError('Encryptie mislukt. Probeer opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptionKey.trim()) {
      setError('Voer de decryptie sleutel in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const decryptedText = await onDecrypt(messageId, encryptionKey);
      // The parent component should handle displaying the decrypted text
      setEncryptionKey('');
      setShowKeyInput(false);
    } catch (err) {
      setError('Decryptie mislukt. Controleer de sleutel.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEncrypted) {
    return (
      <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Lock className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">Bericht is versleuteld</span>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
        >
          {showKeyInput ? 'Annuleren' : 'Ontsleutelen'}
        </button>
        
        {showKeyInput && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                placeholder="Decryptie sleutel"
                className="text-xs px-2 py-1 border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            <button
              onClick={handleDecrypt}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
            >
              {isLoading ? '...' : 'Ontsleutelen'}
            </button>
          </div>
        )}
        
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <Unlock className="w-4 h-4 text-blue-600" />
      <span className="text-sm text-blue-800">Bericht is niet versleuteld</span>
      <button
        onClick={() => setShowKeyInput(!showKeyInput)}
        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
      >
        {showKeyInput ? 'Annuleren' : 'Versleutelen'}
      </button>
      
      {showKeyInput && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="Encryptie sleutel"
              className="text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
          <button
            onClick={handleEncrypt}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            {isLoading ? '...' : 'Versleutelen'}
          </button>
        </div>
      )}
      
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
