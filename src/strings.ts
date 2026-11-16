/**
 * Every word the user reads, grouped by screen. English only.
 * Short, warm, calm. No exclamation marks. Never write user-facing text inside a component.
 */
export const strings = {
  tabs: {
    today: 'Today',
    practice: 'Practice',
    journal: 'Journal',
    studio: 'Studio',
    barLabel: 'Main',
  },
  common: {
    back: 'Back',
    seeAll: 'See all',
  },
  today: {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    // The greeting follows the clock. See src/lib/greeting.ts.
    morning: { part: 'morning', hello: 'Good morning.', line: 'Begin gently.' },
    afternoon: { part: 'afternoon', hello: 'Good afternoon.', line: 'A pause in the day.' },
    evening: { part: 'evening', hello: 'Good evening.', line: 'Let the day settle.' },
    myPractice: 'My practice',
    comingOverline: 'Coming next',
    comingTitle: 'The first lessons',
    comingBody: 'Maria’s lessons arrive in the next update.',
    galleryLink: 'Design gallery',
  },
  practice: {
    title: 'Practice',
    empty: 'Lessons and series will gather here, ready when you are.',
  },
  journal: {
    title: 'Journal',
    empty: 'Maria’s tips and notes will be kept here, a few lines at a time.',
  },
  studio: {
    title: 'Studio',
    empty: 'Soon, a little about Maria and where to practise with her in person.',
  },
  // The design gallery is a checking tool for the owner, shown in the preview app only.
  gallery: {
    title: 'Design gallery',
    type: 'Type',
    typeSample: 'A quiet evening',
    italicSample: 'Let the day settle.',
    colours: 'Colours',
    buttons: 'Buttons',
    primary: 'Begin practice',
    ghost: 'Open in Maps',
    quiet: 'Mark as done',
    disabled: 'Not yet',
    iconButtons: 'Icon buttons',
    save: 'Save lesson',
    chips: 'Chips',
    chipSelected: 'All',
    chipUnselected: 'Gentle',
    chipDisabled: 'Saved',
    chipStatic: 'Mat',
    card: 'Card',
    cardTitle: 'A note from Maria',
    cardBody: 'Cards sit one step above the page, with a hairline around them.',
    sectionHeader: 'Section header',
    sectionTitle: 'New from Maria',
    aurasHero: 'Auras, hero size',
    aurasThumb: 'Auras, thumbnail size',
    cover: 'Cover with scrim',
    coverOverline: '12 min · Gentle',
    coverTitle: 'Evening wind-down',
    coverBody: 'A slow floor sequence to release the hips and lower back before bed.',
    tabBar: 'Tab bar',
  },
} as const;
