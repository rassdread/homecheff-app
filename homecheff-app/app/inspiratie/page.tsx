import { Suspense } from 'react';
import InspiratieContent from '@/components/inspiratie/InspiratieContent';

export const metadata = {
  title: 'Inspiratie - HomeCheff',
  description: 'Ontdek recepten, kweken en designs van onze community',
};

export default function InspiratiePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Inspiratie laden...</p>
        </div>
      </div>
    }>
      <InspiratieContent />
    </Suspense>
  );
}

