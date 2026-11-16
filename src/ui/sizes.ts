/**
 * Sizes that belong to the parts themselves (docs/DESIGN.md, "The parts").
 * Spacing, radius and type still come from the tokens; these are the few fixed measures
 * of buttons, chips and icons, kept in one place so no part invents its own.
 */
export const size = {
  icon: { sm: 18, md: 20, lg: 22 },
  stroke: { regular: 1.5, active: 1.9, hairline: 1 },
  button: { primary: 56, ghost: 52, quiet: 48 },
  iconButton: 48,
  chip: { select: 40, static: 36 },
  tabItem: 56,
  rise: 12, // how far a section rises when it arrives
  arriveSteps: 6, // at most this many staggered steps
  fontScaleMax: 1.3, // text grows with the phone's setting, up to this
  scrimHeight: 0.7, // the scrim covers this part of a cover, from the bottom
  thumb: 76, // a small square or round aura
  hero: { width: 350, height: 440 }, // the big cover on Today
  swatch: 40, // a colour sample in the gallery
  readWidth: 280, // the widest a short centred sentence may run
  candlelight: 460, // the soft circle of light behind a greeting
  breathScale: 1.06,
} as const;
