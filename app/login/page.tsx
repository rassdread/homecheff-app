"use client";
import React, { useState, useEffect, Suspense } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { clearAllUserData } from "@/lib/session-cleanup";
import { useTranslation } from "@/hooks/useTranslation";
import { trackLogin } from "@/components/GoogleAnalytics";
import { isSafari, isIOS, getSafariCookieDelay, safeSessionStorageGetItem, safeSessionStorageSetItem, safeSessionStorageRemoveItem } from "@/lib/browser-utils";

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
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const { t, isReady, isLoading } = useTranslation();
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
  const oauthError = searchParams?.get('error');
  const prefillEmail = searchParams?.get('email');
  
  // Pre-fill email if provided in URL (bijv. na registratie)
  useEffect(() => {
    if (prefillEmail && !state.emailOrUsername) {
      setState(prev => ({ ...prev, emailOrUsername: prefillEmail, loginMethod: 'email' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEmail]);

  // Redirect if already logged in
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      // Already logged in, redirect to home
      router.push('/inspiratie');
    }
  }, [sessionStatus, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.emailOrUsername || !state.password) {
      setState({ ...state, error: t('login.errors.fillAllFields'), success: false });
      return;
    }
    
    // Only validate email format if login method is email
    if (state.loginMethod === 'email') {
      if (!state.emailOrUsername.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        setState({
          ...state,
          error: t('login.errors.invalidEmail'),
          success: false,
        });
        return;
      }
    } else {
      // Validate username format
      if (state.emailOrUsername.length < 3) {
        setState({
          ...state,
          error: t('login.errors.usernameMinLength'),
          success: false,
        });
        return;
      }
    }

    setState({ ...state, isLoading: true, error: null });

    try {
      // Clear all user data before login to prevent data leakage (only once per session)
      // Safari-compatibele versie: gebruik safe sessionStorage helpers
      const hasCleared = safeSessionStorageGetItem('login_cleared');
      if (!hasCleared) {
        clearAllUserData();
        safeSessionStorageSetItem('login_cleared', 'true');
      }
      
      const result = await signIn("credentials", {
        redirect: false,
        emailOrUsername: state.emailOrUsername,
        password: state.password,
      });

      if (result?.error) {
        setState({ 
          ...state, 
          error: t('login.errors.invalidCredentials'), 
          success: false,
          isLoading: false
        });
        return;
      }

      setState({ ...state, error: null, success: true, isLoading: false });
      
      // Track login in Google Analytics
      try {
        trackLogin('email');
      } catch (gaError) {
        console.error('Failed to track login in GA:', gaError);
        // Don't fail login if GA tracking fails
      }
      
      // Clear the login cleared flag - Safari-compatibele versie
      safeSessionStorageRemoveItem('login_cleared');
      
      // iOS Safari needs significantly more time for cookies to be set
      const isIOSDevice = isIOS();
      const isSafariOnIOS = isSafari() && isIOS();
      const initialDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : getSafariCookieDelay();
      
      console.log('🔍 [LOGIN] Device detection:', {
        isIOS: isIOSDevice,
        isSafariOnIOS: isSafariOnIOS,
        initialDelay
      });
      
      // Initial wait for cookies to be set (especially important for iOS Safari)
      await new Promise(resolve => setTimeout(resolve, initialDelay));
      
      // Update session to ensure it's fresh
      if (typeof updateSession === "function") {
        try {
          await updateSession({});
          // Wait longer for session to update (iOS Safari needs more time)
          const updateDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
          await new Promise(resolve => setTimeout(resolve, updateDelay));
        } catch (sessionError) {
          console.warn('Session update warning (non-critical):', sessionError);
        }
      }
      
      // iOS Safari: Retry multiple times with longer delays
      let currentSession = await getSession();
      const maxRetries = isSafariOnIOS ? 3 : isIOSDevice ? 2 : 1;
      const retryDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
      
      for (let attempt = 0; attempt < maxRetries && !currentSession?.user?.email; attempt++) {
        console.log(`🔍 [LOGIN] No session after login, retry attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        currentSession = await getSession();
        
        if (currentSession?.user?.email) {
          console.log('✅ [LOGIN] Session found after retry!');
          break;
        }
      }
      
      // If still no session after all retries, try one more time with API call
      if (!currentSession?.user?.email) {
        console.log('🔍 [LOGIN] Trying API session check as last resort...');
        try {
          const apiResponse = await fetch('/api/auth/session');
          if (apiResponse.ok) {
            const apiSession = await apiResponse.json();
            if (apiSession?.user?.email) {
              console.log('✅ [LOGIN] Session found via API!');
              currentSession = apiSession;
            }
          }
        } catch (apiError) {
          console.error('❌ [LOGIN] API session check failed:', apiError);
        }
      }
      
      // Final check - if still no session, try one more approach for iOS Safari
      if (!currentSession?.user?.email) {
        // On iOS Safari, cookies might be set but not immediately readable
        // Try a hard refresh approach: redirect to callbackUrl with a refresh parameter
        // The destination page will check session again after page load
        if (isSafariOnIOS || isIOSDevice) {
          console.warn('⚠️ [LOGIN] No session found after retries on iOS, using refresh redirect');
          const finalRedirectUrl = callbackUrl && callbackUrl !== '/' 
            ? callbackUrl + (callbackUrl.includes('?') ? '&' : '?') + 'welcome=true&_refresh=1'
            : '/inspiratie?welcome=true&_refresh=1';
          
          // Use window.location.replace to avoid back button issues
          window.location.replace(finalRedirectUrl);
          return;
        }
        
        // For other browsers, show error
        console.warn('⚠️ [LOGIN] No session found after all retries');
        setState({ 
          ...state, 
          error: t('login.errors.sessionFailed') || 'Inloggen gelukt, maar sessie kon niet worden gezet. Probeer de pagina te verversen.', 
          success: false,
          isLoading: false
        });
        return;
      }
      
      // iOS Safari: Wait a bit more before redirect to ensure cookies are fully set
      const redirectDelay = isSafariOnIOS ? 500 : isIOSDevice ? 400 : 200;
      await new Promise(resolve => setTimeout(resolve, redirectDelay));
      
      // Force session refresh and redirect
      // Use callbackUrl if provided, otherwise default to inspiratie
      const finalRedirectUrl = callbackUrl && callbackUrl !== '/' 
        ? callbackUrl + (callbackUrl.includes('?') ? '&' : '?') + 'welcome=true'
        : '/inspiratie?welcome=true';
      
      // Gebruik window.location.href voor betere Safari-compatibiliteit
      // Op iOS Safari: gebruik replace om back button issues te voorkomen
      if (isSafariOnIOS || isIOSDevice) {
        window.location.replace(finalRedirectUrl);
      } else {
        window.location.href = finalRedirectUrl;
      }
    } catch (error) {
      setState({ 
        ...state, 
        error: t('login.errors.genericError'), 
        success: false,
        isLoading: false
      });
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setState({ ...state, isLoading: true, error: null });
    
    // Track social login attempt in Google Analytics
    try {
      trackLogin(provider as 'google' | 'facebook');
    } catch (gaError) {
      console.error('Failed to track social login in GA:', gaError);
      // Don't fail login if GA tracking fails
    }
    
    try {
      // For social login, redirect to registration page to complete profile
      await signIn(provider, { 
        callbackUrl: '/register?social=true',
        redirect: true 
      });
    } catch (error) {
      setState({ 
        ...state, 
        error: t('login.errors.socialLoginError', { provider }), 
        success: false,
        isLoading: false
      });
    }
  };

  // Don't render content until translations are loaded or if already authenticated
  if (!isReady || isLoading || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (sessionStatus === 'authenticated' && session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Je bent al ingelogd, doorverwijzen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">{t('login.title')}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {t('login.subtitle')}
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <span className="text-sm text-gray-500">{t('login.noAccount')}</span>
              <Link 
                href="/register" 
                className="text-primary-brand hover:text-primary-700 font-medium text-sm"
              >
                {t('login.register')}
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

          {/* OAuth Error Alert */}
          {oauthError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    {oauthError === 'OAuthCallback' 
                      ? t('login.errors.oauthCallbackError') || 'Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.'
                      : t('login.errors.oauthError') || 'Er is een fout opgetreden bij het inloggen met social media.'}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {t('login.errors.tryAgain') || 'Probeer opnieuw in te loggen of gebruik je email en wachtwoord.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  {state.loginMethod === 'email' ? t('login.email') : t('login.username')}
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
                    placeholder={state.loginMethod === 'email' ? t('login.emailPlaceholder') : t('login.usernamePlaceholder')}
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
                    {t('login.email')}
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
                    {t('login.username')}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('login.password')}
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
                    placeholder={t('login.passwordPlaceholder')}
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
                    {t('login.rememberMe')}
                  </label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {t('login.forgotPassword')}
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
                  <span className="text-sm text-green-700">{t('login.success')}</span>
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
                    <span>{t('login.loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.loginButton')}</span>
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
                  <span className="px-2 bg-white text-gray-500">{t('login.orLoginWith')}</span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons - HomeCheff Style */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSocialLogin("google");
                }}
                disabled={state.isLoading}
                className="w-full inline-flex justify-center items-center px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-sm bg-white text-base font-semibold text-gray-800 hover:border-emerald-300 hover:bg-emerald-50 active:bg-emerald-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              >
                <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="group-hover:text-emerald-700 transition-colors duration-200">{t('login.loginWithGoogle')}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSocialLogin("facebook");
                }}
                disabled={state.isLoading}
                className="w-full inline-flex justify-center items-center px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-sm bg-white text-base font-semibold text-gray-800 hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              >
                <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="group-hover:text-blue-700 transition-colors duration-200">{t('login.loginWithFacebook')}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('login.footer')}{" "}
              <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
                {t('login.terms')}
              </Link>{" "}
              {t('login.and')}{" "}
              <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                {t('login.privacy')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
