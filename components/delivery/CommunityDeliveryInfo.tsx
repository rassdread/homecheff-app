'use client';

import { Users, Shield, Heart, Clock, MapPin, CheckCircle } from 'lucide-react';

/** Local delivery provider info panel (legacy teen-delivery component surface). */
export default function CommunityDeliveryInfo() {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
      <div className="flex items-start gap-4">
        <div className="bg-primary-brand text-white p-3 rounded-full">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary-brand mb-2">
            Lokale bezorgaanbieders via HomeCheff
          </h3>
          <p className="text-gray-700 mb-4">
            HomeCheff faciliteert het contact en de boeking. Transport wordt
            uitgevoerd door een zelfstandige bezorgaanbieder — niet door HomeCheff
            als vervoerder of werkgever.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Commercieel vanaf 18 jaar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-red-600" />
              <span>Zelfstandige bezorgaanbieders</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Flexibele beschikbaarheid</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Lokale bezorgradius</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-primary-100 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Hoe werkt het?</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Je kiest of gebruikt een lokale bezorgaanbieder via HomeCheff</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>De aanbieder accepteert of weigert het verzoek</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Transport wordt uitgevoerd door de gekozen aanbieder</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
