'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Trash2, Eye, Mail, Shield, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  createdAt: Date;
  image: string | null;
  profileImage: string | null;
  stripeAccountStatus: string | null;
  isBusiness: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        alert('Fout bij het verwijderen van de gebruiker');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fout bij het verwijderen van de gebruiker');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedUsers.length} gebruikers wilt verwijderen?`)) return;

    try {
      const response = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (response.ok) {
        setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
      } else {
        alert('Fout bij het verwijderen van de gebruikers');
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert('Fout bij het verwijderen van de gebruikers');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gebruikersbeheer</h2>
          <p className="text-gray-600">Beheer alle gebruikers van het platform</p>
        </div>
        {selectedUsers.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Verwijder geselecteerd ({selectedUsers.length})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Zoek gebruikers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
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
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gebruiker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stripe Status
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
                  <td className="px-6 py-4">
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
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.profileImage || user.image ? (
                          <img
                            src={user.profileImage || user.image || ''}
                            alt={user.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Geen naam'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.username && (
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'SELLER'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'ADMIN' ? 'Admin' : user.role === 'SELLER' ? 'Verkoper' : 'Koper'}
                    </span>
                    {user.isBusiness && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Bedrijf
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.stripeAccountStatus ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.stripeAccountStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.stripeAccountStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.stripeAccountStatus === 'active' ? 'Actief' : 
                         user.stripeAccountStatus === 'pending' ? 'In behandeling' : 'Niet actief'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Niet ingesteld</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`/profile?userId=${user.id}`, '_blank')}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Bekijk profiel"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`mailto:${user.email}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Stuur e-mail"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Verwijder gebruiker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gebruikers gevonden</h3>
          <p className="text-gray-500">Probeer een andere zoekterm.</p>
        </div>
      )}
    </div>
  );
}

