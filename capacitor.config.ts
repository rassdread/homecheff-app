import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homecheff.app',
  appName: 'HomeCheff',
  webDir: 'dist',
  /** Wit achter WebView vóór eerste paint (Capacitor Android past dit toe in Bridge.initWebView). */
  backgroundColor: '#ffffff',
  /**
   * Zonder `url`: Android laadt gebundelde `webDir` (lokale startup-shell), daarna navigeert de shell naar homecheff.eu.
   * Alleen zetten voor dev: CAPACITOR_SERVER_URL=http://localhost:3000 (+ eventueel CAPACITOR_ANDROID_CLEARTEXT=true).
   */
  server: process.env.CAPACITOR_SERVER_URL
    ? {
        androidScheme: 'https',
        url: process.env.CAPACITOR_SERVER_URL,
        ...(process.env.CAPACITOR_ANDROID_CLEARTEXT === 'true'
          ? { cleartext: true }
          : {}),
      }
    : {
        androidScheme: 'https',
      },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'AAB' // or 'APK'
    },
    allowMixedContent: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      /** Kort: lokale shell vult direct; geen lange tweede splash. */
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

