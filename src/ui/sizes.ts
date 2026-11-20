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
  // --- Phase 3: Maria, the welcome, You (docs/phases/phase-3.md)
  portrait: 500, // Maria's portrait at the top of her page
  benefitCard: 210, // a card of "Why yoga"
  disc: { size: 40, alpha: 0.16 }, // the round disc behind a small icon, in the area's colour
  classDay: 104, // the column of days and times in "Classes with Maria"
  settingsRow: 56, // the least height of a row in You
  dot: 6, // a dot of the welcome's three
  // --- Phase 4: my practice (docs/phases/phase-4.md)
  candle: 26, // a candle of the week card
  candleRing: 4, // the gap between today's candle and the ring around it
  candleGlow: 44, // the soft glow around a lit candle (a square this wide)
  candleGlowAlpha: 0.35, // its strength at the candle's edge
  choice: 64, // an answer on a closing screen ("Just right")
  softFill: 0.12, // the gold wash under a chosen answer or feeling
  tick: 28, // the round sage tick of a lesson done
  tickIcon: 16,
  tickStroke: 2,
  progress: 4, // the thin progress line of a series
  progressTrack: 0.22, // the strength of the line's empty part, over a cover
  candlelightWide: 560, // the light above "Well done.", centred at the top
  numberColumn: 88, // the least width of each of You's three numbers
  // --- Phase 5: the Journal (docs/phases/phase-5.md)
  todayPage: 300, // the card of today's page at the top of the Journal tab
  shelfDisc: 44, // the small aura (or icon) at the start of a row of the shelf
  shelfRow: 72, // the least height of a row of the shelf
  scale: 48, // a round button of a scale ("7")
  scaleRow: 6, // at most this many buttons on one row of a scale; 0 to 10 makes two rows
  blank: 112, // the least width of a blank in a fill-in sentence
  freePage: 0.45, // a free page's field is at least this part of the window's height
  noteDisc: 0.16, // the strength of the area's colour behind a small icon
  // --- Phase 6: the Habit and Health journals (docs/phases/phase-6.md)
  dotCell: 24, // the least side of the square a dot sits in (a dot's size is in src/journal/dots.ts)
  dotRow: 32, // the least height of a row of dots
  dotRing: 0.7, // the empty ring of a day without an answer, as a part of its square
  dotMark: 0.5, // the short line under the dot of the page on screen, as a part of its square
  dotLabelMin: 64, // narrower than this, a row's label goes above its dots instead of beside them
  measureSlack: 1, // a measured width comes rounded down on the web: one point more keeps a word on its line
  pagesShown: 21, // "Your pages" shows this many, then "Show all 73 pages"
  // --- Phase 7: Breathe (docs/phases/phase-7.md)
  pacer: {
    disc: 0.2, // the disc at its largest (full lungs): its radius, as a part of the column's width
    centre: 0.36, // where the disc's centre sits, as a part of the screen's height
    reduced: 0.75, // with reduce motion the disc stays still, at this part of its largest size
  },
  timeLine: 2, // the thin line along the bottom of the player that shows how much is left
  timeLineTrack: 0.18, // the strength of the line's spent part
} as const;
