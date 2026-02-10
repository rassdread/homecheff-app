'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Gift, ArrowRight, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function WelkomClient({ code, isValid, language = 'nl' }: { code: string; isValid: boolean; language?: 'nl' | 'en' }) {
  const isEnglish = language === 'en';
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const redirectPath = isEnglish ? '/en/inspiratie' : '/inspiratie';
    
    if (!isValid) {
      // Invalid code, redirect immediately
      setTimeout(() => router.push(redirectPath), 2000);
      return;
    }

    // Countdown before redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isValid, router, isEnglish]);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEnglish ? 'Invitation not found' : 'Uitnodiging niet gevonden'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isEnglish 
              ? 'This invitation link is not valid or has expired.' 
              : 'Deze uitnodigingslink is niet geldig of verlopen.'}
          </p>
          <Link
            href={isEnglish ? '/en/inspiratie' : '/inspiratie'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            {isEnglish ? 'Go to HomeCheff' : 'Naar HomeCheff'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center">
        {/* Animated welcome icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-bounce" />
          </div>
        </div>

        {/* Welcome message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {isEnglish ? 'Welcome to HomeCheff! 🎉' : 'Welkom bij HomeCheff! 🎉'}
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-2">
          {isEnglish 
            ? 'You\'ve been invited by a friend' 
            : 'Je bent uitgenodigd door een vriend'}
        </p>
        <p className="text-lg text-gray-600 mb-8">
          {isEnglish
            ? 'Discover local chefs, gardens and designers in your area'
            : 'Ontdek lokale chefs, tuinen en designers in jouw buurt'}
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {isEnglish ? 'Local Community' : 'Lokale Community'}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <Gift className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {isEnglish ? 'Unique Products' : 'Unieke Producten'}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {isEnglish ? 'Trustworthy' : 'Betrouwbaar'}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-4">
          <Link
            href={isEnglish ? '/en/inspiratie' : '/inspiratie'}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            {isEnglish ? 'Explore HomeCheff' : 'Verken HomeCheff'}
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-sm text-gray-500">
            {isEnglish
              ? `You will be redirected automatically in ${countdown} seconds...`
              : `Je wordt automatisch doorgestuurd over ${countdown} seconden...`}
          </p>
        </div>
      </div>
    </div>
  );
}

