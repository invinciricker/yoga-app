/**
 * The six font files, registered under exactly the names in tokens.font.
 * Loaded once in app/_layout.tsx; the splash screen stays up until they are ready.
 */
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold } from '@expo-google-fonts/figtree';

import { font } from './tokens';

export const fontFiles = {
  [font.displayRegular]: CormorantGaramond_500Medium,
  [font.displayStrong]: CormorantGaramond_600SemiBold,
  [font.displayItalic]: CormorantGaramond_500Medium_Italic,
  [font.body]: Figtree_400Regular,
  [font.bodyMedium]: Figtree_500Medium,
  [font.bodyStrong]: Figtree_600SemiBold,
};
