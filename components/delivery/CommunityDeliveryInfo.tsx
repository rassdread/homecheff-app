'use client';

import { Users, Shield, Heart, Clock, MapPin, GraduationCap, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function TeenDeliveryInfo() {
  const { t } = useTranslation();
  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
      <div className="flex items-start gap-4">
        <div className="bg-primary-brand text-white p-3 rounded-full">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary-brand mb-2">
            {t('admin.teenDeliveryTitle')}
          </h3>
          <p className="text-gray-700 mb-4">
            {t('admin.teenDeliveryDescription')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>{t('admin.teenDeliveryLegal')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-red-600" />
              <span>{t('admin.teenDeliveryYouthWork')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Flexibele tijdsloten</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Maximaal 3km radius</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-primary-100 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary-brand" />
              Nederlandse Wetgeving
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Kinderen vanaf 15 jaar mogen kranten en reclamefolders bezorgen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Beperkte werktijden en rusttijden</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Geen ochtendkranten (veiligheid)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-primary-100">
            <h4 className="font-semibold text-gray-900 mb-2">Hoe werkt het?</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Je bestelling wordt gedeeld met geverifieerde jongeren (15-17 jaar)</li>
              <li>2. Een jongere in de buurt accepteert de bezorging</li>
              <li>3. Je ontvangt een bericht met bezorger details en leeftijd</li>
              <li>4. Bezorger haalt je bestelling op en bezorgt deze</li>
              <li>5. Jij betaalt de bezorger direct via de app</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
