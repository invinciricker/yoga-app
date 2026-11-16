/**
 * Which of the two apps is running: "preview" (the owner's test app and the web preview)
 * or "production" (the public app). Set in app.config.ts from APP_VARIANT.
 */
import Constants from 'expo-constants';

export type Variant = 'preview' | 'production';

export const variant: Variant =
  Constants.expoConfig?.extra?.variant === 'production' ? 'production' : 'preview';

export const isPreview = variant === 'preview';
