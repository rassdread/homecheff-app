'use client';

import React, { useState } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { Search, User, Mail, Phone, MapPin, Copy, Eye, EyeOff, Shield, Building, Hash } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

interface UserContactInfo {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  profileImage: string | null;
  role: string;
  createdAt: string;
  // Bank info now handled via Stripe
  // Business info (via SellerProfile relation)
  SellerProfile?: {
    companyName: string | null;
    kvk: string | null;
    btw: string | null;
  } | null;
}

export default function AdminUserContact() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserContactInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserContactInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/user-contact?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        if (data.users.length === 1) {
          setSelectedUser(data.users[0]);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} gekopieerd naar klembord!`);
  };

  const maskSensitiveData = (data: string | null) => {
    if (!data || showSensitiveData) return data || '-';
    return '•'.repeat(Math.min(data.length, 12));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6" />
          Gebruiker Contactgegevens
        </h2>
        <p className="text-gray-600">{t('admin.searchUsersContactInfo')}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('common.searchByNameUsernameEmail')}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {isSearching ? 'Zoeken...' : 'Zoeken'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedUser && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Zoekresultaten ({searchResults.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.name || getDisplayName(user)}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{getDisplayName(user)}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'SELLER' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected User Details */}
      {selectedUser && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedUser.profileImage ? (
                <Image
                  src={selectedUser.profileImage}
                  alt={getDisplayName(selectedUser)}
                  width={64}
                  height={64}
                  className="rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{selectedUser.name || selectedUser.username}</h3>
                <p className="text-blue-100">@{getDisplayName(selectedUser)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                title={showSensitiveData ? 'Verberg gevoelige data' : 'Toon gevoelige data'}
              >
                {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSensitiveData ? 'Verberg' : 'Toon'}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Basis Informatie</h4>
              
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">E-mail</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{selectedUser.email}</p>
                    <button
                      onClick={() => copyToClipboard(selectedUser.email, 'Email')}
                      className="p-1 hover:bg-gray-100 rounded"
                      title={t('common.copyEmail')}
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {selectedUser.phoneNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Telefoonnummer</p>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 font-mono">{maskSensitiveData(selectedUser.phoneNumber)}</p>
                      {showSensitiveData && (
                        <button
                          onClick={() => copyToClipboard(selectedUser.phoneNumber!, 'Telefoonnummer')}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={t('common.copyNumber')}
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Rol</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full mt-1 ${
                    selectedUser.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    selectedUser.role === 'SELLER' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Lid sinds</p>
                  <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString('nl-NL')}</p>
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Adresgegevens</h4>
              
              {selectedUser.address || selectedUser.city ? (
                <>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Adres</p>
                      <div className="text-gray-900 space-y-1">
                        {selectedUser.address && (
                          <p>{showSensitiveData ? selectedUser.address : '•'.repeat(20)}</p>
                        )}
                        {(selectedUser.postalCode || selectedUser.city) && (
                          <p>
                            {showSensitiveData ? (
                              <>
                                {selectedUser.postalCode} {selectedUser.city}
                              </>
                            ) : (
                              '•••• ••'
                            )}
                          </p>
                        )}
                        {selectedUser.country && (
                          <p className="text-sm text-gray-600">{selectedUser.country}</p>
                        )}
                      </div>
                      {showSensitiveData && selectedUser.address && (
                        <button
                          onClick={() => copyToClipboard(
                            `${selectedUser.address}, ${selectedUser.postalCode} ${selectedUser.city}, ${selectedUser.country}`,
                            'Adres'
                          )}
                          className="mt-2 p-1 hover:bg-gray-100 rounded inline-flex items-center gap-1 text-sm text-gray-600"
                        >
                          <Copy className="w-3 h-3" />
                          Kopieer volledig adres
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">{t('admin.noAddressDataAvailable')}</p>
              )}

              {/* Business Info (if seller) */}
              {selectedUser.SellerProfile && (
                <>
                  <h4 className="font-semibold text-gray-900 border-b pb-2 pt-4">Bedrijfsgegevens</h4>
                  
                  {selectedUser.SellerProfile?.companyName && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Bedrijfsnaam</p>
                        <p className="text-gray-900">{selectedUser.SellerProfile.companyName}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.SellerProfile?.kvk && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">KVK Nummer</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-mono">{maskSensitiveData(selectedUser.SellerProfile.kvk)}</p>
                          {showSensitiveData && (
                            <button
                              onClick={() => copyToClipboard(selectedUser.SellerProfile!.kvk!, 'KVK')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedUser.SellerProfile?.btw && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">BTW Nummer</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-mono">{maskSensitiveData(selectedUser.SellerProfile.btw)}</p>
                          {showSensitiveData && (
                            <button
                              onClick={() => copyToClipboard(selectedUser.SellerProfile!.btw!, 'BTW')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Payment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Uitbetalingen via Stripe</h4>
                    <p className="text-sm text-blue-700">
                      Bankgegevens worden veilig beheerd via Stripe Connect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Privacywaarschuwing</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Deze gegevens zijn vertrouwelijk en mogen alleen worden gebruikt voor administratieve doeleinden. 
                  Misbruik van deze informatie is strafbaar volgens de AVG/GDPR wetgeving.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !isSearching && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen resultaten</h3>
          <p className="text-gray-600">
            Geen gebruikers gevonden voor "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}

