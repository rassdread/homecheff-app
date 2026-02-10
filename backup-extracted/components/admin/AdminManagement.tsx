'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Edit, Save, X, Search } from 'lucide-react';
import { AVAILABLE_PERMISSIONS, ADMIN_ROLES } from '@/lib/admin-preferences';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  adminRoles: string[];
  createdAt: Date;
  profileImage: string | null;
  image: string | null;
}

interface AdminPermissions {
  id: string;
  userId: string;
  canViewRevenue: boolean;
  canViewUserDetails: boolean;
  canViewUserEmails: boolean;
  canViewProductDetails: boolean;
  canViewOrderDetails: boolean;
  canViewDeliveryDetails: boolean;
  canViewAnalytics: boolean;
  canViewSystemMetrics: boolean;
  canViewAuditLogs: boolean;
  canViewPaymentInfo: boolean;
  canViewPrivateMessages: boolean;
  canDeleteUsers: boolean;
  canEditUsers: boolean;
  canDeleteProducts: boolean;
  canEditProducts: boolean;
  canModerateContent: boolean;
  canSendNotifications: boolean;
  canManageAdminPermissions: boolean;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Partial<AdminPermissions>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  // Local state for pending role changes before save
  const [pendingRoles, setPendingRoles] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const [adminsResponse, allUsersResponse] = await Promise.all([
        fetch('/api/admin/admins'),
        fetch('/api/admin/all-users')
      ]);
      
      if (adminsResponse.ok && allUsersResponse.ok) {
        const [adminsData, allUsersData] = await Promise.all([
          adminsResponse.json(),
          allUsersResponse.json()
        ]);
        
        // Combine admins with users for role assignment
        setAdmins([...adminsData.admins, ...allUsersData.users]);
        
        // Load permissions for each admin
        const perms: Record<string, Partial<AdminPermissions>> = {};
        const allUsers = [...adminsData.admins, ...allUsersData.users];
        for (const admin of allUsers) {
          const permResponse = await fetch(`/api/admin/permissions?userId=${admin.id}`);
          if (permResponse.ok) {
            const permData = await permResponse.json();
            if (permData) perms[admin.id] = permData;
          }
        }
        setPermissions(perms);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = async (adminId: string) => {
    setEditingPermissions(adminId);
    
    // Initialize pending roles with current admin roles
    const user = admins.find(a => a.id === adminId);
    if (user) {
      setPendingRoles(prev => ({ ...prev, [adminId]: user.adminRoles || [] }));
    }
    
    // Load current permissions if not loaded
    if (!permissions[adminId]) {
      try {
        const response = await fetch(`/api/admin/permissions?userId=${adminId}`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(prev => ({ ...prev, [adminId]: data }));
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
      }
    }
  };

  const savePermissions = async (adminId: string) => {
    try {
      setSaving(adminId);
      const permData = permissions[adminId];
      
      // Save permissions
      const permResponse = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminId,
          ...permData
        })
      });

      if (!permResponse.ok) {
        alert('Fout bij opslaan van permissies');
        setSaving(null);
        return;
      }

      // Save admin roles (if pending roles exist)
      if (pendingRoles[adminId] !== undefined) {
        const roleResponse = await fetch('/api/admin/assign-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: adminId, 
            adminRoles: pendingRoles[adminId] 
          })
        });

        if (!roleResponse.ok) {
          alert('Fout bij opslaan van admin rollen');
          setSaving(null);
          return;
        }
      }

      // Reload admins to reflect changes
      await loadAdmins();
      setEditingPermissions(null);
      // Clear pending roles for this user
      setPendingRoles(prev => {
        const newPending = { ...prev };
        delete newPending[adminId];
        return newPending;
      });
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Fout bij opslaan');
    } finally {
      setSaving(null);
    }
  };

  const togglePermission = (adminId: string, permissionKey: string) => {
    setPermissions(prev => ({
      ...prev,
      [adminId]: {
        ...prev[adminId],
        [permissionKey]: !prev[adminId]?.[permissionKey as keyof AdminPermissions]
      }
    }));
  };

  const toggleAdminRole = (userId: string, adminRole: string) => {
    const currentPending = pendingRoles[userId] || [];
    
    setPendingRoles(prev => {
      const userRoles = prev[userId] || [];
      
      if (userRoles.includes(adminRole)) {
        // Remove role
        return {
          ...prev,
          [userId]: userRoles.filter(r => r !== adminRole)
        };
      } else {
        // Add role
        return {
          ...prev,
          [userId]: [...userRoles, adminRole]
        };
      }
    });
  };

  const hasAdminRole = (userId: string, role: string): boolean => {
    const pending = pendingRoles[userId];
    if (pending !== undefined) {
      return pending.includes(role);
    }
    // If not pending, check current user roles
    const user = admins.find(a => a.id === userId);
    return user?.adminRoles?.includes(role) || false;
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const viewPermissions = AVAILABLE_PERMISSIONS.filter(p => p.category === 'view');
  const actionPermissions = AVAILABLE_PERMISSIONS.filter(p => p.category === 'action');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Beheer</h2>
          <p className="text-gray-600">Beheer admin accounts, rollen en permissies</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op naam of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAdmins.map((admin) => {
            const isEditing = editingPermissions === admin.id;
            const currentPerms = permissions[admin.id] || {};

            return (
              <div key={admin.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      {admin.role === 'SUPERADMIN' ? (
                        <Shield className="w-6 h-6 text-red-600" />
                      ) : (
                        <Shield className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{admin.name || 'Admin'}</h3>
                        {admin.role === 'SUPERADMIN' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            SUPERADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-xs text-gray-500">
                        Admin sinds {new Date(admin.createdAt).toLocaleDateString('nl-NL')}
                        {admin.adminRoles && admin.adminRoles.length > 0 && (
                          <span className="ml-2">
                            • Rollen: {admin.adminRoles.map(r => r.replace('_', ' ')).join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => startEditing(admin.id)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Permissies Bewerken
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingPermissions(null);
                            // Clear pending roles for this user
                            setPendingRoles(prev => {
                              const newPending = { ...prev };
                              delete newPending[admin.id];
                              return newPending;
                            });
                          }}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Annuleren
                        </button>
                        <button
                          onClick={() => savePermissions(admin.id)}
                          disabled={saving === admin.id}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving === admin.id ? 'Opslaan...' : 'Opslaan'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 space-y-6 border-t pt-6">
                    {/* Admin Roles Assignment */}
                    {admin.role !== 'SUPERADMIN' && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Admin Rollen Toekennen</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ADMIN_ROLES.map((role) => {
                            const hasRole = hasAdminRole(admin.id, role);
                            return (
                              <div key={role} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{role.replace('_', ' ')}</p>
                                </div>
                                <button
                                  onClick={() => toggleAdminRole(admin.id, role)}
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                    hasRole ? 'bg-emerald-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      hasRole ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* View Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Bekijken Permissies</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewPermissions.map((perm) => {
                          const key = perm.id as keyof AdminPermissions;
                          const value = currentPerms[key] ?? true;
                          return (
                            <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                                <p className="text-xs text-gray-500">{perm.description}</p>
                              </div>
                              <button
                                onClick={() => togglePermission(admin.id, perm.id)}
                                type="button"
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                  value ? 'bg-emerald-600' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    value ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Actie Permissies</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {actionPermissions.map((perm) => {
                          const key = perm.id as keyof AdminPermissions;
                          const value = currentPerms[key] ?? true;
                          return (
                            <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                                <p className="text-xs text-gray-500">{perm.description}</p>
                              </div>
                              <button
                                onClick={() => togglePermission(admin.id, perm.id)}
                                type="button"
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                  value ? 'bg-emerald-600' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    value ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredAdmins.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Geen admins gevonden</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

