/**
 * The app's settings for Expo: name, icon, splash, Android package, updates.
 *
 * One codebase makes TWO apps, chosen by the environment variable APP_VARIANT:
 *   - "production"   → "Yoga with Maria", the one that goes to Google Play
 *   - anything else  → "Yoga (preview)", the test app on the owner's phone (and the web preview)
 * They have different package names, so both can sit on the same phone.
 *
 * Changing anything in this file means a NEW BUILD is needed (an over-the-air update is not enough).
 */
import type { ExpoConfig } from 'expo/config';

// The Android package name. A placeholder that the owner confirms before Phase 10 (notifications).
// Keep it in this ONE constant; the preview app adds ".preview" to it.
const PACKAGE_NAME = 'com.yogawithmaria.app';

// The owner's Expo account and project (public values, safe to commit).
const EXPO_OWNER = 'invincirick';
const EXPO_PROJECT_ID = '78246bde-20b9-46bb-b161-a356f8298483';

// A config file cannot import the design tokens, so the colour is written here. The splash and the
// icon stay dark in both themes: the app opens on the billboard, which is always dark.
const BG_BASE = '#0C1311'; // palette.dark.bg.base in src/theme/tokens.ts

const variant: 'production' | 'preview' =
  process.env.APP_VARIANT === 'production' ? 'production' : 'preview';
const isProduction = variant === 'production';

const config: ExpoConfig = {
  name: isProduction ? 'Yoga with Maria' : 'Yoga (preview)',
  slug: 'yoga-app',
  owner: EXPO_OWNER,
  scheme: 'yogawithmaria',
  version: '0.1.0',
  orientation: 'portrait',
  // The theme follows the phone (light or dark) unless the person chooses in You → Appearance.
  userInterfaceStyle: 'automatic',
  backgroundColor: BG_BASE,
  // Temporary icon: the small gold light. The real icon comes in Phase 11 (the Play Store).
  icon: './assets/images/icon.png',
  android: {
    // Android draws edge to edge (under the status and navigation bars) by default in this SDK.
    package: isProduction ? PACKAGE_NAME : `${PACKAGE_NAME}.preview`,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon-foreground.png',
      backgroundColor: BG_BASE,
    },
  },
  web: {
    // Static files, so the web preview can live on GitHub Pages.
    output: 'static',
    bundler: 'metro',
    favicon: './assets/images/favicon.png',
    backgroundColor: BG_BASE,
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: BG_BASE,
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    // GitHub Pages serves the web preview from a sub-folder; the Pages workflow sets this.
    baseUrl: process.env.WEB_BASE_URL ?? '',
  },
  // Over-the-air updates. "fingerprint" means an update only reaches a build whose native side
  // is identical, so an update can never break an installed app.
  updates: {
    url: `https://u.expo.dev/${EXPO_PROJECT_ID}`,
  },
  runtimeVersion: { policy: 'fingerprint' },
  extra: {
    // Read in the app through src/lib/variant.ts.
    variant,
    eas: { projectId: EXPO_PROJECT_ID },
  },
};

export default config;
