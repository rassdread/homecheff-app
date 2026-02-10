'use client';

import { useState } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { 
  MapPin, 
  Clock, 
  Star, 
  Truck, 
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
  Clock3
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewer: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface VehiclePhoto {
  id: string;
  fileUrl: string;
  sortOrder: number;
  createdAt: Date;
}

interface DeliveryProfile {
  id: string;
  userId: string;
  age: number;
  transportation: string[];
  maxDistance: number;
  preferredRadius: number;
  deliveryMode: string;
  availableDays: string[];
  availableTimeSlots: string[];
  bio: string | null;
  isActive: boolean;
  isVerified: boolean;
  totalDeliveries: number;
  averageRating: number | null;
  totalEarnings: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    sellerRoles: string[];
  };
  reviews: Review[];
  vehiclePhotos: VehiclePhoto[];
}

interface DeliveryProfileProps {
  deliveryProfile: DeliveryProfile;
}

export default function DeliveryProfile({ deliveryProfile }: DeliveryProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'photos'>('overview');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<{ id: string; progress: string; }[]>([]);

  const transportationLabels = {
    'BIKE': 'Fiets',
    'EBIKE': 'Elektrische Fiets',
    'SCOOTER': 'Scooter',
    'CAR': 'Auto'
  };

  const dayLabels = {
    'maandag': 'Maandag',
    'dinsdag': 'Dinsdag',
    'woensdag': 'Woensdag',
    'donderdag': 'Donderdag',
    'vrijdag': 'Vrijdag',
    'zaterdag': 'Zaterdag',
    'zondag': 'Zondag'
  };

  const timeSlotLabels = {
    'morning': 'Ochtend (9:00-12:00)',
    'afternoon': 'Middag (12:00-17:00)',
    'evening': 'Avond (17:00-21:00)'
  };

  const handleProfilePhotoUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/delivery/upload-profile-photo', {
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
    if (files.length === 0) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Client-side validation
      if (!file.type.startsWith('image/')) {
        alert(`Bestand "${file.name}" is geen afbeelding. Alleen afbeeldingen zijn toegestaan.`);
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`Bestand "${file.name}" is te groot. Maximum 10MB toegestaan.`);
        return false;
      }
      
      return true;
    }).slice(0, 5 - deliveryProfile.vehiclePhotos.length);
    
    if (validFiles.length === 0) return;

    setUploading(true);

    // Create progress trackers
    const tempPhotos = validFiles.map((_, i) => ({
      id: `temp-${Date.now()}-${i}`,
      progress: 'uploading'
    }));
    setUploadingPhotos(tempPhotos);

    // Upload all files in parallel using Promise.all for speed
    const uploadPromises = validFiles.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('photos', file);
        
        const response = await fetch('/api/delivery/upload-vehicle-photos', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          return { success: true, fileName: file.name };
        } else {
          const error = await response.json();
          console.error(`Upload failed for ${file.name}:`, error);
          return { success: false, fileName: file.name, error: error.error };
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        return { success: false, fileName: file.name, error: String(error) };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    setUploading(false);
    setUploadingPhotos([]);
    setShowUploadModal(false);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      // Reload to show new photos
      window.location.reload();
    }
    
    if (failedCount > 0) {
      const failedFiles = results.filter(r => !r.success).map(r => r.fileName).join(', ');
      alert(`${failedCount} foto('s) konden niet worden geüpload: ${failedFiles}`);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return;

    try {
      const response = await fetch(`/api/delivery/vehicle-photos/${photoId}`, {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link href="/delivery/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mijn Profiel</h1>
              <p className="text-gray-600">Bezorger profiel en reviews</p>
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
                    {deliveryProfile.user.image ? (
                      <Image
                        src={deliveryProfile.user.image}
                        alt={getDisplayName(deliveryProfile.user)}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
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
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {deliveryProfile.user.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  {deliveryProfile.age} jaar • Bezorger
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center gap-2">
                    {deliveryProfile.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-medium">Online</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Offline</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verificatie</span>
                  <div className="flex items-center gap-2">
                    {deliveryProfile.isVerified ? (
                      <>
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600 font-medium">Geverifieerd</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600 font-medium">In behandeling</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bezorgingen</span>
                  <span className="font-medium">{deliveryProfile.totalDeliveries}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Gem. Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(Math.round(deliveryProfile.averageRating || 0))}
                    </div>
                    <span className="font-medium">
                      {deliveryProfile.averageRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Bio */}
              {deliveryProfile.bio && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Over mij</h3>
                  <p className="text-gray-700 text-sm">{deliveryProfile.bio}</p>
                </div>
              )}

              {/* Transportation */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Vervoer</h3>
                <div className="flex flex-wrap gap-2">
                  {deliveryProfile.transportation.map(transport => (
                    <span
                      key={transport}
                      className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      {transportationLabels[transport as keyof typeof transportationLabels]}
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
                    { id: 'reviews', label: `Reviews (${deliveryProfile.reviews.length})` },
                    { id: 'photos', label: 'Voertuig Foto\'s' }
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
                              {deliveryProfile.deliveryMode === 'FIXED' ? 'Vast gebied' : 'Flexibel'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Navigation className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Radius</p>
                            <p className="font-medium">{deliveryProfile.preferredRadius} km</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Beschikbaarheid</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Dagen</p>
                          <div className="flex flex-wrap gap-2">
                            {deliveryProfile.availableDays.map(day => (
                              <span
                                key={day}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                              >
                                {dayLabels[day as keyof typeof dayLabels]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Tijdsloten</p>
                          <div className="flex flex-wrap gap-2">
                            {deliveryProfile.availableTimeSlots.map(slot => (
                              <span
                                key={slot}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                              >
                                {timeSlotLabels[slot as keyof typeof timeSlotLabels]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Prestaties</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-600">{deliveryProfile.totalDeliveries}</p>
                          <p className="text-sm text-gray-600">Bezorgingen</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-yellow-600">
                            {deliveryProfile.averageRating?.toFixed(1) || '0.0'}
                          </p>
                          <p className="text-sm text-gray-600">Gem. Rating</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-600">
                            {deliveryProfile.isVerified ? 'Ja' : 'Nee'}
                          </p>
                          <p className="text-sm text-gray-600">Geverifieerd</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <Clock3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-purple-600">
                            {deliveryProfile.availableDays.length}
                          </p>
                          <p className="text-sm text-gray-600">Dagen/Week</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {deliveryProfile.reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nog geen reviews ontvangen</p>
                      </div>
                    ) : (
                      deliveryProfile.reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {review.reviewer.image ? (
                                  <Image
                                    src={review.reviewer.image}
                                    alt={getDisplayName(review.reviewer)}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {getDisplayName(review.reviewer)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {renderStars(review.rating)}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString('nl-NL')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'photos' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Voertuig Foto's</h3>
                        <p className="text-sm text-gray-600">
                          Upload foto's van je voertuig voor verificatie (min. 2, max. 5)
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowUploadModal(true)}
                        disabled={deliveryProfile.vehiclePhotos.length >= 5}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Foto's
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {deliveryProfile.vehiclePhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                            <Image
                              src={photo.fileUrl}
                              alt="Voertuig foto"
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
                    </div>

                    {deliveryProfile.vehiclePhotos.length < 2 && (
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-800">
                          <AlertCircle className="w-5 h-5" />
                          <p className="font-medium">Verificatie vereist</p>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          Upload minimaal 2 foto's van je voertuig om geverifieerd te worden.
                        </p>
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
              Upload Voertuig Foto's
            </h3>
            
            {/* Uploading Progress */}
            {uploading && uploadingPhotos.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm font-medium">
                    Bezig met uploaden... ({uploadingPhotos.length} foto's)
                  </p>
                </div>
                <div className="space-y-1">
                  {uploadingPhotos.map((photo) => (
                    <div key={photo.id} className="text-xs text-blue-700">
                      • Foto wordt geüpload...
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                className="hidden"
                id="vehicle-photos"
                disabled={uploading}
              />
              <label
                htmlFor="vehicle-photos"
                className={`flex flex-col items-center gap-4 ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-gray-600">
                    {uploading ? 'Uploaden...' : 'Klik om foto\'s te selecteren'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {uploading ? 'Even geduld...' : 'of sleep ze hierheen'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Maximaal {5 - deliveryProfile.vehiclePhotos.length} foto's meer
                  </p>
                </div>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                {uploading ? 'Uploaden...' : 'Annuleren'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}