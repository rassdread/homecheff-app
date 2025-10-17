import './globals.css';
import NavBar from '@/components/NavBar';
import Providers from '@/components/Providers';
import PrivacyNotice from '@/components/PrivacyNotice';
import UserValidation from '@/components/UserValidation';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import VercelAnalytics from '@/components/VercelAnalytics';
import Preloader from '@/components/Preloader';
import ToastNotification from '@/components/notifications/ToastNotification';
import OnlineStatusTracker from '@/components/OnlineStatusTracker';

export const metadata = {
  title: 'HomeCheff',
  description: 'Thuisgemaakt. Thuisgebracht.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <PerformanceMonitor />
          <VercelAnalytics />
          <Preloader />
          <ToastNotification />
          <UserValidation />
          <OnlineStatusTracker />
          <NavBar />
          {children}
          <PrivacyNotice />
        </Providers>
      </body>
    </html>
  );
}
