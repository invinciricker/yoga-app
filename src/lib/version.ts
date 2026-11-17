/**
 * "Which copy of the app is this?", for You → About. A pure function, tested in version.test.ts.
 *
 *   public app      Version 0.1.0
 *   preview app     Version 0.1.0
 *                   Update of 17 November, 15:48    (or: The code that came with this build)
 *                   Fingerprint 1a2b3c4             (the first 7 characters of the build's runtime version)
 *   web preview     Version 0.1.0 / Web preview
 *
 * After an over-the-air update, the second line is how the owner sees that it reached the phone.
 * The values come from src/lib/buildInfo.ts (and its web twin).
 */
import { strings } from '@/strings';

export type BuildInfo =
  | {
      where: 'phone';
      version: string;
      /** True when the code running is the one inside the installed build (no update yet). */
      embedded: boolean;
      /** When the running update was published; absent for the build's own code. */
      createdAt?: Date;
      /** The build's fingerprint (runtime version policy "fingerprint"). */
      runtimeVersion?: string;
    }
  | { where: 'web'; version: string };

const FINGERPRINT_SHOWN = 7;
const pad = (n: number) => String(n).padStart(2, '0');

export function versionLines(info: BuildInfo, preview: boolean): string[] {
  const lines = [strings.about.version(info.version)];
  if (info.where === 'web') return [...lines, strings.about.web];
  if (!preview) return lines;
  if (info.embedded) lines.push(strings.about.embedded);
  else if (info.createdAt) {
    const at = info.createdAt;
    const day = `${at.getDate()} ${strings.common.months[at.getMonth()]}`;
    lines.push(strings.about.update(day, `${pad(at.getHours())}:${pad(at.getMinutes())}`));
  }
  if (info.runtimeVersion) lines.push(strings.about.fingerprint(info.runtimeVersion.slice(0, FINGERPRINT_SHOWN)));
  return lines;
}
