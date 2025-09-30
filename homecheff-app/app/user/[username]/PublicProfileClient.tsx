'use client';

import { useState, Suspense, useEffect } from 'react';
import { Plus, Grid, List, Filter, Search, Heart, Users, ShoppingBag, Calendar, MapPin, User, Clock, Star, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import MyDishesManager from '@/components/profile/MyDishesManager';
import FollowsList from '@/components/profile/FollowsList';
import WorkspacePhotosDisplay from '@/components/profile/WorkspacePhotosDisplay';

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
  sellerRoles: string[];
  buyerRoles: string[];
  displayFullName: boolean;
  displayNameOption: string;
  createdAt: string;
  Dish: any[];
  SellerProfile?: {
    id: string;
    products: any[];
  };
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
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? null);
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Combineer Dish en Product data
  const allProducts = [
    ...(user.Dish || []).map(dish => ({
      ...dish,
      type: 'dish',
      photos: dish.photos || []
    })),
    ...(user.SellerProfile?.products || []).map(product => ({
      ...product,
      type: 'product',
      subcategory: null, // Product heeft geen subcategory
      photos: product.Image?.map(img => ({ url: img.fileUrl, idx: 0 })) || []
    }))
  ];
  
  const [products, setProducts] = useState(allProducts);
  const [filter, setFilter] = useState<'both' | 'gedeeld' | 'show'>('both');

  // Groepeer producten per categorie
  const getFilteredCategories = (role: string) => {
    switch (role) {
      case 'chef':
        return {
          CHEFF: {
            label: 'De Keuken',
            description: 'keuken foto\'s',
            subcategories: ['Hoofdgerecht', 'Voorgerecht', 'Dessert', 'Snack', 'Drank', 'Saus']
          }
        };
      case 'garden':
        return {
          GROWN: {
            label: 'De Tuin',
            description: 'tuin foto\'s',
            subcategories: ['Groenten', 'Fruit', 'Kruiden', 'Bloemen', 'Kamerplanten', 'Zaad']
          }
        };
      case 'designer':
        return {
          DESIGNER: {
            label: 'Het Atelier',
            description: 'atelier foto\'s',
            subcategories: ['Keramiek', 'Houtwerk', 'Textiel', 'Metaalwerk', 'Papier', 'Kunst', 'Sieraden']
          }
        };
      default:
        return {
          CHEFF: { label: 'De Keuken', description: 'keuken foto\'s', subcategories: [] },
          GROWN: { label: 'De Tuin', description: 'tuin foto\'s', subcategories: [] },
          DESIGNER: { label: 'Het Atelier', description: 'atelier foto\'s', subcategories: [] }
        };
    }
  };

  const getTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overzicht', icon: Eye },
    ];

    const sellerRoles = user.sellerRoles || [];
    const roleSpecificTabs: Array<{id: string, label: string, icon: any, role: string}> = [];
    const workspaceTab: Array<{id: string, label: string, icon: any}> = [];

    // Voeg aparte tabs toe voor elke verkoperrol (Mijn...)
    if (sellerRoles.includes('chef')) {
      roleSpecificTabs.push({ id: 'dishes-chef', label: 'De Keuken', icon: Plus, role: 'chef' });
    }
    if (sellerRoles.includes('garden')) {
      roleSpecificTabs.push({ id: 'dishes-garden', label: 'De Tuin', icon: Plus, role: 'garden' });
    }
    if (sellerRoles.includes('designer')) {
      roleSpecificTabs.push({ id: 'dishes-designer', label: 'Het Atelier', icon: Plus, role: 'designer' });
    }

    // Voeg Werkruimte tab toe als er verkoper rollen zijn
    if (sellerRoles.length > 0) {
      workspaceTab.push({ id: 'workspace', label: 'Werkruimte', icon: Grid });
    }

    return [
      ...baseTabs,
      ...workspaceTab,
      ...roleSpecificTabs
    ];
  };

  const tabs = getTabs();

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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'chef': return 'Chef';
      case 'garden': return 'Tuinier';
      case 'designer': return 'Designer';
      default: return 'Verkoper';
    }
  };

  const getFilteredProducts = () => {
    switch (filter) {
      case 'gedeeld':
        return products.filter(p => p.priceCents && p.priceCents > 0);
      case 'show':
        return products.filter(p => !p.priceCents || p.priceCents === 0);
      case 'both':
      default:
        return products;
    }
  };

  // Voor het overzicht tab: alleen betaalde producten
  const getOverviewProducts = () => {
    return products.filter(p => p.priceCents && p.priceCents > 0);
  };

  const getProductsByCategory = (category: string) => {
    const filteredProducts = getFilteredProducts();
    return filteredProducts.filter(p => p.category === category);
  };

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(priceCents / 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-200">
              <Image
                src={user.profileImage || "/avatar-placeholder.png"}
                alt="Profielfoto"
                fill
                className="object-cover"
                sizes="128px"
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
                  <Clock className="w-4 h-4" />
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
                  {getRoleLabel(role)}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" />
                <span>{products.length} items</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>0 beoordelingen</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>0 volgers</span>
              </div>
            </div>
          </div>
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overzicht</h2>
              
              {/* Recente Items - Alleen betaalde producten */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recente Items</h3>
                {(() => {
                  const filteredProducts = getOverviewProducts();
                  return filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nog geen items gedeeld</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.slice(0, 6).map((product) => {
                      const mainPhoto = product.photos?.[0];
                      return (
                        <div
                          key={product.id}
                          className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {mainPhoto && (
                            <div 
                              className="relative h-48 cursor-pointer"
                              onClick={() => setSelectedImage(mainPhoto.url)}
                            >
                              <Image
                                src={mainPhoto.url}
                                alt={product.title}
                                fill
                                className="object-cover hover:opacity-90 transition-opacity"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-2">{product.title}</h4>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-600">
                                {formatPrice(product.priceCents)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getFilteredCategories('')[product.category]?.label || product.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Werkruimte</h2>
              <div className="text-center py-12 text-gray-500">
                <Grid className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Werkruimte foto's zijn niet publiek zichtbaar</p>
              </div>
            </div>
          )}

          {/* Category-specific tabs */}
          {(activeTab.startsWith('dishes-') || activeTab === 'dishes') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  {(() => {
                    let title = "Mijn Items";
                    let description = "Beheer je items en producten";
                    
                    if (activeTab === 'dishes-chef') {
                      title = "De Keuken";
                      description = "Gerechten en culinaire creaties";
                    } else if (activeTab === 'dishes-garden') {
                      title = "De Tuin";
                      description = "Kweken en tuinproducten";
                    } else if (activeTab === 'dishes-designer') {
                      title = "Het Atelier";
                      description = "Creaties en handgemaakte items";
                    }
                    
                    return (
                      <>
                        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500">{description}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <Suspense fallback={<div className="h-40 rounded-xl bg-gray-100 animate-pulse" />}>
                <MyDishesManager 
                  onStatsUpdate={() => {}} 
                  activeRole={activeTab.replace('dishes-', '')} 
                  userId={user.id}
                  isPublic={true}
                  role={activeTab.replace('dishes-', '')}
                />
              </Suspense>
            </div>
          )}

          {/* Werkruimte tab content */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              {/* Werkruimte secties onder elkaar */}
              <div className="space-y-8">
                {user?.sellerRoles?.includes('chef') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        👨‍🍳 De Keuken
                      </h3>
                    </div>
                    <WorkspacePhotosDisplay 
                      userId={user.id}
                      userRoles={['CHEFF']}
                                />
                              </div>
                            )}
                
                {user?.sellerRoles?.includes('garden') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        🌱 De Tuin
                      </h3>
                              </div>
                    <WorkspacePhotosDisplay 
                      userId={user.id}
                      userRoles={['GROWN']}
                    />
                            </div>
                )}
                
                {user?.sellerRoles?.includes('designer') && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        🎨 Het Atelier
                      </h3>
                    </div>
                    <WorkspacePhotosDisplay 
                      userId={user.id}
                      userRoles={['DESIGNER']}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Uitvergrote foto"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
