/**
 * Sizes that belong to the parts themselves (docs/DESIGN.md, "The parts").
 * Spacing, radius and type still come from the tokens; these are the few fixed measures
 * of buttons, chips and icons, kept in one place so no part invents its own.
 */
export const size = {
  icon: { xs: 16, sm: 18, md: 20, lg: 22 },
  stroke: { regular: 1.5, active: 1.9, hairline: 1 },
  button: { primary: 56, ghost: 52, quiet: 48, pill: 52, glass: 48, glassSmall: 40 },
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
  // --- Phase 1: the content cards and the pages (docs/design/mockups.html)
  lessonCard: { width: 200, cover: 236 }, // a card of "New from Maria"
  seriesCard: { large: 220, small: 152 },
  cover: { lesson: 460, series: 320, note: 180 }, // the covers at the top of pages and notes
  coverOverlap: 72, // how far a lesson's title climbs onto its cover
  fadeHeight: 0.55, // the part of a lesson's cover that melts into the screen, from the bottom
  rowPad: 10, // above and below a lesson row
  search: 52, // the search field
  play: 76, // the round gold play button
  playIcon: 28,
  playGlow: 2, // the glow around it is this many times the button
  flowTime: 40, // the column of times in "The flow"
  flowPad: 14, // above and below a step
  draftChip: 24,
  bullet: 6, // the gold dot of a list
  videoAspect: 16 / 9,
  footerFade: 0.34, // where the bar at the bottom of a lesson becomes solid
  // --- Phase 2: the new look and the new map (docs/phases/phase-2.md)
  areaCard: { min: 88, disc: 40, discAlpha: 0.16 }, // a card of an area on Today, and its round disc
  parallax: 0.5, // the billboard's picture rises at half the speed of the page
  billboardFade: 0.4, // the billboard's words are gone after this part of its height has scrolled
  scrollThrottle: 16, // how often a scrolling page reports where it is, in ms
  tabLabelMinScale: 0.9, // a tab's label may shrink this far rather than be cut
} as const;
