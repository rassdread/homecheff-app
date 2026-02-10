'use client';

import { useState } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { checkAgeRequirement, ROLE_REQUIREMENTS } from '@/lib/role-requirements';
import { useTranslation } from '@/hooks/useTranslation';

const SELLER_ROLES = [
  {
    id: 'chef',
    title: 'Chef',
    description: 'Verkoop je culinaire creaties',
    icon: '👨‍🍳',
    gradient: 'from-orange-100 to-red-100 border-orange-200',
    textColor: 'text-orange-700',
    bgGradient: 'from-orange-500 to-red-500',
    features: ['Gerechten verkopen', 'Bezorging & ophalen', 'Reviews ontvangen']
  },
  {
    id: 'garden',
    title: 'Tuinier',
    description: 'Deel je groenten en kruiden',
    icon: '🌱',
    gradient: 'from-green-100 to-emerald-100 border-green-200',
    textColor: 'text-green-700',
    bgGradient: 'from-green-500 to-emerald-500',
    features: ['Groenten verkopen', 'Seizoensproducten', 'Lokale community']
  },
  {
    id: 'designer',
    title: 'Designer',
    description: 'Verkoop je handgemaakte items',
    icon: '🎨',
    gradient: 'from-purple-100 to-pink-100 border-purple-200',
    textColor: 'text-purple-700',
    bgGradient: 'from-purple-500 to-pink-500',
    features: ['Handwerk verkopen', 'Custom orders', 'Portfolio opbouwen']
  }
];

interface AddSellerRolesSettingsProps {
  currentRoles: string[];
  age: number;
  onSave: (newRoles: string[], agreements: any) => Promise<void>;
}

export default function AddSellerRolesSettings({ currentRoles, age, onSave }: AddSellerRolesSettingsProps) {
  const { t } = useTranslation();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [showAgreements, setShowAgreements] = useState(false);
  const [agreements, setAgreements] = useState({
    privacyPolicy: false,
    terms: false,
    taxResponsibility: false,
    marketing: false,
    parentalConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [ageErrors, setAgeErrors] = useState<Record<string, string>>({});

  const newRoles = selectedRoles.filter(role => !currentRoles.includes(role));
  const hasNewRoles = newRoles.length > 0;

  // Check which agreements are required for new roles
  const requiresPrivacy = newRoles.some(r => ROLE_REQUIREMENTS[r]?.agreements.privacyPolicy);
  const requiresTerms = newRoles.some(r => ROLE_REQUIREMENTS[r]?.agreements.terms);
  const requiresTax = newRoles.some(r => ROLE_REQUIREMENTS[r]?.agreements.taxResponsibility);
  const requiresParental = age < 18;
  
  const allAgreed = 
    (!requiresPrivacy || agreements.privacyPolicy) &&
    (!requiresTerms || agreements.terms) &&
    (!requiresTax || agreements.taxResponsibility) &&
    (!requiresParental || agreements.parentalConsent);

  const toggleRole = (roleId: string) => {
    if (currentRoles.includes(roleId)) {
      return;
    }

    const ageCheck = checkAgeRequirement(age, roleId);
    
    if (!ageCheck.allowed) {
      setAgeErrors(prev => ({ ...prev, [roleId]: ageCheck.message || 'Niet toegestaan' }));
      return;
    }

    if (selectedRoles.includes(roleId)) {
      setAgeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[roleId];
        return newErrors;
      });
    }

    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleContinue = () => {
    if (hasNewRoles) {
      setShowAgreements(true);
    }
  };

  const handleSave = async () => {
    if ((requiresPrivacy && !agreements.privacyPolicy) ||
        (requiresTerms && !agreements.terms) ||
        (requiresTax && !agreements.taxResponsibility) ||
        (requiresParental && !agreements.parentalConsent)) {
      alert(t('errors.acceptAllTermsRequired'));
      return;
    }

    setLoading(true);
    try {
      await onSave(selectedRoles, { ...agreements, age });
      setShowAgreements(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6 text-primary-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Extra Verkoper Rollen</h2>
          <p className="text-sm text-gray-600">Voeg verkoper rollen toe naast je bezorgprofiel</p>
        </div>
      </div>

      {showAgreements ? (
        /* Agreements Screen */
        <div className="space-y-6">
          {/* Selected New Roles */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5">
            <p className="font-semibold text-blue-900 mb-3">Je voegt toe:</p>
            <div className="flex flex-wrap gap-2">
              {newRoles.map(roleId => {
                const role = SELLER_ROLES.find(r => r.id === roleId);
                return role ? (
                  <span key={roleId} className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg font-bold text-sm shadow-sm">
                    {role.icon} {role.title}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Required Agreements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">{t('delivery.requiredAgreements')}</h3>
            </div>

            {/* Privacy Policy */}
            {requiresPrivacy && <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              agreements.privacyPolicy 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={agreements.privacyPolicy}
                onChange={(e) => setAgreements(prev => ({ ...prev, privacyPolicy: e.target.checked }))}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Privacybeleid <span className="text-red-500">*</span>
                </p>
                <p className="text-sm text-gray-600">
                  Ik accepteer het{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    privacybeleid
                  </a>
                  {' '}van HomeCheff en begrijp hoe mijn gegevens worden verwerkt als verkoper.
                </p>
              </div>
              {agreements.privacyPolicy && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </label>}

            {/* Terms of Service */}
            {requiresTerms && <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              agreements.terms 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={agreements.terms}
                onChange={(e) => setAgreements(prev => ({ ...prev, terms: e.target.checked }))}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Algemene Voorwaarden <span className="text-red-500">*</span>
                </p>
                <p className="text-sm text-gray-600">
                  Ik accepteer de{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    algemene voorwaarden
                  </a>
                  {' '}voor verkopen op het HomeCheff platform.
                </p>
              </div>
              {agreements.terms && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </label>}

            {/* Tax Responsibility */}
            {requiresTax && <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              agreements.taxResponsibility 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={agreements.taxResponsibility}
                onChange={(e) => setAgreements(prev => ({ ...prev, taxResponsibility: e.target.checked }))}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Belastingverantwoordelijkheid <span className="text-red-500">*</span>
                </p>
                <p className="text-sm text-gray-600">
                  Ik begrijp dat ik zelf verantwoordelijk ben voor het aangeven van mijn inkomsten bij de belastingdienst. HomeCheff is niet verantwoordelijk voor mijn belastingverplichtingen.
                </p>
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  ⚠️ Belangrijk: Als ondernemer ben je verplicht je inkomsten aan te geven
                </p>
              </div>
              {agreements.taxResponsibility && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </label>}

            {/* Parental Consent (if under 18) */}
            {requiresParental && <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              agreements.parentalConsent 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-white border-orange-200 hover:border-orange-300'
            }`}>
              <input
                type="checkbox"
                checked={agreements.parentalConsent}
                onChange={(e) => setAgreements(prev => ({ ...prev, parentalConsent: e.target.checked }))}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Toestemming Ouders/Verzorgers <span className="text-red-500">*</span>
                </p>
                <p className="text-sm text-gray-600">
                  Mijn ouders/verzorgers geven toestemming voor mijn deelname als verkoper op HomeCheff. 
                  Zij begrijpen en accepteren de voorwaarden en verantwoordelijkheden.
                </p>
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  🔞 Je bent jonger dan 18, daarom is ouderlijke toestemming verplicht
                </p>
              </div>
              {agreements.parentalConsent && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </label>}

            {/* Marketing (Optional) */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              agreements.marketing 
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={agreements.marketing}
                onChange={(e) => setAgreements(prev => ({ ...prev, marketing: e.target.checked }))}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Marketing Communicatie <span className="text-gray-400 text-sm">(Optioneel)</span>
                </p>
                <p className="text-sm text-gray-600">
                  Ik wil tips, updates en aanbiedingen ontvangen over mijn verkoper activiteiten.
                </p>
              </div>
              {agreements.marketing && (
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </label>
          </div>

          {/* Agreement Summary */}
          <div className={`p-4 rounded-xl border-2 ${
            allAgreed 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
              : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
          }`}>
            <div className="flex items-center gap-3">
              {allAgreed ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold text-green-900">Klaar om door te gaan!</p>
                    <p className="text-sm text-green-700">Alle vereiste akkoorden zijn geaccepteerd</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="font-bold text-orange-900">{t('delivery.requiredAgreementsMissing')}</p>
                    <p className="text-sm text-orange-700">
                      {t('delivery.acceptAllRequiredConditions')} (<span className="text-red-500">*</span>)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAgreements(false);
                setSelectedRoles(currentRoles);
                setAgreements({
                  privacyPolicy: false,
                  terms: false,
                  taxResponsibility: false,
                  marketing: false,
                  parentalConsent: false
                });
              }}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSave}
              disabled={!allAgreed || loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Opslaan...' : 'Rollen Activeren'}
            </Button>
          </div>
        </div>
      ) : (
        /* Role Selection Screen */
        <div className="space-y-6">
          {/* Current Roles */}
          {currentRoles.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-900 mb-2">✅ Actieve Rollen:</p>
              <div className="flex flex-wrap gap-2">
                {currentRoles.map(roleId => {
                  const role = SELLER_ROLES.find(r => r.id === roleId);
                  return role ? (
                    <span key={roleId} className="px-3 py-1.5 bg-white border border-green-300 text-green-700 rounded-lg font-semibold text-sm">
                      {role.icon} {role.title}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Available Roles */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Kies Extra Rollen:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SELLER_ROLES.map(role => {
                const isCurrentRole = currentRoles.includes(role.id);
                const isSelected = selectedRoles.includes(role.id);
                
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    disabled={isCurrentRole}
                    className={`
                      relative p-6 rounded-xl border-2 transition-all text-left transform hover:scale-105
                      ${isCurrentRole 
                        ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? `bg-gradient-to-br ${role.gradient} shadow-xl ring-4 ring-offset-2 ${role.textColor.replace('text-', 'ring-')}`
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                      }
                    `}
                  >
                    {/* Badge */}
                    {isCurrentRole && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                        ACTIEF
                      </div>
                    )}
                    
                    {isSelected && !isCurrentRole && (
                      <div className="absolute top-3 right-3">
                        <div className={`w-8 h-8 bg-gradient-to-r ${role.bgGradient} rounded-full flex items-center justify-center shadow-lg`}>
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="text-5xl mb-4">{role.icon}</div>
                    <h4 className="text-2xl font-bold mb-2">{role.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    
                    <div className="space-y-2">
                      {role.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${role.bgGradient} flex items-center justify-center`}>
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Age Error Message */}
                    {ageErrors[role.id] && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900">Leeftijdsbeperking</p>
                            <p className="text-xs text-red-700 mt-1">{ageErrors[role.id]}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Errors Summary */}
          {Object.keys(ageErrors).length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900 mb-2">Leeftijdsbeperkingen</p>
                  <ul className="space-y-1">
                    {Object.entries(ageErrors).map(([roleId, error]) => (
                      <li key={roleId} className="text-sm text-red-700">
                        • <strong>{SELLER_ROLES.find(r => r.id === roleId)?.title}:</strong> {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Continue Button */}
          {hasNewRoles && (
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 rounded-xl shadow-lg text-lg"
            >
              Doorgaan → Akkoorden Accepteren
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
