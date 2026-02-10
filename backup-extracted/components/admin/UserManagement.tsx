'use client';

import { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { useSafeFetch } from '@/hooks/useSafeFetch';
import { Users, Search, Trash2, Eye, Mail, Shield, UserCheck, UserX, UserPlus, Edit, MessageSquare, Phone, X, Info, MapPin, Building, Hash, Navigation } from 'lucide-react';
import CreateUserModal from './CreateUserModal';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  createdAt: Date;
  image: string | null;
  profileImage: string | null;
  bio: string | null;
  place: string | null;
  gender: string | null;
  interests: string[] | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  SellerProfile?: {
    companyName: string | null;
    kvk: string | null;
    btw: string | null;
  } | null;
  DeliveryProfile?: {
    homeLat: number | null;
    homeLng: number | null;
    currentLat: number | null;
    currentLng: number | null;
    isOnline: boolean;
  } | null;
}

export default function UserManagement() {
  const safeFetch = useSafeFetch();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedUserForContact, setSelectedUserForContact] = useState<User | null>(null);
  const [bulkMessageData, setBulkMessageData] = useState({
    subject: '',
    message: '',
    type: 'email'
  });
  const [isSendingBulkMessage, setIsSendingBulkMessage] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await safeFetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      if (error instanceof Error && error.message === 'Request was aborted') {
        // Component unmounted, ignore error
        return;
      }
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) return;

    try {
      const response = await safeFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        alert('Gebruiker succesvol verwijderd');
      } else {
        const errorData = await response.json();
        alert(`Fout bij verwijderen: ${errorData.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de gebruiker');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedUsers.length} gebruikers wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) return;

    try {
      const response = await safeFetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (response.ok) {
        setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
        alert(`${selectedUsers.length} gebruikers succesvol verwijderd`);
      } else {
        const errorData = await response.json();
        alert(`Fout bij bulk verwijderen: ${errorData.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de gebruikers');
    }
  };

  const handleSendEmail = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const subject = prompt('Onderwerp:');
    const message = prompt('Bericht:');
    
    if (!subject || !message) return;

    try {
      const response = await fetch('/api/admin/users/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subject,
          message,
        }),
      });

      if (response.ok) {
        alert('E-mail verzonden!');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleBulkMessage = async () => {
    if (!bulkMessageData.message.trim() || selectedUsers.length === 0) return;
    
    setIsSendingBulkMessage(true);
    try {
      const response = await fetch('/api/admin/send-bulk-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          subject: bulkMessageData.subject,
          message: bulkMessageData.message,
          type: bulkMessageData.type
        }),
      });

      if (response.ok) {
        alert(`Bericht verzonden naar ${selectedUsers.length} gebruikers!`);
        setShowBulkMessageModal(false);
        setBulkMessageData({ subject: '', message: '', type: 'email' });
        setSelectedUsers([]);
      } else {
        alert('Fout bij het verzenden van berichten');
      }
    } catch (error) {
      console.error('Error sending bulk message:', error);
      alert('Fout bij het verzenden van berichten');
    } finally {
      setIsSendingBulkMessage(false);
    }
  };

  const openBulkMessageModal = () => {
    setBulkMessageData({
      subject: `Bericht voor ${selectedUsers.length} gebruikers`,
      message: '',
      type: 'email'
    });
    setShowBulkMessageModal(true);
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    // Check username
    if (user.username?.toLowerCase().includes(query)) return true;
    
    // Check email
    if (user.email.toLowerCase().includes(query)) return true;
    
    // Check full name
    if (user.name?.toLowerCase().includes(query)) return true;
    
    // Check first name and last name separately
    if (user.name) {
      const nameParts = user.name.toLowerCase().split(' ').filter(part => part.length > 0);
      
      // Check if query matches any part of the name (first name, middle name, last name)
      if (nameParts.some(part => part.includes(query))) return true;
      
      // Check if query matches the start of any name part (for partial matches)
      if (nameParts.some(part => part.startsWith(query))) return true;
    }
    
    return false;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'SELLER': return 'bg-blue-100 text-blue-800';
      case 'BUYER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'SELLER': return <UserCheck className="w-4 h-4" />;
      case 'BUYER': return <UserX className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gebruikersbeheer</h2>
          <p className="text-gray-600">Beheer alle gebruikers van het platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nieuwe Gebruiker
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Zoek op gebruikersnaam, naam, of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={openBulkMessageModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Bericht Sturen ({selectedUsers.length})
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Verwijderen ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gebruiker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aangemaakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.image || user.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.image || user.profileImage || ''}
                            alt={getDisplayName(user)}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={user.username ? `/user/${user.username}` : `/profile/${user.id}`}
                            className="text-sm sm:text-base font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 py-1 px-1 -mx-1 rounded touch-manipulation"
                          >
                            {getDisplayName(user)}
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedUserForContact(user);
                              setShowContactModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Contactgegevens bekijken"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.username && (
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">
                        {user.role === 'ADMIN' ? 'Admin' : 
                         user.role === 'SELLER' ? 'Verkoper' : 'Koper'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1 sm:space-x-2">
                      <Link
                        href={user.username ? `/user/${user.username}` : `/profile/${user.id}`}
                        target="_blank"
                        className="p-3 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200 touch-manipulation"
                        title="Bekijk profiel"
                      >
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                      </Link>
                      <Link
                        href={`/messages?user=${user.id}`}
                        className="p-3 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors duration-200 touch-manipulation"
                        title="Bericht sturen"
                      >
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                      </Link>
                      <a
                        href={`mailto:${user.email}`}
                        className="p-3 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200 touch-manipulation"
                        title="E-mail sturen"
                      >
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                      </a>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-3 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200 touch-manipulation"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
      />

      {/* Bulk Message Modal */}
      {showBulkMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bulk Bericht Sturen
                </h3>
                <button
                  onClick={() => setShowBulkMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Naar {selectedUsers.length} geselecteerde gebruikers
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onderwerp
                </label>
                <input
                  type="text"
                  value={bulkMessageData.subject}
                  onChange={(e) => setBulkMessageData({ ...bulkMessageData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Onderwerp van het bericht"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bericht Type
                </label>
                <select
                  value={bulkMessageData.type}
                  onChange={(e) => setBulkMessageData({ ...bulkMessageData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="email">E-mail</option>
                  <option value="push">Push Notificatie</option>
                  <option value="both">Beide (E-mail + Push)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bericht
                </label>
                <textarea
                  value={bulkMessageData.message}
                  onChange={(e) => setBulkMessageData({ ...bulkMessageData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Typ je bericht hier..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleBulkMessage}
                  disabled={!bulkMessageData.message.trim() || isSendingBulkMessage}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingBulkMessage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Verzenden
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Modal */}
      {showContactModal && selectedUserForContact && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowContactModal(false)}
            ></div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedUserForContact.image || selectedUserForContact.profileImage ? (
                      <Image
                        src={selectedUserForContact.image || selectedUserForContact.profileImage || ''}
                        alt={getDisplayName(selectedUserForContact)}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-white"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {getDisplayName(selectedUserForContact)}
                      </h3>
                      <p className="text-blue-100 text-sm">Contactgegevens</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase">E-mail</p>
                    <a 
                      href={`mailto:${selectedUserForContact.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedUserForContact.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {selectedUserForContact.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Telefoonnummer</p>
                      <a 
                        href={`tel:${selectedUserForContact.phoneNumber}`}
                        className="text-sm text-blue-600 hover:underline font-mono"
                      >
                        {selectedUserForContact.phoneNumber}
                      </a>
                    </div>
                  </div>
                )}

                {/* Address */}
                {(selectedUserForContact.address || selectedUserForContact.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Adres</p>
                      <div className="text-sm text-gray-900 space-y-0.5">
                        {selectedUserForContact.address && (
                          <p>{selectedUserForContact.address}</p>
                        )}
                        {(selectedUserForContact.postalCode || selectedUserForContact.city) && (
                          <p>
                            {selectedUserForContact.postalCode} {selectedUserForContact.city}
                          </p>
                        )}
                        {selectedUserForContact.country && (
                          <p className="text-gray-600">{selectedUserForContact.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Info */}
                {selectedUserForContact.SellerProfile && (
                  <>
                    <div className="border-t border-gray-200 pt-4"></div>
                    <h4 className="text-sm font-semibold text-gray-700">Bedrijfsgegevens</h4>
                    
                    {selectedUserForContact.SellerProfile.companyName && (
                      <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase">Bedrijfsnaam</p>
                          <p className="text-sm text-gray-900">{selectedUserForContact.SellerProfile.companyName}</p>
                        </div>
                      </div>
                    )}

                    {selectedUserForContact.SellerProfile.kvk && (
                      <div className="flex items-start gap-3">
                        <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase">KVK</p>
                          <p className="text-sm text-gray-900 font-mono">{selectedUserForContact.SellerProfile.kvk}</p>
                        </div>
                      </div>
                    )}

                    {selectedUserForContact.SellerProfile.btw && (
                      <div className="flex items-start gap-3">
                        <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase">BTW</p>
                          <p className="text-sm text-gray-900 font-mono">{selectedUserForContact.SellerProfile.btw}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Location / GPS */}
                {((selectedUserForContact.lat && selectedUserForContact.lng) || 
                 (selectedUserForContact.DeliveryProfile?.currentLat && selectedUserForContact.DeliveryProfile?.currentLng)) && (
                  <>
                    <div className="border-t border-gray-200 pt-4"></div>
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">Locatie</p>
                        {selectedUserForContact.DeliveryProfile?.currentLat && selectedUserForContact.DeliveryProfile?.currentLng && (
                          <>
                            <p className="text-sm text-gray-900">
                              Live locatie: {selectedUserForContact.DeliveryProfile.currentLat.toFixed(6)}, {selectedUserForContact.DeliveryProfile.currentLng.toFixed(6)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${selectedUserForContact.DeliveryProfile.currentLat},${selectedUserForContact.DeliveryProfile.currentLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Bekijk op Google Maps →
                            </a>
                            {selectedUserForContact.DeliveryProfile.isOnline && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🟢 Online
                              </span>
                            )}
                          </>
                        )}
                        {selectedUserForContact.lat && selectedUserForContact.lng && !selectedUserForContact.DeliveryProfile?.currentLat && (
                          <>
                            <p className="text-sm text-gray-900">
                              {selectedUserForContact.lat.toFixed(6)}, {selectedUserForContact.lng.toFixed(6)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${selectedUserForContact.lat},${selectedUserForContact.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Bekijk op Google Maps →
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
