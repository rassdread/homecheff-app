"use client";
import React, { useState } from "react";
import DynamicAddressFields, { AddressData } from '@/components/ui/DynamicAddressFields';
import { useTranslation } from "@/hooks/useTranslation";

type PlaceState = {
  addressData: AddressData;
  description: string;
  error: string | null;
  success: boolean;
};

export default function PlacePage() {
  const { t } = useTranslation();
  const [state, setState] = useState<PlaceState>({
    addressData: {
      address: "",
      postalCode: "",
      houseNumber: "",
      city: "",
      country: "NL",
      lat: null,
      lng: null,
    },
    description: "",
    error: null,
    success: false,
  });

  const handleSave = () => {
    if (!state.addressData.address || !state.description) {
      setState({ ...state, error: t('place.fillAllFields') || "Vul alle velden in.", success: false });
      return;
    }
    if (!state.addressData.lat || !state.addressData.lng) {
      setState({ ...state, error: t('place.addressMustBeValidated') || "Adres moet gevalideerd zijn (selecteer een suggestie uit de lijst).", success: false });
      return;
    }
    setState({ ...state, error: null, success: true });
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="w-full border-b" style={{ borderColor: "#e5e7eb", background: "#fff" }}>
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{t('place.addLocation') || 'Locatie toevoegen'}</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-8 grid gap-8">
        <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4 p-3 rounded" style={{ borderColor: "var(--accent)" }}>
          {t('place.description') || 'Voeg een locatie toe voor je product, dienst of ruimte. Vul het adres en een korte omschrijving in.'}
        </div>
        <div className="rounded-xl bg-white p-6 border" style={{ borderColor: "#e5e7eb" }}>
          <div className="mb-4">
            <DynamicAddressFields
              value={state.addressData}
              onChange={(data) => {
                setState(prev => ({ ...prev, addressData: data, error: null }));
              }}
              onGeocode={(data) => {
                setState(prev => ({
                  ...prev,
                  addressData: {
                    ...prev.addressData,
                    lat: data.lat,
                    lng: data.lng,
                  },
                }));
              }}
              required={true}
              showValidation={true}
              geocodingEnabled={true}
              showCountrySelector={true}
            />
          </div>
          <textarea
            value={state.description}
            onChange={e => setState({ ...state, description: e.target.value, error: null })}
            placeholder={t('place.descriptionPlaceholder') || 'Omschrijving'}
            className="mb-4 px-3 py-2 border rounded w-full"
            rows={4}
          />
          <button className="px-4 py-2 rounded text-white" style={{ background: "var(--primary)" }} onClick={handleSave}>
            {t('common.save') || 'Opslaan'}
          </button>
          {state.error && <div className="mt-2 text-red-600">{state.error}</div>}
          {state.success && <div className="mt-2 text-green-600">{t('place.locationSavedSuccess') || 'Locatie succesvol opgeslagen!'}</div>}
        </div>
      </section>
    </main>
  );
}
