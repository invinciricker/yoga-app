/**
 * Design tokens: the single source of truth for every colour, size, radius and timing in the app.
 *
 * PROTECTED FILE (see CLAUDE.md). Use these; never write a raw hex colour or a magic number in a
 * screen. Never change or remove a value. If a token is truly missing, add it here in a separate
 * commit starting with "protected:" and list it in the pull request.
 *
 * The look is "deep and moody": a forest-at-night ground, warm ivory text, candlelight gold.
 * Every text colour below passes WCAG 4.5:1 on every surface below (checked 16 Nov 2026).
 * Visual reference: docs/design/mockups.html and docs/design/mockups.png.
 */

export const color = {
  // Surfaces, from the page up. Depth is shown by a lighter surface plus a hairline, never by a shadow.
  bg: {
    sunken: '#080D0B', // wells: inputs when focused, the video letterbox
    base: '#0C1311', // every screen background
    raised: '#131D19', // cards, list rows, chips
    elevated: '#1A2721', // tab bar, sheets, menus
  },
  border: {
    subtle: '#22302A', // hairline around raised surfaces
    strong: '#34443C', // hairline around elevated surfaces, unselected controls
  },
  text: {
    primary: '#F3ECDD', // warm ivory. Never pure white.
    secondary: '#C3BDAE', // body copy on cards, summaries
    muted: '#969A8D', // meta lines, placeholders, inactive tabs
    onAccent: '#1B1507', // text and icons on gold
  },
  accent: {
    gold: '#E3B45E', // THE accent: one primary action per screen, active tab, overlines
    goldBright: '#F3D592', // highlights, pressed glow, the lit candle
    goldDeep: '#A67A2B', // gold hairlines, progress track fill on light auras
  },
  support: {
    ember: '#DE8A63', // warmth: "strong" level, secondary highlights
    sage: '#93B8A0', // success and "done"
    danger: '#E5786D', // errors, destructive actions
  },
  // Dark veil over photos so text stays readable. Use as a gradient from transparent to this.
  scrim: 'rgba(8, 13, 11, 0.82)',
  // Translucent fills for round buttons that sit on top of a cover.
  glass: 'rgba(12, 19, 17, 0.55)',
  glassBorder: 'rgba(243, 236, 221, 0.18)',
} as const;

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
} as const;

export type AuraName = keyof typeof aura;
export const auraNames = Object.keys(aura) as AuraName[];

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

export const tokens = { color, aura, font, type, space, layout, radius, motion, opacity } as const;
export type Tokens = typeof tokens;
