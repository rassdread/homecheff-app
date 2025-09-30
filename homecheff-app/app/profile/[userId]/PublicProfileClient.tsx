'use client';

import { useState, Suspense, useEffect } from 'react';
import { Settings, Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, Edit3, User, Shield, Bell } from 'lucide-react';
import Link from 'next/link';

import MyDishesManager from '@/components/profile/MyDishesManager';
import OrderList from '@/components/profile/OrderList';
import FollowsList from '@/components/profile/FollowsList';
import WorkspacePhotosDisplay from '@/components/profile/WorkspacePhotosDisplay';
import PublicFollowsList from '@/components/profile/PublicFollowsList';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  quote?: string;
  place?: string;
  gender?: string;
  interests?: string[];
  buyerTypes?: string[];
  selectedBuyerType?: string;
  image?: string;
  profileImage?: string;
  role: string;
  emailVerified?: Date | null;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
  sellerRoles?: string[];
  buyerRoles?: string[];
  displayFullName?: boolean;
  displayNameOption?: 'full' | 'first' | 'last' | 'username';
  showProfileToEveryone?: boolean;
  showOnlineStatus?: boolean;
  fanRequestEnabled?: boolean;
  createdAt: Date;
}

interface ProfileStats {
  items: number;
  dishes: number;
  products: number;
  followers: number;
  following: number;
  favorites: number;
  orders: number;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  role?: string;
}

interface PublicProfileClientProps {
  user: User;
  openNewProducts: boolean;
  isOwnProfile?: boolean;
}

export default function PublicProfileClient({ user, openNewProducts, isOwnProfile = false }: PublicProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? user?.image ?? null);
  const [stats, setStats] = useState<ProfileStats>({
    items: 0,
    dishes: 0,
    products: 0,
    followers: 0,
    following: 0,
    favorites: 0,
    orders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Get display name based on user preferences
  const getDisplayName = () => {
    if (!user.displayFullName) return user.username || 'Gebruiker';
    
    switch (user.displayNameOption) {
      case 'first':
        return user.name?.split(' ')[0] || user.username || 'Gebruiker';
      case 'last':
        return user.name?.split(' ').pop() || user.username || 'Gebruiker';
      case 'username':
        return `@${user.username || 'gebruiker'}`;
      case 'full':
      default:
        return user.name || user.username || 'Gebruiker';
    }
  };

  // Get tabs based on user roles
  const getTabs = (): Tab[] => {
    const baseTabs: Tab[] = [
      { id: 'overview', label: 'Overzicht', icon: User },
    ];

    const sellerRoles = user.sellerRoles || [];
    const roleSpecificTabs: Tab[] = [];

    // Add role-specific tabs
    if (sellerRoles.includes('chef')) {
      roleSpecificTabs.push({ id: 'dishes-chef', label: 'Mijn Keuken', icon: Plus, role: 'chef' });
    }
    if (sellerRoles.includes('garden')) {
      roleSpecificTabs.push({ id: 'dishes-garden', label: 'Mijn Tuin', icon: Plus, role: 'garden' });
    }
    if (sellerRoles.includes('designer')) {
      roleSpecificTabs.push({ id: 'dishes-designer', label: 'Mijn Atelier', icon: Plus, role: 'designer' });
    }

    // Add workspace tab if user has seller roles
    if (sellerRoles.length > 0) {
      baseTabs.push({ id: 'workspace', label: 'Werkruimte', icon: Grid });
    }

    // Add other tabs
    baseTabs.push(
      { id: 'follows', label: 'Fan van', icon: Heart }
    );

    return [...baseTabs, ...roleSpecificTabs];
  };

  const tabs = getTabs();

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(`/api/profile/stats?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-200">
              <img
                src={profileImage || "/avatar-placeholder.png"}
                alt="Profielfoto"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getDisplayName()}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>@{user.username || 'gebruiker'}</span>
                {user.place && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.place}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quote */}
            {user.quote && (
              <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <blockquote className="text-gray-700 italic leading-relaxed">
                  "{user.quote}"
                </blockquote>
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 mb-4 leading-relaxed">{user.bio}</p>
            )}

            {/* Roles */}
            <div className="flex flex-wrap gap-2 mb-4">
              {user.sellerRoles?.map(role => (
                <span
                  key={role}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                >
                  {role === 'chef' ? 'Chef' : role === 'garden' ? 'Tuinier' : role === 'designer' ? 'Designer' : role}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" />
                <span>{stats.items} items</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{stats.followers} fans</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{stats.following} fans</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <div className="flex-shrink-0">
              <Link 
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Bewerk Profiel
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verkochte Producten</h2>
              <Suspense fallback={<div>Laden...</div>}>
                <MyDishesManager 
                  userId={user.id}
                  role="overview"
                  isPublic={true}
                  showOnlyActive={true}
                />
              </Suspense>
            </div>
          )}

          {/* Workspace Tab */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <Suspense fallback={<div>Laden...</div>}>
                <WorkspacePhotosDisplay 
                  userId={user.id}
                  userRoles={user.sellerRoles || []}
                />
              </Suspense>
            </div>
          )}

          {/* Role-specific tabs */}
          {tabs.filter(tab => tab.id.startsWith('dishes-')).map((tab) => (
            activeTab === tab.id && (
              <div key={tab.id} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{tab.label}</h2>
                <Suspense fallback={<div>Laden...</div>}>
                  <MyDishesManager 
                    userId={user.id}
                    role={tab.role}
                    isPublic={true}
                    showOnlyActive={false}
                  />
                </Suspense>
              </div>
            )
          ))}


          {/* Follows Tab */}
          {activeTab === 'follows' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fan van</h2>
              <Suspense fallback={<div>Laden...</div>}>
                <PublicFollowsList userId={user.id} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
