'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Grid, List, Search, Heart, Users, Star, Eye, 
  Truck, Bike, Navigation, MapPin, Clock, Award, Shield,
  CheckCircle, Calendar, TrendingUp, MessageCircle, Camera,
  ChefHat, Sprout, Palette, Package
} from 'lucide-react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import FollowButton from '@/components/follow/FollowButton';
import StartChatButton from '@/components/chat/StartChatButton';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  quote: string | null;
  place: string | null;
  gender: string | null;
  interests: string[];
  profileImage: string | null;
  role: string;
  sellerRoles?: string[];
  buyerRoles?: string[];
  displayFullName: boolean;
  displayNameOption: string;
  createdAt: string;
  SellerProfile?: {
    id: string;
    displayName: string | null;
    companyName: string | null;
    products: Array<{
      id: string;
      title: string;
      description: string;
      priceCents: number;
      category: string;
      Image: Array<{ fileUrl: string }>;
    }>;
  } | null;
  DeliveryProfile: {
    id: string;
    age: number;
    bio: string | null;
    transportation: string[];
    maxDistance: number;
    preferredRadius: number;
    deliveryMode: string;
    availableDays: string[];
    availableTimeSlots: string[];
    isActive: boolean;
    isVerified: boolean;
    totalDeliveries: number;
    averageRating: number | null;
    totalEarnings: number;
    createdAt: string;
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      reviewer: {
        id: string;
        name: string | null;
        username: string | null;
        profileImage: string | null;
        displayFullName: boolean;
        displayNameOption: string;
      };
    }>;
    vehiclePhotos: Array<{
      id: string;
      fileUrl: string;
      sortOrder: number;
    }>;
  };
}

interface ProfileStats {
  deliveries: number;
  rating: number;
  reviews: number;
  followers: number;
  props: number;
}

export default function PublicDeliveryProfileClient({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [userStats, setUserStats] = useState<ProfileStats>({
    deliveries: user.DeliveryProfile.totalDeliveries,
    rating: user.DeliveryProfile.averageRating || 0,
    reviews: user.DeliveryProfile.reviews.length,
    followers: 0,
    props: 0
  });

  // Check if viewing own profile
  useEffect(() => {
    const checkOwnProfile = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setIsOwnProfile(data.user?.id === user.id);
        }
      } catch (error) {
        console.error('Error checking profile ownership:', error);
      }
    };
    checkOwnProfile();
  }, [user.id]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const [followersResponse, propsResponse] = await Promise.all([
          fetch(`/api/follows/fans?userId=${user.id}`),
          fetch(`/api/props/count?userId=${user.id}`)
        ]);
        
        let followersCount = 0;
        let propsCount = 0;
        
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          followersCount = followersData.fans?.length || 0;
        }
        
        if (propsResponse.ok) {
          const propsData = await propsResponse.json();
          propsCount = propsData.propsCount || 0;
        }
        
        setUserStats(prev => ({
          ...prev,
          followers: followersCount,
          props: propsCount
        }));
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [user.id]);

  const getDisplayName = () => {
    if (!user.displayFullName) return user.username || 'Bezorger';
    
    switch (user.displayNameOption) {
      case 'first':
        return user.name?.split(' ')[0] || user.username || 'Bezorger';
      case 'last':
        return user.name?.split(' ').pop() || user.username || 'Bezorger';
      case 'username':
        return `@${user.username || 'bezorger'}`;
      case 'full':
      default:
        return user.name || user.username || 'Bezorger';
    }
  };

  const transportationLabels: Record<string, { label: string; icon: any; gradient: string }> = {
    'BIKE': { 
      label: '🚴 Fiets', 
      icon: Bike,
      gradient: 'from-blue-100 to-cyan-100 border-blue-200 text-blue-700'
    },
    'EBIKE': { 
      label: '⚡ E-Bike', 
      icon: Bike,
      gradient: 'from-purple-100 to-pink-100 border-purple-200 text-purple-700'
    },
    'SCOOTER': { 
      label: '🛵 Scooter', 
      icon: Navigation,
      gradient: 'from-orange-100 to-red-100 border-orange-200 text-orange-700'
    },
    'CAR': { 
      label: '🚗 Auto', 
      icon: Truck,
      gradient: 'from-green-100 to-emerald-100 border-green-200 text-green-700'
    }
  };

  const dayLabels: Record<string, string> = {
    'maandag': 'Ma',
    'dinsdag': 'Di',
    'woensdag': 'Wo',
    'donderdag': 'Do',
    'vrijdag': 'Vr',
    'zaterdag': 'Za',
    'zondag': 'Zo'
  };

  const timeSlotLabels: Record<string, { label: string; icon: string; gradient: string }> = {
    'morning': { label: 'Ochtend', icon: '🌅', gradient: 'from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700' },
    'afternoon': { label: 'Middag', icon: '☀️', gradient: 'from-orange-50 to-red-50 border-orange-200 text-orange-700' },
    'evening': { label: 'Avond', icon: '🌙', gradient: 'from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700' }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const hasSellerRoles = user.sellerRoles && user.sellerRoles.length > 0;
  const hasProducts = user.SellerProfile?.products && user.SellerProfile.products.length > 0;

  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: Eye },
    ...(hasSellerRoles ? [{ id: 'roles', label: 'Verkoper Rollen', icon: Award }] : []),
    ...(hasProducts ? [{ id: 'products', label: `Producten (${user.SellerProfile?.products.length || 0})`, icon: Package }] : []),
    { id: 'transportation', label: 'Vervoer', icon: Truck },
    { id: 'reviews', label: `Reviews (${user.DeliveryProfile.reviews.length})`, icon: Star },
    { id: 'vehicle', label: 'Voertuig Foto\'s', icon: Camera }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Settings Button for Own Profile */}
      {isOwnProfile && (
        <div className="mb-6 flex justify-end gap-3">
          <Link
            href="/delivery/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/delivery/settings"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {hasSellerRoles ? 'Beheer Rollen' : 'Voeg Rollen Toe'}
          </Link>
        </div>
      )}

      {/* Profile Header - Strak en Gelikt (Bezorger Stijl) */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 rounded-3xl shadow-lg border-2 border-blue-100 overflow-hidden mb-8">
        {/* Cover Image Effect - Bezorger Gradient */}
        <div className="h-32 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          {/* Delivery Icons Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 text-white text-3xl">🚴</div>
            <div className="absolute top-8 right-12 text-white text-2xl">📦</div>
            <div className="absolute bottom-4 left-1/4 text-white text-2xl">⚡</div>
            <div className="absolute top-6 right-1/4 text-white text-3xl">🛵</div>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 pb-6 -mt-16 relative">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                <SafeImage
                  src={user.profileImage || "/avatar-placeholder.png"}
                  alt="Bezorger foto"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                {/* Verification Badge */}
                {user.DeliveryProfile.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left mt-4">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                  {getDisplayName()}
                </h1>
                {user.DeliveryProfile.isActive && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
                    🟢 ACTIEF
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                <span className="font-medium">@{user.username || 'bezorger'}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  🚴 Bezorger
                </span>
                {user.place && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.place}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Lid sinds {new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</span>
                  <span className="sm:hidden">{new Date(user.createdAt).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Quote */}
              {user.quote && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <blockquote className="text-sm sm:text-base text-gray-700 italic leading-relaxed">
                    "{user.quote}"
                  </blockquote>
                </div>
              )}

              {/* Bio */}
              {(user.bio || user.DeliveryProfile.bio) && (
                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                  {user.DeliveryProfile.bio || user.bio}
                </p>
              )}

              {/* Bezorger Badge & Seller Roles */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold border border-blue-200 shadow-sm">
                  🚴 HomeCheff Bezorger
                </span>
                {user.DeliveryProfile.isVerified && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold border border-green-200 shadow-sm">
                    ✅ Geverifieerd
                  </span>
                )}
                {/* Seller Roles Badges */}
                {user.sellerRoles?.includes('CHEFF') && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 rounded-full text-xs sm:text-sm font-semibold border border-orange-200 shadow-sm">
                    👨‍🍳 Chef
                  </span>
                )}
                {user.sellerRoles?.includes('GROWN') && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold border border-green-200 shadow-sm">
                    🌱 Tuinier
                  </span>
                )}
                {user.sellerRoles?.includes('DESIGNER') && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-xs sm:text-sm font-semibold border border-purple-200 shadow-sm">
                    🎨 Designer
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                <div className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-cyan-50 px-3 py-2.5 rounded-lg border border-blue-100 shadow-sm">
                  <Truck className="w-4 h-4 text-blue-600 mb-1" />
                  <span className="font-bold text-gray-900">{userStats.deliveries}</span>
                  <span className="text-xs text-gray-600">bezorgd</span>
                </div>
                <div className="flex flex-col items-center bg-gradient-to-br from-yellow-50 to-orange-50 px-3 py-2.5 rounded-lg border border-yellow-100 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-600 mb-1" />
                  <span className="font-bold text-gray-900">{userStats.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-600">rating</span>
                </div>
                <div className="flex flex-col items-center bg-gradient-to-br from-purple-50 to-pink-50 px-3 py-2.5 rounded-lg border border-purple-100 shadow-sm">
                  <MessageCircle className="w-4 h-4 text-purple-600 mb-1" />
                  <span className="font-bold text-gray-900">{userStats.reviews}</span>
                  <span className="text-xs text-gray-600">reviews</span>
                </div>
                <div className="flex flex-col items-center bg-gradient-to-br from-pink-50 to-red-50 px-3 py-2.5 rounded-lg border border-pink-100 shadow-sm">
                  <Users className="w-4 h-4 text-pink-600 mb-1" />
                  <span className="font-bold text-gray-900">{userStats.followers}</span>
                  <span className="text-xs text-gray-600">fans</span>
                </div>
                <div className="flex flex-col items-center bg-gradient-to-br from-red-50 to-orange-50 px-3 py-2.5 rounded-lg border border-red-100 shadow-sm">
                  <Heart className="w-4 h-4 text-red-600 mb-1" />
                  <span className="font-bold text-gray-900">{userStats.props}</span>
                  <span className="text-xs text-gray-600">props</span>
                </div>
              </div>
              
              {/* Action Buttons - Volledig Responsive */}
              <div className="grid grid-cols-2 gap-3">
                <FollowButton 
                  sellerId={user.id}
                  sellerName={getDisplayName()}
                  className="w-full px-4 py-3 text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                />
                <StartChatButton
                  sellerId={user.id}
                  sellerName={getDisplayName()}
                  showSuccessMessage={true}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Bezorger Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delivery Mode */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Bezorgmodus</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {user.DeliveryProfile.deliveryMode === 'FIXED' ? '📍 Vast Gebied' : '🛰️ Dynamisch GPS'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Radius: {user.DeliveryProfile.preferredRadius}km
                  </p>
                </div>

                {/* Verification Status */}
                <div className={`border-2 rounded-xl p-5 shadow-sm ${
                  user.DeliveryProfile.isVerified
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      user.DeliveryProfile.isVerified
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : 'bg-gradient-to-br from-orange-500 to-yellow-500'
                    }`}>
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Verificatie</h3>
                  </div>
                  <p className={`text-2xl font-bold ${
                    user.DeliveryProfile.isVerified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {user.DeliveryProfile.isVerified ? '✅ Geverifieerd' : '⏳ In behandeling'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.DeliveryProfile.isVerified 
                      ? 'Betrouwbare bezorger'
                      : 'Verificatie wordt verwerkt'
                    }
                  </p>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Prestaties
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                    <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-blue-600">{user.DeliveryProfile.totalDeliveries}</p>
                    <p className="text-sm text-gray-600 font-medium">Bezorgingen</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                    <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-yellow-600">
                      {(user.DeliveryProfile.averageRating || 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">Gem. Rating</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                    <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-purple-600">{user.DeliveryProfile.reviews.length}</p>
                    <p className="text-sm text-gray-600 font-medium">Reviews</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-600">{user.DeliveryProfile.isVerified ? '✓' : '⏳'}</p>
                    <p className="text-sm text-gray-600 font-medium">Verified</p>
                  </div>
                </div>
              </div>

              {/* Availability Summary */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Beschikbaarheid
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {user.DeliveryProfile.availableDays.map(day => (
                    <span
                      key={day}
                      className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-lg shadow-sm"
                    >
                      {dayLabels[day as keyof typeof dayLabels] || day}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.DeliveryProfile.availableTimeSlots.map(slot => {
                    const slotInfo = timeSlotLabels[slot as keyof typeof timeSlotLabels];
                    return (
                      <span
                        key={slot}
                        className={`px-3 py-1.5 bg-gradient-to-r ${slotInfo?.gradient || 'from-gray-100 to-gray-200'} text-sm font-semibold rounded-lg shadow-sm border`}
                      >
                        {slotInfo?.icon} {slotInfo?.label || slot}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && hasSellerRoles && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Verkoper Rollen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.sellerRoles?.includes('CHEFF') && (
                  <div className="bg-gradient-to-br from-orange-100 to-red-100 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-5xl mb-3">👨‍🍳</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Chef</h3>
                      <p className="text-sm text-gray-700 mb-4">Verkoop culinaire creaties</p>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">Actief</span>
                      </div>
                    </div>
                  </div>
                )}
                {user.sellerRoles?.includes('GROWN') && (
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-5xl mb-3">🌱</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Tuinier</h3>
                      <p className="text-sm text-gray-700 mb-4">Deel groenten en kruiden</p>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">Actief</span>
                      </div>
                    </div>
                  </div>
                )}
                {user.sellerRoles?.includes('DESIGNER') && (
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-5xl mb-3">🎨</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Designer</h3>
                      <p className="text-sm text-gray-700 mb-4">Verkoop handgemaakte items</p>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">Actief</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info about adding more roles */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Meerdere Rollen</h4>
                    <p className="text-sm text-gray-700">
                      Deze bezorger heeft meerdere verkoper rollen en kan verschillende soorten producten aanbieden. 
                      Bekijk de producten tab om te zien wat er te koop is!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && hasProducts && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-600" />
                  Te Koop Producten
                </h2>
                <Link
                  href={`/user/${user.username}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Bekijk alle producten →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.SellerProfile?.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100">
                      {product.Image[0]?.fileUrl ? (
                        <SafeImage
                          src={product.Image[0].fileUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {product.category === 'CHEFF' && <ChefHat className="w-12 h-12 text-gray-400" />}
                          {product.category === 'GROWN' && <Sprout className="w-12 h-12 text-gray-400" />}
                          {product.category === 'DESIGNER' && <Palette className="w-12 h-12 text-gray-400" />}
                        </div>
                      )}
                      {/* Price Badge */}
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        €{(product.priceCents / 100).toFixed(2)}
                      </div>
                      {/* Category Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.category === 'CHEFF' ? 'bg-orange-100 text-orange-700' :
                          product.category === 'GROWN' ? 'bg-green-100 text-green-700' :
                          product.category === 'DESIGNER' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.category === 'CHEFF' && '👨‍🍳'}
                          {product.category === 'GROWN' && '🌱'}
                          {product.category === 'DESIGNER' && '🎨'}
                        </span>
                      </div>
                    </div>
                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* More Products Link */}
              {(user.SellerProfile?.products.length || 0) >= 6 && (
                <div className="text-center">
                  <Link
                    href={`/user/${user.username}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Bekijk Alle Producten →
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transportation' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Bike className="w-6 h-6 text-blue-600" />
                Vervoersmiddelen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.DeliveryProfile.transportation.map(transport => {
                  const info = transportationLabels[transport as keyof typeof transportationLabels];
                  if (!info) return null;
                  const Icon = info.icon;
                  
                  return (
                    <div
                      key={transport}
                      className={`bg-gradient-to-r ${info.gradient} border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                          <Icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{info.label}</h3>
                          <p className="text-sm opacity-80">Actief vervoermiddel</p>
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-sm font-semibold">
                          Max bereik: <span className="text-lg">{user.DeliveryProfile.maxDistance}km</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Werkgebied Info */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-600" />
                  Werkgebied Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Bezorgmodus</p>
                    <p className="text-lg font-bold text-cyan-700">
                      {user.DeliveryProfile.deliveryMode === 'FIXED' ? '📍 Vast Gebied' : '🛰️ Dynamisch GPS'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Bezorgradius</p>
                    <p className="text-lg font-bold text-cyan-700">
                      {user.DeliveryProfile.preferredRadius}km
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Reviews ({user.DeliveryProfile.reviews.length})
                </h2>
                {user.DeliveryProfile.averageRating && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-full border-2 border-yellow-200">
                    <div className="flex">
                      {renderStars(Math.round(user.DeliveryProfile.averageRating))}
                    </div>
                    <span className="text-lg font-bold text-yellow-600">
                      {user.DeliveryProfile.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {user.DeliveryProfile.reviews.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nog geen reviews ontvangen</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Reviews verschijnen hier na afgeronde bezorgingen
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.DeliveryProfile.reviews.map((review) => (
                    <div 
                      key={review.id} 
                      className="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Reviewer Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-blue-200">
                            {review.reviewer.profileImage ? (
                              <SafeImage
                                src={review.reviewer.profileImage}
                                alt={review.reviewer.name || 'Reviewer'}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {review.reviewer.name || review.reviewer.username || 'Gebruiker'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 leading-relaxed mt-3 bg-white/60 rounded-lg p-3 border border-blue-100">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-blue-600" />
                  Voertuig Foto's
                </h2>
                <span className="text-sm text-gray-600">
                  {user.DeliveryProfile.vehiclePhotos.length} foto's
                </span>
              </div>

              {user.DeliveryProfile.vehiclePhotos.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Geen voertuig foto's</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Bezorger heeft nog geen foto's toegevoegd
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {user.DeliveryProfile.vehiclePhotos.map((photo, idx) => (
                    <div 
                      key={photo.id}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-200 shadow-md hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <SafeImage
                        src={photo.fileUrl}
                        alt={`Voertuig foto ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* Photo Number Badge */}
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Verification Note */}
              {user.DeliveryProfile.vehiclePhotos.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900">Voertuig Geverifieerd</p>
                      <p className="text-sm text-green-700">
                        Alle foto's zijn gecontroleerd en goedgekeurd door HomeCheff
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

