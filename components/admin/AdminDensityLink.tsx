'use client';

import { useTranslation } from '@/hooks/useTranslation';

export function AdminDensityLink() {
  const { tOr } = useTranslation();
  return (
    <p className="bg-gray-50 px-4 pt-4 text-sm">
      <a href="/admin/vlaardingen-density" className="text-emerald-800 underline">
        {tOr('admin.vlaardingenDensity', 'Vlaardingen density', 'Dichtheid in Vlaardingen')}
      </a>
    </p>
  );
}
