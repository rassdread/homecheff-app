'use client';

import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, Key, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface MessageEncryptionProps {
  messageId: string;
  isEncrypted: boolean;
  onEncrypt: (messageId: string, key: string) => Promise<void>;
  onDecrypt: (messageId: string, key: string) => Promise<string>;
}

// Generate a secure random key
function generateSecureKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function MessageEncryption({ 
  messageId, 
  isEncrypted, 
  onEncrypt, 
  onDecrypt 
}: MessageEncryptionProps) {
  const { t } = useTranslation();
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [useAutoKey, setUseAutoKey] = useState(true);
  const [generatedKey, setGeneratedKey] = useState('');

  const handleEncrypt = async () => {
    let keyToUse = encryptionKey;
    
    // If using auto-generated key, generate it now
    if (useAutoKey) {
      keyToUse = generateSecureKey();
      setGeneratedKey(keyToUse);
    } else if (!encryptionKey.trim()) {
      setError('Voer een encryptie sleutel in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onEncrypt(messageId, keyToUse);
      
      if (!useAutoKey) {
        setEncryptionKey('');
      }
      // Don't hide input if auto-key was used (user needs to see/save the key)
      if (!useAutoKey) {
        setShowKeyInput(false);
      }
    } catch (err) {
      setError('Encryptie mislukt. Probeer opnieuw.');
      setGeneratedKey('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickEncrypt = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const autoKey = generateSecureKey();
      setGeneratedKey(autoKey);
      await onEncrypt(messageId, autoKey);
      setShowKeyInput(true); // Show the generated key
    } catch (err) {
      setError('Encryptie mislukt. Probeer opnieuw.');
      setGeneratedKey('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyKeyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      alert(t('errors.keyCopied'));
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
                placeholder={t('common.decryptionKey')}
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
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <Unlock className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-blue-800">Bericht is niet versleuteld</span>
      </div>
      
      {/* Quick encrypt button */}
      <div className="flex gap-2">
        <button
          onClick={handleQuickEncrypt}
          disabled={isLoading || generatedKey !== ''}
          className="flex-1 flex items-center justify-center gap-2 text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
        >
          <Shield className="w-3 h-3" />
          {isLoading ? 'Bezig...' : 'Automatisch Versleutelen'}
        </button>
        
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
        >
          <Key className="w-3 h-3" />
        </button>
      </div>
      
      {/* Show generated key */}
      {generatedKey && (
        <div className="p-2 bg-yellow-50 border border-yellow-300 rounded space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-800">Bericht versleuteld!</span>
          </div>
          <p className="text-xs text-yellow-700">
            Bewaar deze sleutel veilig. Je hebt het nodig om het bericht te ontsleutelen:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={generatedKey}
              readOnly
              className="flex-1 text-xs px-2 py-1 bg-white border border-yellow-300 rounded font-mono"
            />
            <button
              onClick={copyKeyToClipboard}
              className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
            >
              Kopiëren
            </button>
          </div>
        </div>
      )}
      
      {/* Manual key input */}
      {showKeyInput && !generatedKey && (
        <div className="space-y-2 p-2 bg-white rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useAutoKey}
              onChange={(e) => setUseAutoKey(e.target.checked)}
              id="auto-key"
              className="w-3 h-3"
            />
            <label htmlFor="auto-key" className="text-xs text-gray-700">
              Automatische sleutel genereren (aanbevolen)
            </label>
          </div>
          
          {!useAutoKey && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder={t('common.enterOwnKey')}
                  className="w-full text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                >
                  {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={handleEncrypt}
            disabled={isLoading}
            className="w-full text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Bezig...' : 'Versleutelen'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
