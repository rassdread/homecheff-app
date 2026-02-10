'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  MapPin, 
  Clock, 
  Truck,
  Save,
  AlertCircle,
  CheckCircle,
  Navigation,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  CreditCard,
  ExternalLink
} from 'lucide-react';

interface DeliveryProfile {
  id: string;
  isActive: boolean;
  maxDistance: number;
  availableDays: string[];
  availableTimes: string[];
  vehicleType: string | null;
  deliveryRegions: string[];
  bio: string | null;
  totalDeliveries: number;
  averageRating: number | null;
  totalEarnings: number;
  createdAt: Date;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  lat: number | null;
  lng: number | null;
  place: string | null;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
}

interface EarningsStats {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  averageDeliveryValue: number;
}

interface Payout {
  id: string;
  amount: number;
  createdAt: Date;
  status: string;
  orderId: string;
}

const DAYS_OF_WEEK = [
  'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'
];

const TIME_SLOTS = [
  'Ochtend (8:00-12:00)',
  'Middag (12:00-17:00)',
  'Avond (17:00-21:00)'
];

const VEHICLE_TYPES = [
  { value: 'BIKE', label: '🚴 Fiets' },
  { value: 'SCOOTER', label: '🛵 Scooter' },
  { value: 'CAR', label: '🚗 Auto' },
  { value: 'CARGO_BIKE', label: '📦 Bakfiets' }
];

export default function DeliveryProfileSettings() {
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    isActive: false,
    maxDistance: 10,
    availableDays: [] as string[],
    availableTimes: [] as string[],
    vehicleType: '',
    bio: '',
    place: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch settings
      const settingsResponse = await fetch('/api/delivery/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setProfile(settingsData.profile);
        setUser(settingsData.user);
        
        setFormData({
          isActive: settingsData.profile.isActive,
          maxDistance: settingsData.profile.maxDistance,
          availableDays: settingsData.profile.availableDays || [],
          availableTimes: settingsData.profile.availableTimes || [],
          vehicleType: settingsData.profile.vehicleType || '',
          bio: settingsData.profile.bio || '',
          place: settingsData.user.place || ''
        });
      }

      // Fetch earnings
      const earningsResponse = await fetch('/api/delivery/earnings');
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setStats(earningsData.stats);
        setPayouts(earningsData.payouts);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      setMessage({ type: 'error', text: 'Kon gegevens niet laden' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/delivery/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Kon instellingen niet opslaan' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const toggleTimeSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(slot)
        ? prev.availableTimes.filter(t => t !== slot)
        : [...prev.availableTimes, slot]
    }));
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleStripeOnboard = async () => {
    setStripeLoading(true);
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success && data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        setMessage({ type: 'error', text: data.error || 'Er is een fout opgetreden bij Stripe Connect' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Er is een fout opgetreden bij het opzetten van Stripe Connect' });
    } finally {
      setStripeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bezorger Profiel & Instellingen</h1>
        <p className="text-gray-600 mt-2">Beheer je bezorgprofiel, instellingen en verdiensten</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Earnings Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Verdiend</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.completedDeliveries} voltooide bezorgingen
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deze Maand</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.monthEarnings)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beoordeling</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {profile?.averageRating?.toFixed(1) || '0.0'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.totalDeliveries} bezorgingen
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gem. Verdienste</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.averageDeliveryValue)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Per bezorging
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Basis Instellingen
            </h3>

            <div className="space-y-4">
              {/* Active Toggle */}
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <label className="font-medium text-gray-900">Beschikbaar voor bezorgingen</label>
                  <p className="text-sm text-gray-500">Schakel in om opdrachten te ontvangen</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Max Distance */}
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Maximale bezorgafstand
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={formData.maxDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="font-semibold text-emerald-600 min-w-[60px]">
                    {formData.maxDistance} km
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Je ontvangt alleen opdrachten binnen deze radius
                </p>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Vervoersmiddel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {VEHICLE_TYPES.map((vehicle) => (
                    <button
                      key={vehicle.value}
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.value }))}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.vehicleType === vehicle.value
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{vehicle.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  Standplaats
                </label>
                <input
                  type="text"
                  value={formData.place}
                  onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                  placeholder="Amsterdam Centrum"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  placeholder="Vertel iets over jezelf..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Beschikbaarheid
            </h3>

            <div className="space-y-6">
              {/* Days */}
              <div>
                <label className="block font-medium text-gray-900 mb-3">Dagen</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        formData.availableDays.includes(day)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day.substring(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block font-medium text-gray-900 mb-3">Tijdsloten</label>
                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => toggleTimeSlot(slot)}
                      className={`w-full py-3 px-4 rounded-lg border-2 text-left font-medium transition-colors ${
                        formData.availableTimes.includes(slot)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Connect Setup */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Betalingsinstellingen
            </h3>

            {user?.stripeConnectOnboardingCompleted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">Stripe Connect Ingesteld</h4>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  Je kunt nu betalingen ontvangen voor je bezorgingen. Uitbetalingen gebeuren automatisch naar je opgegeven bankrekening.
                </p>
                <div className="text-xs text-green-600 space-y-1">
                  <p>• Uitbetalingstermijn: 7 dagen (nieuwe accounts)</p>
                  <p>• Automatische uitbetalingen na elke bezorging</p>
                  <p>• Je ontvangt 88% van de bezorgkosten</p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                  <h4 className="font-semibold text-amber-800">Stripe Connect Vereist</h4>
                </div>
                <p className="text-amber-700 text-sm mb-4">
                  Om betalingen te kunnen ontvangen voor je bezorgingen, moet je eerst je Stripe Connect account opzetten. 
                  Dit is een eenmalige setup die 5 minuten duurt.
                </p>
                <div className="text-xs text-amber-600 mb-4 space-y-1">
                  <p>• Veilige betalingsverwerking via Stripe</p>
                  <p>• Automatische uitbetalingen naar je bankrekening</p>
                  <p>• Je ontvangt 88% van de bezorgkosten</p>
                  <p>• Geen maandelijkse kosten</p>
                </div>
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  {stripeLoading ? 'Bezig...' : 'Stripe Connect Opzetten'}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 text-white py-4 px-6 rounded-lg hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Opslaan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Instellingen Opslaan
              </>
            )}
          </button>
        </div>

        {/* Recent Payouts Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Uitbetalingen</h3>
            
            {payouts.length > 0 ? (
              <div className="space-y-3">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="py-3 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payout.amount)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Order {payout.orderId}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(payout.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nog geen uitbetalingen</p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Tips</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Houd je GPS locatie aan voor matching</li>
              <li>✓ Reageer snel op nieuwe opdrachten</li>
              <li>✓ Communiceer duidelijk met klanten</li>
              <li>✓ Je ontvangt 88% van de bezorgkosten</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
