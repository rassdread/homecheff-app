'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Star, 
  Camera,
  Upload,
  X,
  Edit,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  User,
  Package,
  TrendingUp,
  Eye,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface WorkplacePhoto {
  id: string;
  role: string;
  fileUrl: string;
  sortOrder: number;
  createdAt: Date;
}

interface Product {
  id: string;
  title: string;
  priceCents: number;
  images: string[];
  status: string;
  createdAt: Date;
}

interface SellerProfile {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  deliveryMode: string;
  deliveryRadius: number;
  createdAt: Date;
  user: {
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
  missingPhotos: string[];
  rolePhotoCounts: { [key: string]: number };
}

export default function SellerProfile({ 
  sellerProfile, 
  missingPhotos, 
  rolePhotoCounts 
}: SellerProfileProps) {
  // Only show products tab if user has seller roles
  const hasSellerRoles = sellerProfile.user.sellerRoles && sellerProfile.user.sellerRoles.length > 0;
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'products'>('overview');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const roleLabels = {
    'CHEF': 'Chef',
    'GARDEN': 'Garden',
    'DESIGNER': 'Designer'
  };

  const roleDescriptions = {
    'CHEF': 'Keuken en keukengerei foto\'s',
    'GARDEN': 'Tuin of kas foto\'s',
    'DESIGNER': 'Werkplek foto\'s'
  };

  const groupedPhotos = sellerProfile.workplacePhotos.reduce((acc, photo) => {
    if (!acc[photo.role]) {
      acc[photo.role] = [];
    }
    acc[photo.role].push(photo);
    return acc;
  }, {} as { [key: string]: WorkplacePhoto[] });

  const handlePhotoUpload = async (files: FileList, role: string) => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append(`photos`, file);
      });
      formData.append('role', role);
      
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

  const canSell = missingPhotos.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/seller/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mijn Verkoopprofiel</h1>
              <p className="text-gray-600">Beheer je werkplek foto's en producten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Status - Only show if user has seller roles */}
        {hasSellerRoles && !canSell && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-orange-800">
                Verificatie Vereist
              </h3>
            </div>
            <p className="text-orange-700 mb-4">
              Je moet minimaal 2 werkplek foto's uploaden voor elke verkopersrol voordat je kunt verkopen.
            </p>
            <div className="space-y-2">
              {missingPhotos.map(role => (
                <div key={role} className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {roleLabels[role as keyof typeof roleLabels]}: 
                    {rolePhotoCounts[role] || 0}/2 foto's geüpload
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {sellerProfile.user.image ? (
                      <Image
                        src={sellerProfile.user.image}
                        alt={sellerProfile.user.name || 'Verkoper'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {sellerProfile.displayName || sellerProfile.user.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  {sellerProfile.user.sellerRoles.map(role => 
                    roleLabels[role as keyof typeof roleLabels]
                  ).join(', ')}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                {hasSellerRoles && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Verificatie</span>
                    <div className="flex items-center gap-2">
                      {canSell ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 font-medium">Geverifieerd</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">In behandeling</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {hasSellerRoles && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Producten</span>
                    <span className="font-medium">{sellerProfile.products.length}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bezorggebied</span>
                  <span className="font-medium">{sellerProfile.deliveryRadius} km</span>
                </div>
              </div>

              {/* Roles - Only show if user has seller roles */}
              {hasSellerRoles && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Verkopersrollen</h3>
                  <div className="space-y-2">
                    {sellerProfile.user.sellerRoles.map((role) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {roleLabels[role as keyof typeof roleLabels]}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            (rolePhotoCounts[role] || 0) >= 2 ? 'bg-green-500' : 'bg-orange-500'
                          }`} />
                          <span className="text-xs text-gray-500">
                            {rolePhotoCounts[role] || 0}/2
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    { id: 'photos', label: 'Werkplek Foto\'s' },
                    ...(hasSellerRoles ? [{ id: 'products', label: `Producten (${sellerProfile.products.length})` }] : [])
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
                    {/* Bio */}
                    {sellerProfile.bio && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Over mij</h3>
                        <p className="text-gray-700">{sellerProfile.bio}</p>
                      </div>
                    )}

                    {/* Delivery Settings */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Bezorginstellingen</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Modus</p>
                            <p className="font-medium">
                              {sellerProfile.deliveryMode === 'FIXED' ? 'Vast gebied' : 'Flexibel'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Radius</p>
                            <p className="font-medium">{sellerProfile.deliveryRadius} km</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Products - Only show if user has seller roles */}
                    {hasSellerRoles && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Recente Producten</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {sellerProfile.products.slice(0, 6).map((product) => (
                            <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="aspect-square bg-gray-200">
                                {product.images.length > 0 ? (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-8 h-8 text-gray-400 mx-auto mt-8" />
                                )}
                              </div>
                              <div className="p-3">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {product.title}
                                </h4>
                                <p className="text-primary-600 font-semibold">
                                  €{(product.priceCents / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'photos' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Werkplek Foto's</h3>
                        <p className="text-sm text-gray-600">
                          Upload foto's van je werkplek voor elke rol (min. 2, max. 5 per rol)
                        </p>
                      </div>
                    </div>

                    {hasSellerRoles && sellerProfile.user.sellerRoles.map((role) => (
                      <div key={role} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {roleLabels[role as keyof typeof roleLabels]}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {roleDescriptions[role as keyof typeof roleDescriptions]}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedRole(role);
                              setShowUploadModal(true);
                            }}
                            disabled={groupedPhotos[role]?.length >= 5}
                            size="sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload ({groupedPhotos[role]?.length || 0}/5)
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {groupedPhotos[role]?.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                                <Image
                                  src={photo.fileUrl}
                                  alt="Werkplek foto"
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!groupedPhotos[role] || groupedPhotos[role].length === 0) && (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p>Nog geen foto's geüpload</p>
                            </div>
                          )}
                        </div>

                        {(groupedPhotos[role]?.length || 0) < 2 && (
                          <div className="mt-4 bg-orange-50 border border-orange-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-800">
                              <AlertCircle className="w-4 h-4" />
                              <p className="text-sm font-medium">
                                Minimaal 2 foto's vereist voor verificatie
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {!hasSellerRoles && (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Geen verkopersrollen gevonden</p>
                        <p className="text-sm text-gray-400">
                          Je hebt nog geen verkopersrollen. Ga naar je profiel instellingen om rollen toe te voegen.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Mijn Producten</h3>
                      <Link href="/seller/dashboard">
                        <Button>
                          <Package className="w-4 h-4 mr-2" />
                          Beheer Producten
                        </Button>
                      </Link>
                    </div>

                    {sellerProfile.products.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nog geen producten toegevoegd</p>
                        <Link href="/seller/dashboard">
                          <Button className="mt-4">
                            Voeg je eerste product toe
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sellerProfile.products.map((product) => (
                          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="aspect-square bg-gray-200">
                              {product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.title}
                                  width={300}
                                  height={300}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-gray-400 mx-auto mt-8" />
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {product.title}
                              </h4>
                              <p className="text-primary-600 font-bold text-lg mb-2">
                                €{(product.priceCents / 100).toFixed(2)}
                              </p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  product.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.status === 'ACTIVE' ? 'Actief' : 'Inactief'}
                                </span>
                                <span>
                                  {new Date(product.createdAt).toLocaleDateString('nl-NL')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload {roleLabels[selectedRole as keyof typeof roleLabels]} Foto's
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {roleDescriptions[selectedRole as keyof typeof roleDescriptions]}
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files, selectedRole)}
                className="hidden"
                id="workplace-photos"
              />
              <label
                htmlFor="workplace-photos"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-gray-600">Klik om foto's te selecteren</p>
                  <p className="text-sm text-gray-500">of sleep ze hierheen</p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowUploadModal(false)}
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
