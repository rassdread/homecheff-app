'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDisplayName } from '@/lib/displayName';
import { 
  User, 
  Settings, 
  Edit3, 
  Save, 
  X, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Globe, 
  Heart, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Shield,
  Eye,
  MessageCircle,
  Star,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Share2,
  Download,
  Upload,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import PhotoUploader from '@/components/profile/PhotoUploader';
import ProfileSettings from '@/components/profile/ProfileSettings';
import FansAndFollowsList from '@/components/FansAndFollowsList';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  bio: string | null;
  quote: string | null;
  place: string | null;
  gender: string | null;
  interests: string[];
  profileImage: string | null;
  role: string;
  sellerRoles: string[];
  buyerRoles: string[];
  displayFullName: boolean;
  displayNameOption: string;
  showFansList: boolean;
  encryptionEnabled: boolean;
  messageGuidelinesAccepted: boolean;
  messageGuidelinesAcceptedAt: Date | null;
  createdAt: Date;
  profileViews: number;
  updatedAt: Date;
  emailVerified: Date | null;
  SellerProfile?: {
    id: string;
    companyName: string | null;
    kvk: string | null;
    btw: string | null;
    subscriptionId: string | null;
    subscriptionValidUntil: Date | null;
    Subscription?: {
      id: string;
      name: string;
      priceCents: number;
      isActive: boolean;
    } | null;
  } | null;
  DeliveryProfile?: {
    id: string;
    isActive: boolean;
    transportation: string[];
    maxDistance: number;
    bio: string | null;
    homeAddress: string | null;
    currentAddress: string | null;
    currentLat: number | null;
    currentLng: number | null;
    isVerified: boolean;
    totalDeliveries: number;
    averageRating: number | null;
    totalEarnings: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
}

interface ProfileStats {
  items: number;
  dishes: number;
  products: number;
  followers: number;
  following: number;
}

interface AdminProfileClientProps {
  user: User;
  adminStats: AdminStats;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function AdminProfileClient({ user, adminStats, searchParams }: AdminProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState('profile');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? user?.profileImage ?? null);
  const [stats, setStats] = useState<ProfileStats>({
    items: 0,
    dishes: 0,
    products: 0,
    followers: 0,
    following: 0,
  });
  const [showWelcome, setShowWelcome] = useState(false);

  const handlePhotoChange = async (newPhotoUrl: string | null) => {
    try {
      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: newPhotoUrl
        }),
      });

      if (response.ok) {
        setProfileImage(newPhotoUrl);
        window.location.reload();
      } else {
        console.error('Failed to update profile photo');
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
    }
  };

  useEffect(() => {
    if (searchParams?.welcome === 'true' && searchParams?.newUser === 'true') {
      setShowWelcome(true);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: User },
    { id: 'fans', label: 'Fans & Volgers', icon: Users },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom bij HomeCheff!</h2>
              <p className="text-gray-600 mb-6">
                Je admin account is succesvol aangemaakt. Je hebt nu toegang tot alle admin functies.
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Beginnen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Info Block - Bovenaan */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Admin Dashboard</h2>
              <p className="text-red-700">Beheer van HomeCheff Platform</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{adminStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Gebruikers</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <Package className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{adminStats.totalProducts.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Producten</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <ShoppingCart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{adminStats.totalOrders.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Bestellingen</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(adminStats.totalRevenue)}</div>
              <div className="text-sm text-gray-600">Omzet</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{adminStats.activeUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Actief (7d)</div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <Link 
              href="/admin" 
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </Link>
            <Link 
              href="/admin/users" 
              className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Gebruikers Beheren
            </Link>
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-emerald-400 to-emerald-600 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Profile Photo */}
                <div className="mx-auto sm:mx-0">
                  <Suspense fallback={<div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" />}>
                    <PhotoUploader 
                      initialUrl={profileImage ?? undefined} 
                      onPhotoChange={handlePhotoChange}
                    />
                  </Suspense>
                </div>

                {/* Profile Details */}
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {getDisplayName(user)}
                  </h1>
                  <p className="text-gray-600 mb-2">@{user.username || 'admin'}</p>
                  
                  {/* Admin Badge */}
                  <div className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                    <Shield className="w-3 h-3" />
                    Administrator
                  </div>

                  {/* Profile Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{user.profileViews} weergaven</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Lid sinds {formatDate(user.createdAt)}</span>
                    </div>
                    {user.place && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.place}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Instellingen</span>
                </button>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {user.bio && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Over mij</h3>
            <p className="text-gray-700 leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistieken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.items}</div>
              <div className="text-sm text-gray-600">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
              <div className="text-sm text-gray-600">Fans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
              <div className="text-sm text-gray-600">Volgt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{user.profileViews}</div>
              <div className="text-sm text-gray-600">Weergaven</div>
            </div>
          </div>
        </div>

        {/* Role Sections */}
        {user.sellerRoles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verkopersrollen</h3>
            <div className="flex flex-wrap gap-2">
              {user.sellerRoles.map((role) => (
                <span
                  key={role}
                  className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {role === 'chef' && '👨‍🍳 Chef'}
                  {role === 'garden' && '🌱 Garden'}
                  {role === 'designer' && '🎨 Designer'}
                </span>
              ))}
            </div>
          </div>
        )}

        {user.buyerRoles.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Koperrollen</h3>
            <div className="flex flex-wrap gap-2">
              {user.buyerRoles.map((role) => (
                <span
                  key={role}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {role === 'ontdekker' && '🔍 Ontdekker'}
                  {role === 'verzamelaar' && '📦 Verzamelaar'}
                  {role === 'liefhebber' && '❤️ Liefhebber'}
                  {role === 'avonturier' && '🗺️ Avonturier'}
                  {role === 'fijnproever' && '👅 Fijnproever'}
                  {role === 'connaisseur' && '🎭 Connaisseur'}
                  {role === 'genieter' && '✨ Genieter'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {user.interests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interesses</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
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
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Profiel</h3>
                  <p className="text-gray-600">
                    Dit is je admin profiel pagina. Je hebt toegang tot alle admin functies via het Admin Panel.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'fans' && (
              <FansAndFollowsList />
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <ProfileSettings
          user={{
            id: user.id,
            name: user.name || '',
            username: user.username || '',
            bio: user.bio || '',
            quote: user.quote || '',
            place: user.place || '',
            address: '',
            city: '',
            postalCode: '',
            country: '',
            gender: user.gender || '',
            interests: user.interests,
            sellerRoles: user.sellerRoles,
            buyerRoles: user.buyerRoles,
            displayFullName: user.displayFullName,
            displayNameOption: user.displayNameOption as 'full' | 'first' | 'last' | 'username' | 'none',
            showFansList: user.showFansList,
            encryptionEnabled: user.encryptionEnabled,
            messageGuidelinesAccepted: user.messageGuidelinesAccepted,
            messageGuidelinesAcceptedAt: user.messageGuidelinesAcceptedAt
          }}
          onSave={async () => {
            setShowSettings(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
