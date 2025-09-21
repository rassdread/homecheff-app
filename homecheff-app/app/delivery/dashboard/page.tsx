'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useSessionCleanup } from '@/hooks/useSessionCleanup';
import { Button } from '@/components/ui/Button';
import { 
  MapPin, 
  Clock, 
  Package, 
  Euro, 
  Star, 
  ToggleLeft, 
  ToggleRight,
  Bell,
  Settings,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface DeliveryProfile {
  id: string;
  age: number;
  transportation: string[];
  maxDistance: number;
  availableDays: string[];
  availableTimeSlots: string[];
  isActive: boolean;
  totalDeliveries: number;
  averageRating: number | null;
  totalEarnings: number;
  bio: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
}

interface DeliveryOrder {
  id: string;
  status: string;
  assignedAt: string;
  deliveryFee: number;
  notes: string | null;
  order: {
    id: string;
    deliveryAddress: string | null;
    deliveryDate: string | null;
    totalAmount: number;
    User: {
      name: string;
    };
  };
}

function DeliveryDashboardContent() {
  const { data: session } = useSession();
  const { isAuthenticated, isLoading } = useSessionCleanup();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    
    // Check for welcome parameter
    if (searchParams?.get('welcome') === 'true') {
      setShowWelcome(true);
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/delivery/profile');
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/delivery/orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    
    setUpdating(true);
    try {
      const response = await fetch('/api/delivery/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !profile.isActive })
      });

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdating(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/delivery/orders/${orderId}/accept`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Geen Bezorger Profiel
          </h2>
          <p className="text-gray-600 mb-6">
            Je hebt nog geen bezorger profiel. Meld je aan om te beginnen met bezorgen!
          </p>
          <Link href="/delivery/signup">
            <Button className="w-full">
              Word Bezorger
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
            <div className="bg-green-100 text-green-800 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Package className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welkom bij HomeCheff!
            </h2>
            <p className="text-gray-600 mb-6">
              Je account is succesvol aangemaakt en je bent nu officieel jongeren bezorger. 
              Je kunt nu beginnen met het accepteren van bezorgingen in je buurt.
            </p>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Volgende stappen:</h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• Zet je profiel op "Actief" om bezorgingen te ontvangen</li>
                  <li>• Configureer je beschikbaarheid en vervoer</li>
                  <li>• Wacht op je eerste bezorging in de buurt</li>
                </ul>
              </div>
              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full"
              >
                Beginnen met Bezorgen!
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-brand text-white p-3 rounded-full">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bezorger Dashboard
                </h1>
                <p className="text-gray-600">
                  Welkom, {profile.user.name}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Beschikbaar
                </span>
                <button
                  onClick={toggleAvailability}
                  disabled={updating}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-brand focus:ring-offset-2"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                  <span className={`absolute inset-0 rounded-full transition-colors ${
                    profile.isActive ? 'bg-primary-brand' : 'bg-gray-300'
                  }`} />
                </button>
              </div>
              
              <Link 
                href="/delivery/instellingen"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-primary-brand text-primary-brand bg-white hover:bg-primary-50 focus:ring-primary-brand hover:shadow-md"
              >
                <Settings className="w-4 h-4 mr-2" />
                Instellingen
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bezorgingen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.totalDeliveries}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verdiend</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{(profile.totalEarnings / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Beoordeling</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.averageRating?.toFixed(1) || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${
                  profile.isActive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profile.isActive ? 'Actief' : 'Inactief'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Je Profiel
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Basis Informatie</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {profile.age} jaar oud</li>
                <li>• Maximaal {profile.maxDistance}km afstand</li>
                <li>• Vervoer: {profile.transportation.join(', ')}</li>
                {profile.bio && <li>• {profile.bio}</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Beschikbaarheid</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Dagen: {profile.availableDays.join(', ')}</li>
                <li>• Tijdsloten: {profile.availableTimeSlots.join(', ')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Beschikbare Bestellingen
            </h2>
            <button
              onClick={fetchOrders}
              className="text-primary-brand hover:text-primary-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Geen bestellingen beschikbaar
              </h3>
              <p className="text-gray-600">
                Er zijn momenteel geen bestellingen in jouw gebied. 
                Zorg ervoor dat je beschikbaar bent!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="bg-primary-brand text-white px-3 py-1 rounded-full text-sm font-medium">
                          €{(order.deliveryFee / 100).toFixed(2)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {order.order.User.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {order.order.deliveryAddress || 'Adres niet beschikbaar'}
                        </div>
                        {order.order.deliveryDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(order.order.deliveryDate).toLocaleDateString('nl-NL')}
                          </div>
                        )}
                      </div>
                      
                      {order.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          Notitie: {order.notes}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => acceptOrder(order.id)}
                      disabled={order.status !== 'PENDING'}
                      className="ml-4"
                    >
                      {order.status === 'PENDING' ? 'Accepteren' : order.status}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeliveryDashboardContent />
    </Suspense>
  );
}
