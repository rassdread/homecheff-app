import './globals.css';
import NavBar from '@/components/NavBar';
import Providers from '@/components/Providers';
import PrivacyNotice from '@/components/PrivacyNotice';

export const metadata = {
  title: 'HomeCheff',
  description: 'Thuisgemaakt. Thuisgebracht.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <NavBar />
          {children}
          <PrivacyNotice />
        </Providers>
      </body>
    </html>
  );
}
