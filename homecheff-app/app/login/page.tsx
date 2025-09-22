"use client";
import React, { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { clearAllUserData } from "@/lib/session-cleanup";

type LoginState = {
  emailOrUsername: string;
  password: string;
  rememberMe: boolean;
  error: string | null;
  success: boolean;
  isLoading: boolean;
  showPassword: boolean;
  loginMethod: 'email' | 'username';
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LoginState>({
    emailOrUsername: "",
    password: "",
    rememberMe: false,
    error: null,
    success: false,
    isLoading: false,
    showPassword: false,
    loginMethod: 'email',
  });

  const message = searchParams?.get('message');
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.emailOrUsername || !state.password) {
      setState({ ...state, error: "Vul alle velden in.", success: false });
      return;
    }
    
    // Only validate email format if login method is email
    if (state.loginMethod === 'email' && !state.emailOrUsername.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setState({
        ...state,
        error: "Voer een geldig e-mailadres in.",
        success: false,
      });
      return;
    }

    setState({ ...state, isLoading: true, error: null });

    try {
      // Clear all user data before login to prevent data leakage
      clearAllUserData();
      
      const result = await signIn("credentials", {
        redirect: false,
        emailOrUsername: state.emailOrUsername,
        password: state.password,
      });

      if (result?.error) {
        setState({ 
          ...state, 
          error: "Ongeldige inloggegevens. Controleer je email en wachtwoord.", 
          success: false,
          isLoading: false
        });
        return;
      }

      setState({ ...state, error: null, success: true, isLoading: false });
      
      // Check if user is authenticated
      const session = await getSession();
      if (session) {
        // Check if user has delivery profile and redirect accordingly
        try {
          const profileResponse = await fetch('/api/delivery/profile');
          if (profileResponse.ok) {
            // User has delivery profile, redirect to delivery dashboard
            router.push('/delivery/dashboard');
            return;
          }
        } catch (error) {
          // User doesn't have delivery profile, continue with normal redirect
        }
        
        // Default redirect
        router.push(callbackUrl);
      }
    } catch (error) {
      setState({ 
        ...state, 
        error: "Er is een fout opgetreden. Probeer het opnieuw.", 
        success: false,
        isLoading: false
      });
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setState({ ...state, isLoading: true, error: null });
    
    try {
      // For social login, we'll use a custom callback URL that checks for delivery profile
      await signIn(provider, { 
        callbackUrl: '/api/auth/callback/delivery-redirect',
        redirect: true 
      });
    } catch (error) {
      setState({ 
        ...state, 
        error: "Er is een fout opgetreden bij het inloggen met " + provider + ".", 
        success: false,
        isLoading: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welkom terug</h1>
            <p className="mt-2 text-sm text-gray-600">
              Log in om toegang te krijgen tot je account
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <span className="text-sm text-gray-500">Nog geen account?</span>
              <Link 
                href="/register" 
                className="text-primary-brand hover:text-primary-700 font-medium text-sm"
              >
                Registreren
              </Link>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-3" />
                <p className="text-sm text-blue-800">{message}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  {state.loginMethod === 'email' ? 'Email adres' : 'Gebruikersnaam'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type={state.loginMethod === 'email' ? 'email' : 'text'}
                    autoComplete={state.loginMethod === 'email' ? 'email' : 'username'}
                    required
                    value={state.emailOrUsername}
                    onChange={(e) => setState({ ...state, emailOrUsername: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder={state.loginMethod === 'email' ? 'je@email.com' : 'je_gebruikersnaam'}
                  />
                </div>
                
                {/* Login Method Toggle */}
                <div className="flex items-center justify-center space-x-4 text-sm mt-3">
                  <button
                    type="button"
                    onClick={() => setState({ ...state, loginMethod: 'email', emailOrUsername: '' })}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      state.loginMethod === 'email' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'text-gray-500 hover:text-emerald-600'
                    }`}
                  >
                    Email
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => setState({ ...state, loginMethod: 'username', emailOrUsername: '' })}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      state.loginMethod === 'username' 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'text-gray-500 hover:text-primary-brand'
                    }`}
                  >
                    Gebruikersnaam
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Wachtwoord
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={state.showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={state.password}
                    onChange={(e) => setState({ ...state, password: e.target.value })}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
                    placeholder="Je wachtwoord"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setState({ ...state, showPassword: !state.showPassword })}
                  >
                    {state.showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={state.rememberMe}
                    onChange={(e) => setState({ ...state, rememberMe: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Ingelogd blijven
                  </label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>

              {/* Error/Success Messages */}
              {state.error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-700">{state.error}</span>
                </div>
              )}

              {state.success && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700">Succesvol ingelogd!</span>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={state.isLoading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Inloggen...</span>
                  </>
                ) : (
                  <>
                    <span>Inloggen</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Of log in met</span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={state.isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <button
                onClick={() => handleSocialLogin("facebook")}
                disabled={state.isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Door in te loggen ga je akkoord met onze{" "}
              <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Algemene Voorwaarden
              </Link>{" "}
              en{" "}
              <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Privacybeleid
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
