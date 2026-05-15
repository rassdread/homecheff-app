import type { Metadata } from 'next';
import DeleteAccountPublicContent from '@/components/legal/DeleteAccountPublicContent';

export const metadata: Metadata = {
  title: 'Account verwijderen — HomeCheff',
  description:
    'Lees hoe je je HomeCheff-account en persoonsgegevens kunt verwijderen, wat er direct gebeurt en welke gegevens tijdelijk bewaard kunnen blijven.',
  alternates: {
    canonical: 'https://homecheff.eu/delete-account/',
  },
  openGraph: {
    title: 'Account verwijderen — HomeCheff',
    description:
      'Verwijder je HomeCheff-account via de app of vraag ondersteuning. Duidelijke uitleg over gegevensverwijdering en bewaartermijnen.',
    url: 'https://homecheff.eu/delete-account/',
    siteName: 'HomeCheff',
    locale: 'nl_NL',
    type: 'website',
  },
};

export default function DeleteAccountPage() {
  return <DeleteAccountPublicContent />;
}
