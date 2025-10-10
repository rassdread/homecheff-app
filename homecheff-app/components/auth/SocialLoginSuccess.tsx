'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, User, Mail, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function SocialLoginSuccess() {
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data after social login
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Je profiel wordt geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welkom bij HomeCheff! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Je account is succesvol aangemaakt via social login
        </p>

        {/* User Profile Preview */}
        {userData && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Je profiel informatie
            </h3>
            
            <div className="space-y-3">
              {/* Profile Image */}
              {userData.profileImage && (
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center">
                    <img 
                      src={userData.profileImage} 
                      alt="Profielfoto" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700 font-medium">{userData.name}</span>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">{userData.email}</span>
              </div>

              {/* Username */}
              <div className="flex items-center space-x-3">
                <span className="w-5 h-5 text-emerald-600 font-bold">@</span>
                <span className="text-gray-700">@{userData.username}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link 
            href="/profile"
            className="w-full inline-flex justify-center items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-2xl hover:bg-emerald-700 transition-colors duration-200"
          >
            Bekijk je profiel
          </Link>
          
          <Link 
            href="/"
            className="w-full inline-flex justify-center items-center px-6 py-3 border-2 border-emerald-200 text-emerald-700 font-semibold rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors duration-200"
          >
            Verken HomeCheff
          </Link>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-6">
          Je kunt je profiel altijd aanpassen in de instellingen
        </p>
      </div>
    </div>
  );
}
