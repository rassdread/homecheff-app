'use client';

import { useState } from 'react';
import { Package, MapPin, Clock, MessageSquare } from 'lucide-react';

interface OrderUpdateFormProps {
  orderId: string;
  currentStatus: string;
  currentPickupAddress?: string;
  currentDeliveryAddress?: string;
  currentPickupDate?: string;
  currentDeliveryDate?: string;
  onUpdate: (data: any) => void;
}

export default function OrderUpdateForm({
  orderId,
  currentStatus,
  currentPickupAddress,
  currentDeliveryAddress,
  currentPickupDate,
  currentDeliveryDate,
  onUpdate
}: OrderUpdateFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [pickupAddress, setPickupAddress] = useState(currentPickupAddress || '');
  const [deliveryAddress, setDeliveryAddress] = useState(currentDeliveryAddress || '');
  const [pickupDate, setPickupDate] = useState(
    currentPickupDate ? new Date(currentPickupDate).toISOString().slice(0, 16) : ''
  );
  const [deliveryDate, setDeliveryDate] = useState(
    currentDeliveryDate ? new Date(currentDeliveryDate).toISOString().slice(0, 16) : ''
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    { value: 'PENDING', label: 'In behandeling', icon: '⏳' },
    { value: 'CONFIRMED', label: 'Bevestigd', icon: '✅' },
    { value: 'PROCESSING', label: 'Wordt verwerkt', icon: '🔄' },
    { value: 'SHIPPED', label: 'Verzonden', icon: '🚚' },
    { value: 'DELIVERED', label: 'Bezorgd', icon: '🎉' },
    { value: 'CANCELLED', label: 'Geannuleerd', icon: '❌' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: any = { status };

      if (pickupAddress) updateData.pickupAddress = pickupAddress;
      if (deliveryAddress) updateData.deliveryAddress = deliveryAddress;
      if (pickupDate) updateData.pickupDate = pickupDate;
      if (deliveryDate) updateData.deliveryDate = deliveryDate;
      if (notes) updateData.notes = notes;

      await onUpdate(updateData);

      // Reset form
      setNotes('');
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Package className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Bestelling bijwerken</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Update */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pickup Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Afhaaladres
          </label>
          <textarea
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="Voer het afhaaladres in..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Dit adres wordt automatisch naar de koper gestuurd wanneer de bestelling klaar is
          </p>
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Bezorgadres
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Voer het bezorgadres in..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Dit adres wordt gebruikt voor bezorging en gedeeld met de koper
          </p>
        </div>

        {/* Pickup Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Afhaaldatum en tijd
          </label>
          <input
            type="datetime-local"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Delivery Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Bezorgdatum en tijd
          </label>
          <input
            type="datetime-local"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Extra opmerkingen
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Voeg extra informatie toe voor de koper..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Deze opmerkingen worden naar de koper gestuurd via de chat
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Bijwerken...' : 'Bestelling bijwerken en koper informeren'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Alle wijzigingen worden automatisch naar de koper gestuurd via de chat 
          met de bestelling hashtag, zodat ze altijd op de hoogte zijn van de status.
        </p>
      </div>
    </div>
  );
}



