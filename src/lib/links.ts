/**
 * Opening a link in another app (WhatsApp, the phone, Maps, the browser).
 * Answers false when nothing on this phone could open it (a tablet with no phone app, no mail
 * app…), so the screen can say so and show the address instead of failing silently.
 * The web preview has its own version: links.web.ts.
 */
import * as Linking from 'expo-linking';

export async function openLink(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
