'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Star, 
  ShoppingBag, 
  Camera,
  User,
  Heart,
  Users,
  Award,
  Clock3,
  Plus,
  Grid,
  List,
  Share2,
  MessageCircle,
  ChefHat,
  Sprout,
  Palette,
  Calendar,
  CheckCircle,
  Shield,
  TrendingUp,
  Eye,
  ThumbsUp,
  ArrowRight,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import ShareButton from '@/components/ui/ShareButton';
import Image from 'next/image';
import StartChatButton from '@/components/chat/StartChatButton';
import FollowButton from '@/components/follow/FollowButton';

interface WorkplacePhoto {
  id: string;
  fileUrl: string;
  role: string;
  sortOrder: number;
  createdAt: Date;
}

interface Product {
  id: string;
  title: string;
  priceCents: number;
  Image: any[];
  isActive: boolean;
  createdAt: Date;
  description: string;
  category: string;
}

interface WorkspaceContent {
  id: string;
  type: 'RECIPE' | 'GROWING_PROCESS' | 'DESIGN_ITEM';
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  photos: WorkspaceContentPhoto[];
  props: WorkspaceContentProp[];
  comments: WorkspaceContentComment[];
  recipe?: Recipe;
  growingProcess?: GrowingProcess;
  designItem?: DesignItem;
}

interface WorkspaceContentPhoto {
  id: string;
  fileUrl: string;
  sortOrder: number;
  caption: string | null;
  createdAt: Date;
}

interface WorkspaceContentProp {
  id: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: Date;
}

interface WorkspaceContentComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  replies: WorkspaceContentComment[];
}

interface Recipe {
  id: string;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: string | null;
  ingredients: any[];
  instructions: any[];
  tags: string[];
  source: string | null;
  notes: string | null;
}

interface GrowingProcess {
  id: string;
  plantName: string;
  plantType: string | null;
  variety: string | null;
  startDate: Date | null;
  expectedHarvest: Date | null;
  growingMethod: string | null;
  soilType: string | null;
  wateringSchedule: string | null;
  currentStage: string | null;
  weeklyUpdates: any[];
}

interface DesignItem {
  id: string;
  category: string | null;
  materials: string[];
  techniques: string[];
  dimensions: string | null;
  inspiration: string | null;
  process: any[];
  challenges: string | null;
  solutions: string | null;
  tags: string[];
  isForSale: boolean;
  priceCents: number | null;
}

interface SellerProfile {
  id: string;
  displayName: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  companyName: string | null;
  kvk: string | null;
  btw: string | null;
  deliveryMode: string;
  deliveryRadius: number;
  deliveryRegions: string[];
  createdAt: Date;
  User: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    quote?: string | null;
    sellerRoles: string[];
    buyerRoles?: string[];
    bio?: string | null;
    place?: string | null;
    interests?: string[];
  };
  workplacePhotos: WorkplacePhoto[];
  products: Product[];
  workspaceContent?: WorkspaceContent[];
}

interface PublicSellerProfileProps {
  sellerProfile: SellerProfile;
  isOwner?: boolean;
}

export default function PublicSellerProfile({ sellerProfile, isOwner = false }: PublicSellerProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'workspace' | 'reviews'>('overview');
  const [workspaceContent, setWorkspaceContent] = useState<WorkspaceContent[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalFollowers: 0,
    totalProducts: 0,
    averageRating: 0,
    responseTime: 'Binnen 2 uur'
  });

  // Load workspace content on mount
  useEffect(() => {
    if (activeTab === 'workspace') {
      fetchWorkspaceContent();
    }
    fetchStats();
  }, [activeTab]);

  const fetchWorkspaceContent = async () => {
    try {
      const response = await fetch(`/api/workspace-content?sellerId=${sellerProfile.id}`);
      if (response.ok) {
        const data = await response.json();
        setWorkspaceContent(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching workspace content:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get stats for this specific seller
      const response = await fetch(`/api/seller/${sellerProfile.id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalViews: 0, // Would need analytics API
          totalLikes: 0, // Would need likes API
          totalFollowers: data.totalFollowers,
          totalProducts: data.totalProducts,
          averageRating: data.averageRating,
          responseTime: data.responseTime
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const roleLabels = {
    'chef': 'Chef',
    'garden': 'Tuinier',
    'designer': 'Designer',
    'artist': 'Kunstenaar',
    'baker': 'Bakker',
    'craftsman': 'Vakman'
  };

  const roleIcons = {
    'chef': ChefHat,
    'garden': Sprout,
    'designer': Palette,
    'artist': Palette,
    'baker': ChefHat,
    'craftsman': Award
  };

  const getWorkspaceTabLabel = (role: string) => {
    switch (role) {
      case 'chef':
        return 'Mijn Keuken';
      case 'garden':
        return 'Mijn Tuin';
      case 'designer':
        return 'Mijn Atelier';
      default:
        return 'Mijn Werkruimte';
    }
  };

  const deliveryModeLabels = {
    'FIXED': 'Vast gebied',
    'DYNAMIC': 'Flexibel'
  };

  // Group workplace photos by role
  const photosByRole = sellerProfile.workplacePhotos.reduce((acc, photo) => {
    if (!acc[photo.role]) {
      acc[photo.role] = [];
    }
    acc[photo.role].push(photo);
    return acc;
  }, {} as Record<string, WorkplacePhoto[]>);

  // Calculate stats
  const totalProducts = sellerProfile.products.length;
  const activeProducts = sellerProfile.products.filter(p => p.isActive).length;
  const totalWorkplacePhotos = sellerProfile.workplacePhotos.length;
  const totalWorkspaceContent = workspaceContent.length;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Photo & Basic Info */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {sellerProfile.User.image ? (
                      <Image
                        src={sellerProfile.User.image}
                        alt={sellerProfile.User.name || 'Verkoper'}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                </div>
                {/* Online Status */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {sellerProfile.User.name}
                  </h1>
                  <p className="text-xl text-emerald-100 mb-2">
                    {sellerProfile.companyName || 'Verkoper'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {sellerProfile.User.sellerRoles.map(role => {
                      const Icon = roleIcons[role as keyof typeof roleIcons];
                      return (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full backdrop-blur-sm"
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          {roleLabels[role as keyof typeof roleLabels] || role}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                  <ShareButton
                    url={`${window.location.origin}/seller/${sellerProfile.id}`}
                    title={`${sellerProfile.User.name}'s Profiel`}
                    description={sellerProfile.bio || ''}
                    className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm"
                  />
                  {/* Only show follow/chat buttons if user is logged in */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <FollowButton sellerId={sellerProfile.id} sellerName={sellerProfile.User.name || 'deze verkoper'} />
                    <StartChatButton sellerId={sellerProfile.id} sellerName={sellerProfile.User.name || 'deze verkoper'} />
                  </div>
                </div>
              </div>

              {/* Quote/Motto */}
              {sellerProfile.User.quote && (
                <blockquote className="text-lg text-emerald-100 italic mb-4">
                  "{sellerProfile.User.quote}"
                </blockquote>
              )}

              {/* Bio */}
              {sellerProfile.bio && (
                <p className="text-emerald-100 mb-4 max-w-2xl">
                  {sellerProfile.bio}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-semibold">{totalProducts}</span>
                  <span className="text-emerald-100">Producten</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">{stats.totalFollowers}</span>
                  <span className="text-emerald-100">Volgers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                  <span className="text-emerald-100">Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-emerald-100">Reactietijd: {stats.responseTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* About Card */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Over {sellerProfile.User.name}</h3>
                
                {/* Location */}
                {sellerProfile.User.place && (
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{sellerProfile.User.place}</span>
                  </div>
                )}

                {/* Member Since */}
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    Lid sinds {new Date(sellerProfile.createdAt).toLocaleDateString('nl-NL', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                {/* Verification Status */}
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-blue-600 font-medium">Geverifieerd Verkoper</span>
                </div>

                {/* Interests */}
                {sellerProfile.User.interests && sellerProfile.User.interests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Interesses</h4>
                    <div className="flex flex-wrap gap-2">
                      {sellerProfile.User.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Roles */}
                {sellerProfile.User.buyerRoles && sellerProfile.User.buyerRoles.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Koperrollen</h4>
                    <div className="flex flex-wrap gap-2">
                      {sellerProfile.User.buyerRoles.map((role, index) => {
                        const roleInfo = {
                          ontdekker: { icon: "🔍", label: "Ontdekker", color: "bg-blue-100 text-blue-800" },
                          verzamelaar: { icon: "📦", label: "Verzamelaar", color: "bg-purple-100 text-purple-800" },
                          liefhebber: { icon: "❤️", label: "Liefhebber", color: "bg-red-100 text-red-800" },
                          avonturier: { icon: "🗺️", label: "Avonturier", color: "bg-orange-100 text-orange-800" },
                          fijnproever: { icon: "👅", label: "Fijnproever", color: "bg-green-100 text-green-800" },
                          connaisseur: { icon: "🎭", label: "Connaisseur", color: "bg-gray-100 text-gray-800" },
                          genieter: { icon: "✨", label: "Genieter", color: "bg-yellow-100 text-yellow-800" }
                        }[role];
                        
                        return (
                          <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-2 py-1 ${roleInfo?.color} rounded-full text-xs font-medium`}
                          >
                            <span className="text-sm">{roleInfo?.icon}</span>
                            <span>{roleInfo?.label || role}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Statistieken</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Producten</span>
                    <span className="font-semibold">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Actief</span>
                    <span className="font-semibold text-green-600">{activeProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Volgers</span>
                    <span className="font-semibold">{stats.totalFollowers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gem. Rating</span>
                    <div className="flex items-center gap-1">
                      {renderStars(Math.floor(stats.averageRating))}
                      <span className="ml-1 font-semibold">{stats.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Bezorging</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Modus</p>
                      <p className="font-medium">
                        {deliveryModeLabels[sellerProfile.deliveryMode as keyof typeof deliveryModeLabels]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Radius</p>
                      <p className="font-medium">{sellerProfile.deliveryRadius} km</p>
                    </div>
                  </div>
                  {sellerProfile.deliveryRegions.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Regio's</p>
                      <div className="flex flex-wrap gap-1">
                        {sellerProfile.deliveryRegions.map((region, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {region}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="border-b">
                <nav className="flex overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overzicht', icon: Grid },
                    { id: 'products', label: 'Producten', icon: ShoppingBag },
                    { 
                      id: 'workspace', 
                      label: getWorkspaceTabLabel(sellerProfile.User.sellerRoles[0] || 'generic'),
                      icon: Camera
                    },
                    { id: 'reviews', label: 'Reviews', icon: Star }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Featured Products */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Uitgelichte Producten</h3>
                        <Link 
                          href="#products"
                          onClick={() => setActiveTab('products')}
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          <span>Alle producten bekijken</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                      
                      {sellerProfile.products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sellerProfile.products.slice(0, 6).map((product) => (
                            <Link key={product.id} href={`/product/${product.id}`}>
                              <div className="group bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                {product.Image && product.Image.length > 0 && (
                                  <div className="aspect-square overflow-hidden">
                                    <Image
                                      src={product.Image[0].fileUrl}
                                      alt={product.title}
                                      width={300}
                                      height={300}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                )}
                                <div className="p-4">
                                  <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                    {product.title}
                                  </h4>
                                  <p className="text-emerald-600 font-bold text-lg">
                                    €{(product.priceCents / 100).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen producten</h3>
                          <p className="text-gray-500">Deze verkoper heeft nog geen producten toegevoegd</p>
                        </div>
                      )}
                    </div>

                    {/* Workspace Highlights */}
                    {totalWorkspaceContent > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-gray-900">Werkruimte Highlights</h3>
                          <Link 
                            href="#workspace"
                            onClick={() => setActiveTab('workspace')}
                            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <span>Alle content bekijken</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {workspaceContent.slice(0, 4).map((content) => (
                            <div key={content.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                              {content.photos.length > 0 && (
                                <div className="aspect-video overflow-hidden">
                                  <Image
                                    src={content.photos[0].fileUrl}
                                    alt={content.title}
                                    width={400}
                                    height={225}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="p-4">
                                <h4 className="font-semibold text-gray-900 mb-2">{content.title}</h4>
                                {content.description && (
                                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {content.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Heart className="w-4 h-4" />
                                      <span>{content.props.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="w-4 h-4" />
                                      <span>{content.comments.length}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {new Date(content.createdAt).toLocaleDateString('nl-NL')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Workplace Photos Preview */}
                    {totalWorkplacePhotos > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Werkruimte Foto's</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {sellerProfile.workplacePhotos.slice(0, 8).map((photo) => (
                            <div key={photo.id} className="aspect-square rounded-xl overflow-hidden">
                              <Image
                                src={photo.fileUrl}
                                alt={`Werkruimte ${photo.role}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Alle Producten</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {totalProducts} producten
                        </span>
                      </div>
                    </div>

                    {sellerProfile.products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sellerProfile.products.map((product) => (
                          <Link key={product.id} href={`/product/${product.id}`}>
                            <div className="group bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                              {product.Image && product.Image.length > 0 && (
                                <div className="aspect-square overflow-hidden">
                                  <Image
                                    src={product.Image[0].fileUrl}
                                    alt={product.title}
                                    width={300}
                                    height={300}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-4">
                                <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                  {product.title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {product.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-emerald-600 font-bold text-lg">
                                    €{(product.priceCents / 100).toFixed(2)}
                                  </p>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {product.isActive ? 'Actief' : 'Inactief'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen producten</h3>
                        <p className="text-gray-500">Deze verkoper heeft nog geen producten toegevoegd</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Workspace Tab */}
                {activeTab === 'workspace' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {getWorkspaceTabLabel(sellerProfile.User.sellerRoles[0] || 'generic')}
                      </h3>
                      <span className="text-sm text-gray-600">
                        {totalWorkspaceContent} items
                      </span>
                    </div>

                    {workspaceContent.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspaceContent.map((content) => (
                          <div key={content.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                            {content.photos.length > 0 && (
                              <div className="aspect-video overflow-hidden">
                                <Image
                                  src={content.photos[0].fileUrl}
                                  alt={content.title}
                                  width={400}
                                  height={225}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">{content.title}</h4>
                              {content.description && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {content.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{content.props.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{content.comments.length}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {new Date(content.createdAt).toLocaleDateString('nl-NL')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen content</h3>
                        <p className="text-gray-500">Deze verkoper heeft nog geen werkruimte content gedeeld</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Reviews & Beoordelingen</h3>
                      <div className="flex items-center gap-2">
                        {renderStars(Math.floor(stats.averageRating))}
                        <span className="font-semibold text-lg">{stats.averageRating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="text-center py-12">
                      <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen reviews</h3>
                      <p className="text-gray-500">Er zijn nog geen reviews voor deze verkoper</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
