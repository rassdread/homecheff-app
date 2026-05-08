import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homecheff.app',
  appName: 'HomeCheff',
  webDir: 'dist',
  /** Wit achter WebView vóór eerste paint (Capacitor Android past dit toe in Bridge.initWebView). */
  backgroundColor: '#ffffff',
  server: {
    androidScheme: 'https',
    // For production, point to your Vercel URL:
    url: process.env.CAPACITOR_SERVER_URL || 'https://homecheff.eu',
    // For development, uncomment this and comment the url above:
    // url: 'http://localhost:3000',
    // cleartext: true
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
      /** Kortere Capacitor-overlay na OS-splash om lege wit-fase te beperken (remote WebView laadt async). */
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      // Fit hele splash-bitmap (wit + gecentreerd logo); voorkomt undesired crop op afwijkende aspect ratios
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

