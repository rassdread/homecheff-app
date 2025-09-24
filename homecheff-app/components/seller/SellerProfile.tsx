'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Star, 
  ShoppingBag, 
  Camera,
  Upload,
  X,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  Navigation,
  Heart,
  Users,
  Award,
  Clock3,
  Edit3,
  Plus,
  Grid,
  List
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

// Reviews removed for now - can be added later if needed

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
    sellerRoles: string[];
  };
  workplacePhotos: WorkplacePhoto[];
  products: Product[];
}

interface SellerProfileProps {
  sellerProfile: SellerProfile;
  isOwner?: boolean;
}

export default function SellerProfile({ sellerProfile, isOwner = false }: SellerProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'products'>('overview');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const roleLabels = {
    'chef': 'Chef',
    'garden': 'Tuinier',
    'designer': 'Designer',
    'artist': 'Kunstenaar',
    'baker': 'Bakker',
    'craftsman': 'Vakman'
  };

  const workplaceLabels = {
    'chef': 'Keuken & Keukengerei',
    'garden': 'Tuin & Kas',
    'designer': 'Atelier & Werkruimte',
    'artist': 'Studio & Werkruimte',
    'baker': 'Bakkerij & Keuken',
    'craftsman': 'Werkplaats & Gereedschap'
  };

  const deliveryModeLabels = {
    'FIXED': 'Vast gebied',
    'DYNAMIC': 'Flexibel'
  };

  const handleProfilePhotoUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/seller/upload-profile-photo', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Fout bij uploaden: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Er is een fout opgetreden bij het uploaden');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (files.length === 0 || !selectedRole) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append(`photos`, file);
      });
      formData.append('role', selectedRole);
      
      const response = await fetch('/api/seller/upload-workplace-photos', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Fout bij uploaden: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Er is een fout opgetreden bij het uploaden');
    } finally {
      setUploading(false);
      setShowUploadModal(false);
      setSelectedRole('');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/seller/workplace-photos/${photoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Fout bij verwijderen: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Er is een fout opgetreden bij het verwijderen');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            {isOwner && (
              <Link href="/verkoper/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isOwner ? 'Mijn Profiel' : `${sellerProfile.User.name}'s Profiel`}
              </h1>
              <p className="text-gray-600">Verkoper profiel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {sellerProfile.User.image ? (
                      <Image
                        src={sellerProfile.User.image}
                        alt={sellerProfile.User.name || 'Verkoper'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {isOwner && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleProfilePhotoUpload(e.target.files[0])}
                        className="hidden"
                        id="profile-photo"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="profile-photo"
                        className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 cursor-pointer"
                      >
                        {uploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </label>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {sellerProfile.User.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  {sellerProfile.companyName || 'Verkoper'}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">Actief</span>
                  </div>
                </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Verificatie</span>
                    <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 font-medium">Geverifieerd</span>
                  </div>
                </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Producten</span>
                  <span className="font-medium">{totalProducts}</span>
                  </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Werkruimte Foto's</span>
                  <span className="font-medium">{totalWorkplacePhotos}</span>
                </div>
              </div>

              {/* Bio */}
              {sellerProfile.bio && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Over mij</h3>
                  <p className="text-gray-700 text-sm">{sellerProfile.bio}</p>
                </div>
              )}

              {/* Roles */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Rollen</h3>
                <div className="flex flex-wrap gap-2">
                  {sellerProfile.User.sellerRoles.map(role => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      {roleLabels[role as keyof typeof roleLabels] || role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
              <div className="border-b">
                <nav className="flex">
                  {[
                    { id: 'overview', label: 'Overzicht' },
                    { id: 'photos', label: 'Werkruimte Foto\'s' },
                    { id: 'products', label: 'Producten' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Work Area */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Werkgebied</h3>
                      <div className="grid grid-cols-2 gap-4">
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
                          <Navigation className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Radius</p>
                            <p className="font-medium">{sellerProfile.deliveryRadius} km</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Stats */}
                      <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Prestaties</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <ShoppingBag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
                          <p className="text-sm text-gray-600">Producten</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
                          <p className="text-sm text-gray-600">Actief</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-yellow-600">
                            0.0
                          </p>
                          <p className="text-sm text-gray-600">Gem. Rating</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-purple-600">
                            {sellerProfile.User.sellerRoles.length}
                          </p>
                          <p className="text-sm text-gray-600">Rollen</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {activeTab === 'photos' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Werkruimte Foto's</h3>
                        <p className="text-sm text-gray-600">
                          {isOwner 
                            ? 'Upload foto\'s van je werkruimte per rol (min. 2 per rol)'
                            : 'Werkruimte foto\'s per rol'
                          }
                        </p>
                      </div>
                      {isOwner && (
                        <Button
                          onClick={() => setShowUploadModal(true)}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Foto's
                        </Button>
                      )}
                    </div>

                    {sellerProfile.User.sellerRoles.length > 0 && (
                      <div className="space-y-6">
                        {sellerProfile.User.sellerRoles.map((role) => (
                          <div key={role} className="border rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3 capitalize">
                              {roleLabels[role as keyof typeof roleLabels] || role} Werkruimte
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {photosByRole[role]?.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                                <Image
                                  src={photo.fileUrl}
                                      alt={`${role} werkruimte`}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                                  {isOwner && (
                                    <button
                                      onClick={() => handleDeletePhoto(photo.id)}
                                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                            </div>
                              )) || (
                                <div className="col-span-2 md:col-span-4 text-center py-8 text-gray-500">
                                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p>Nog geen foto's van je {role} werkruimte</p>
                            </div>
                          )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sellerProfile.workplacePhotos.length < 2 && (
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-800">
                          <AlertCircle className="w-5 h-5" />
                          <p className="font-medium">Verificatie vereist</p>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          Upload minimaal 2 foto's van je werkruimte om geverifieerd te worden.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                      <h3 className="font-semibold text-gray-900">Mijn Producten</h3>
                        <p className="text-sm text-gray-600">
                          Beheer je producten en bekijk prestaties
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg ${
                            viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'
                          }`}
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg ${
                            viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                        {isOwner && (
                          <Button className="ml-4 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nieuw Product
                          </Button>
                        )}
                      </div>
                    </div>

                    {sellerProfile.products.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {sellerProfile.products.map((product) => (
                          <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            {product.Image && product.Image.length > 0 && (
                              <img
                                src={product.Image[0].fileUrl}
                                  alt={product.title}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                              />
                            )}
                            <h3 className="font-medium text-gray-900 mb-2">{product.title}</h3>
                            <p className="text-primary-600 font-semibold">
                                €{(product.priceCents / 100).toFixed(2)}
                              </p>
                            <div className="flex items-center justify-between mt-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.isActive ? 'Actief' : 'Inactief'}
                                </span>
                              {isOwner && (
                                <button className="text-gray-400 hover:text-gray-600">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen producten</h3>
                        <p className="text-gray-500 mb-6">Begin met het toevoegen van je eerste product</p>
                        {isOwner && (
                          <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Eerste Product Toevoegen
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal - Only for owner */}
      {isOwner && showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Werkruimte Foto's
            </h3>
            
            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer rol voor werkruimte foto's
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={uploading}
              >
                <option value="">Kies een rol...</option>
                {sellerProfile.User.sellerRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role as keyof typeof roleLabels] || role}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                className="hidden"
                id="workplace-photos"
                disabled={uploading || !selectedRole}
              />
              <label
                htmlFor="workplace-photos"
                className={`cursor-pointer flex flex-col items-center gap-4 ${
                  !selectedRole ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-gray-600">
                    {!selectedRole ? 'Selecteer eerst een rol' : 'Klik om foto\'s te selecteren'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedRole ? 'of sleep ze hierheen' : 'Voordat je foto\'s kunt uploaden'}
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedRole('');
                }}
                disabled={uploading}
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
