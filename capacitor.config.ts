import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homecheff.app',
  appName: 'HomeCheff',
  webDir: 'dist',
  /** Wit achter WebView vóór eerste paint (Capacitor Android past dit toe in Bridge.initWebView). */
  backgroundColor: '#ffffff',
  server: {
    androidScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL || 'https://homecheff.eu',
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
      /** Lang genoeg om WebView-wit te maskeren; directe load naar homecheff.eu. */
      launchShowDuration: 3250,
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
