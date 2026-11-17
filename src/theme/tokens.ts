/**
 * Design tokens: the single source of truth for every colour, size, radius and timing in the app.
 *
 * PROTECTED FILE (see CLAUDE.md). Use these; never write a raw hex colour or a magic number in a
 * screen. Never change or remove a value. If a token is truly missing, add it here in a separate
 * commit starting with "protected:" and list it in the pull request.
 *
 * The look is black and gold, in a dark and a light version, with one colour per area (docs/V2.md).
 * Every text colour below passes WCAG 4.5:1 on every surface below (checked 16 Nov 2026).
 * Visual reference: docs/design/mockups.html and docs/design/mockups.png.
 */

/**
 * Colours, version 2 (17 Nov 2026): two palettes with the same keys.
 * Parts and screens read them through useTheme() (src/theme); they never import them.
 * Every colour of text (except onAccent), accent.gold, support and area passes WCAG 4.5:1 on every
 * bg of its own palette (checked 17 Nov 2026 and kept true by src/theme/contrast.test.ts).
 * Depth is a lighter surface plus a hairline, never a shadow, in both palettes.
 */
const dark = {
  bg: {
    sunken: '#080D0B', // wells: inputs when focused, the video letterbox
    base: '#0C1311', // every screen background
    raised: '#131D19', // cards, list rows, chips
    elevated: '#1A2721', // tab bar, sheets, menus
  },
  border: { subtle: '#22302A', strong: '#34443C' },
  text: {
    primary: '#F3ECDD', // warm ivory. Never pure white.
    secondary: '#C3BDAE',
    muted: '#969A8D',
    onAccent: '#1B1507', // words and icons on a gold fill
  },
  accent: {
    gold: '#E3B45E', // gold as a WORD or an ICON: overlines, links, the Home tab
    goldBright: '#F3D592', // highlights, the lit candle
    goldDeep: '#A67A2B', // gold hairlines
    fill: '#E3B45E', // gold as a FILL: the one primary button, a selected chip, the play button
    fillBorder: '#E3B45E', // hairline around a gold fill
  },
  support: { ember: '#DE8A63', sage: '#93B8A0', danger: '#E5786D' },
  // One colour per area: the active tab, overlines and small icons inside the area.
  area: { home: '#E3B45E', move: '#E8946A', breathe: '#6CC5BE', sit: '#ACA3F2', write: '#EC9BB0' },
  // The ground of an area's card on Today.
  areaSoft: { home: '#303223', move: '#312E24', breathe: '#1F3530', sit: '#283037', write: '#312F2E' },
  glow: 0.26, // strength of the candlelight behind a greeting
  scrim: 'rgba(8, 13, 11, 0.82)',
  glass: 'rgba(12, 19, 17, 0.55)',
  glassBorder: 'rgba(243, 236, 221, 0.18)',
} as const;

const light = {
  bg: {
    sunken: '#EAE2D2',
    base: '#F5EFE3', // warm paper. Never pure white as a page.
    raised: '#FCF8F0',
    elevated: '#FFFFFF',
  },
  border: { subtle: '#E2D9C7', strong: '#B9AD95' },
  text: {
    primary: '#1C1A15', // warm ink. Never pure black.
    secondary: '#4A453B',
    muted: '#69634F',
    onAccent: '#1B1507',
  },
  accent: {
    gold: '#84560B', // a bronze: bright gold cannot be read on paper
    goldBright: '#B07A1E',
    goldDeep: '#A67A2B',
    fill: '#E3B45E', // the same gold as in the dark palette…
    fillBorder: '#A67A2B', // …held by a darker hairline, so the button has an edge on paper
  },
  support: { ember: '#A8481F', sage: '#2F6B4B', danger: '#A93A2B' },
  area: { home: '#84560B', move: '#A8481F', breathe: '#166E69', sit: '#5546B8', write: '#A83A60' },
  areaSoft: { home: '#F8ECD6', move: '#F8E6D8', breathe: '#E2EFE7', sit: '#EEE9F0', write: '#F9E7E4' },
  glow: 0.16,
  // Covers are dark pictures in both themes, so what sits on them does not change.
  scrim: 'rgba(8, 13, 11, 0.82)',
  glass: 'rgba(12, 19, 17, 0.55)',
  glassBorder: 'rgba(243, 236, 221, 0.18)',
} as const;

export const palette = { dark, light } as const;
export type Scheme = keyof typeof palette;

/** Only so that old imports keep compiling during the conversion. Nothing outside src/theme may use it. */
export const color = palette.dark;

/** Words and icons on top of a cover or an aura, in both themes. Never text.* there. */
export const onCover = {
  primary: '#F3ECDD',
  secondary: '#D5CFC0',
  accent: '#F3D592',
} as const;

/**
 * The shape both palettes share: the same keys, every value a colour (text), except "glow" (a number).
 * useTheme() gives a Palette, so a palette that loses or changes a key stops the build.
 */
export type Palette = {
  bg: { sunken: string; base: string; raised: string; elevated: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; muted: string; onAccent: string };
  accent: { gold: string; goldBright: string; goldDeep: string; fill: string; fillBorder: string };
  support: { ember: string; sage: string; danger: string };
  area: { home: string; move: string; breathe: string; sit: string; write: string };
  areaSoft: { home: string; move: string; breathe: string; sit: string; write: string };
  glow: number;
  scrim: string;
  glass: string;
  glassBorder: string;
};

/**
 * Auras: the generated cover art used whenever a lesson, series or journal entry has no photo.
 * Each one is a night scene made of light: a vertical ground gradient, two soft glows, and one
 * small luminous disc (moon, sun or flame). They are part of the brand, not a placeholder.
 * Positions are fractions of the cover's width and height. Build them once in src/ui/Aura.tsx
 * with react-native-svg (LinearGradient + RadialGradient + Circle). See docs/DESIGN.md "Auras".
 */
export const aura = {
  dusk: {
    ground: ['#171C33', '#262B4A', '#3A3152'],
    glows: [
      { color: '#DE8A63', cx: 0.8, cy: 1.1, r: 0.9, opacity: 0.95 },
      { color: '#6B4A6E', cx: 0.15, cy: 0.95, r: 0.7, opacity: 0.9 },
    ],
    disc: { color: '#F3ECDD', cx: 0.74, cy: 0.24, r: 0.045 },
  },
  forest: {
    ground: ['#0F1E18', '#16302A', '#1C3A2C'],
    glows: [
      { color: '#E3B45E', cx: 0.85, cy: 0.0, r: 0.75, opacity: 0.5 },
      { color: '#3E6B50', cx: 0.1, cy: 1.0, r: 0.8, opacity: 0.9 },
    ],
    disc: { color: '#F3D592', cx: 0.78, cy: 0.2, r: 0.05 },
  },
  candle: {
    ground: ['#1A130A', '#120F0B', '#0C1311'],
    glows: [
      { color: '#E3B45E', cx: 0.5, cy: 0.4, r: 0.6, opacity: 0.55 },
      { color: '#A67A2B', cx: 0.5, cy: 0.55, r: 0.9, opacity: 0.35 },
    ],
    disc: { color: '#F3D592', cx: 0.5, cy: 0.4, r: 0.06 },
  },
  ember: {
    ground: ['#2A1614', '#221515', '#1A1414'],
    glows: [
      { color: '#DE8A63', cx: 0.2, cy: 0.0, r: 0.85, opacity: 0.8 },
      { color: '#7A3F3A', cx: 0.9, cy: 1.0, r: 0.7, opacity: 0.9 },
    ],
    disc: { color: '#F3D592', cx: 0.26, cy: 0.26, r: 0.05 },
  },
  moss: {
    ground: ['#0F1E1A', '#132721', '#16302A'],
    glows: [
      { color: '#93B8A0', cx: 0.5, cy: 1.05, r: 0.75, opacity: 0.7 },
      { color: '#22302A', cx: 0.1, cy: 0.1, r: 0.6, opacity: 0.9 },
    ],
    disc: { color: '#F3ECDD', cx: 0.3, cy: 0.22, r: 0.04 },
  },
  // Version 2 (17 Nov 2026): five more, brighter. tide = Breathe, iris = Meditate, rose = Journal,
  // saffron = Home and Maria, dawn = free to use. Never picked automatically (see autoAuraNames).
  dawn: {
    ground: ['#2A1B2E', '#4A2A3A', '#7A3F3F'],
    glows: [
      { color: '#F0A070', cx: 0.8, cy: 1.05, r: 0.85, opacity: 0.9 },
      { color: '#C2607A', cx: 0.1, cy: 0.9, r: 0.7, opacity: 0.8 },
    ],
    disc: { color: '#FBE9D2', cx: 0.3, cy: 0.26, r: 0.05 },
  },
  tide: {
    ground: ['#071A20', '#0D2E36', '#124449'],
    glows: [
      { color: '#5CC8C0', cx: 0.5, cy: 1.1, r: 0.8, opacity: 0.75 },
      { color: '#1D4F7A', cx: 0.1, cy: 0.05, r: 0.7, opacity: 0.9 },
    ],
    disc: { color: '#DFF5EE', cx: 0.72, cy: 0.22, r: 0.045 },
  },
  iris: {
    ground: ['#131129', '#211B47', '#332766'],
    glows: [
      { color: '#8E7BEA', cx: 0.85, cy: 1.0, r: 0.8, opacity: 0.8 },
      { color: '#B25C9E', cx: 0.1, cy: 1.05, r: 0.6, opacity: 0.7 },
    ],
    disc: { color: '#F3ECDD', cx: 0.5, cy: 0.24, r: 0.045 },
  },
  rose: {
    ground: ['#2B1420', '#4A1E33', '#6B2A44'],
    glows: [
      { color: '#EC8FA8', cx: 0.2, cy: 1.05, r: 0.8, opacity: 0.8 },
      { color: '#E3B45E', cx: 0.9, cy: 0.0, r: 0.6, opacity: 0.45 },
    ],
    disc: { color: '#FBE3D0', cx: 0.7, cy: 0.28, r: 0.05 },
  },
  saffron: {
    ground: ['#2A1A08', '#4A2C0C', '#70430F'],
    glows: [
      { color: '#F0B24A', cx: 0.5, cy: 1.1, r: 0.9, opacity: 0.85 },
      { color: '#DE8A63', cx: 0.05, cy: 0.3, r: 0.6, opacity: 0.5 },
    ],
    disc: { color: '#FFF1C9', cx: 0.5, cy: 0.3, r: 0.055 },
  },
} as const;

export type AuraName = keyof typeof aura;
export const auraNames = Object.keys(aura) as AuraName[];
export const autoAuraNames = ['dusk', 'forest', 'candle', 'ember', 'moss'] as const;

/** Font family names exactly as registered with expo-font. */
export const font = {
  displayRegular: 'CormorantGaramond_500Medium',
  displayStrong: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodyStrong: 'Figtree_600SemiBold',
} as const;

/**
 * Type scale. Cormorant Garamond has a small x-height, so display sizes are large on purpose.
 * Rule: Cormorant for anything the eye reads as a title or as Maria's voice; Figtree for
 * everything functional (buttons, meta, body). Never Cormorant below 20.
 */
export const type = {
  display: { fontFamily: font.displayRegular, fontSize: 44, lineHeight: 46, letterSpacing: -0.4 },
  h1: { fontFamily: font.displayRegular, fontSize: 38, lineHeight: 42, letterSpacing: -0.3 },
  h2: { fontFamily: font.displayRegular, fontSize: 30, lineHeight: 34, letterSpacing: -0.2 },
  h3: { fontFamily: font.displayStrong, fontSize: 24, lineHeight: 28, letterSpacing: 0 },
  quote: { fontFamily: font.displayItalic, fontSize: 23, lineHeight: 31, letterSpacing: 0 },
  title: { fontFamily: font.bodyStrong, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  bodyLarge: { fontFamily: font.body, fontSize: 17, lineHeight: 27, letterSpacing: 0 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 23, letterSpacing: 0 },
  label: { fontFamily: font.bodyStrong, fontSize: 15, lineHeight: 20, letterSpacing: 0.1 },
  meta: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  // Overline: always uppercase, always gold or muted. Set textTransform in the Text primitive.
  overline: { fontFamily: font.bodyStrong, fontSize: 11, lineHeight: 14, letterSpacing: 1.6 },
  tab: { fontFamily: font.bodyStrong, fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
} as const;

/** 4-point spacing scale. Use the names, not the numbers. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
} as const;

export const layout = {
  gutter: 20, // left and right padding of every screen
  sectionGap: 40, // vertical space between sections of a screen
  cardGap: 12, // space between cards in a list or a row
  touchMin: 48, // smallest tappable height and width
  tabBarHeight: 68,
  tabBarInset: 16, // distance of the floating tab bar from the screen edges and the bottom inset
  maxContentWidth: 560, // on tablets and on the web preview, centre the column at this width
} as const;

export const radius = {
  sm: 10, // thumbnails inside rows
  md: 14, // inputs, small cards
  lg: 20, // cards, buttons with text, sheets
  xl: 28, // hero covers
  pill: 999, // chips, the tab bar, round buttons
} as const;

/** Motion. Calm and short: nothing bounces, nothing takes more than half a second except "breathing". */
export const motion = {
  duration: { quick: 120, base: 220, slow: 360, breath: 6000 },
  // Bezier control points for Easing.bezier(...).
  easing: { standard: [0.2, 0, 0, 1], exit: [0.4, 0, 1, 1] },
  pressScale: 0.97, // every pressable card and button scales to this while pressed
  stagger: 40, // delay between list items appearing, in ms; cap at 6 items
} as const;

export const opacity = { disabled: 0.4, pressed: 0.85 } as const;

export const tokens = { color, palette, onCover, aura, font, type, space, layout, radius, motion, opacity } as const;
export type Tokens = typeof tokens;
