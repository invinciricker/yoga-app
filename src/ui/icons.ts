/**
 * Icons that lucide-react-native no longer ships (it dropped brand logos), drawn with its own
 * helper so they take the same props (size, color, strokeWidth) and look like the others.
 */
import { createLucideIcon } from 'lucide-react-native';

/** The Instagram glyph: a rounded square, a lens and a small dot (as in the Studio mockup). */
export const Instagram = createLucideIcon('instagram', [
  ['rect', { x: '2', y: '2', width: '20', height: '20', rx: '5', ry: '5', key: 'frame' }],
  ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', key: 'lens' }],
  ['line', { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5', key: 'dot' }],
]);
