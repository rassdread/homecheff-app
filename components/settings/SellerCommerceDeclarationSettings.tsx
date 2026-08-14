'use client';

/**
 * LEGAL-1 — settings panel to view/change commerce self-declaration.
 */

import { useCallback, useEffect, useState } from 'react';
import CommerceDeclarationModal, {
  type CommerceDeclarationChoice,
} from '@/components/legal/CommerceDeclarationModal';

type OwnerCommerce = {
  declaration: string;
  needsDeclaration: boolean;
  needsReviewConfirm: boolean;
  publicLabel: string | null;
  registeredBusinessInfoPresent: boolean;
};

export default function SellerCommerceDeclarationSettings() {
  const [commerce, setCommerce] = useState<OwnerCommerce | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/commerce-declaration');
      if (!res.ok) {
        setCommerce(null);
        return;
      }
      const data = await res.json();
      setCommerce(data.commerce ?? null);
    } catch {
      setCommerce(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (declaration: CommerceDeclarationChoice) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/seller/commerce-declaration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declaration }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === 'string' ? data.error : 'Opslaan mislukt',
        );
        return;
      }
      setCommerce(data.commerce ?? null);
      setModalOpen(false);
    } catch {
      setError('Opslaan mislukt');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
        Verkoopstatus laden…
      </div>
    );
  }

  if (!commerce) return null;

  const labelNl =
    commerce.declaration === 'PRIVATE_OCCASIONAL'
      ? 'Particulier / af en toe'
      : commerce.declaration === 'SELF_DECLARED_PROFESSIONAL'
        ? 'Zakelijk / professioneel'
        : 'Nog niet gekozen';

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Hoe bied je aan op HomeCheff?
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Huidige keuze: <span className="font-medium">{labelNl}</span>
        </p>
        {commerce.needsReviewConfirm ? (
          <p className="text-sm text-amber-700 mt-2">
            Controleer je verkoopstatus — je activiteit is veranderd.
          </p>
        ) : null}
        {commerce.registeredBusinessInfoPresent ? (
          <p className="text-xs text-gray-500 mt-2">
            Bedrijfsgegevens (zoals KvK) staan in je profiel. Dat maakt je niet
            automatisch zakelijk in de zin van deze keuze.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        onClick={() => setModalOpen(true)}
      >
        {commerce.declaration === 'UNDECLARED' || commerce.needsReviewConfirm
          ? 'Kies of bevestig status'
          : 'Status aanpassen'}
      </button>

      <CommerceDeclarationModal
        open={modalOpen}
        busy={busy}
        error={error}
        onCancel={() => setModalOpen(false)}
        onConfirm={(d) => void save(d)}
      />
    </div>
  );
}
