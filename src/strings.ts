/**
 * Every word the user reads, grouped by screen. English only.
 * Short, warm, calm. No exclamation marks. Never write user-facing text inside a component.
 */
export const strings = {
  // Used only until the content has been read (it carries the real names: content/site.yaml).
  app: {
    name: 'Yoga with Maria',
    teacher: 'Maria',
  },
  // The five tabs (docs/V2.md, "The map").
  tabs: {
    home: 'Home',
    practice: 'Practice',
    breathe: 'Breathe',
    meditate: 'Meditate',
    journal: 'Journal',
    barLabel: 'Main',
  },
  // A tab whose area is not built yet (preview app only).
  areas: {
    building: 'This room is being built.',
  },
  common: {
    back: 'Back',
    seeAll: 'See all',
    clear: 'Clear',
    draft: 'Draft',
    // One quiet line under the title when the content could not be refreshed.
    offline: 'Showing your saved copy.',
    minutes: (n: number) => `${n} min`,
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
  },
  // How the words written in the content files are shown (docs/CONTENT.md).
  levels: { gentle: 'Gentle', steady: 'Steady', strong: 'Strong' },
  focus: {
    'whole-body': 'Whole body',
    hips: 'Hips',
    back: 'Back',
    shoulders: 'Shoulders',
    legs: 'Legs',
    core: 'Core',
    balance: 'Balance',
    breath: 'Breath',
    sleep: 'Sleep',
    energy: 'Energy',
  },
  // The top of Home: the billboard for Maria and her class.
  home: {
    yourTeacher: 'Your teacher',
    nextClass: (weekday: string, time: string, name: string) => `Next class · ${weekday} ${time} · ${name}`,
    meet: (teacher: string) => `Meet ${teacher}`,
    today: 'Today',
    todayHint: 'Moves down to today’s practice',
    you: 'You',
  },
  today: {
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    // The greeting and the label above the big card follow the clock. See src/lib/greeting.ts.
    morning: { part: 'morning', hello: 'Good morning.', line: 'Begin gently.', practice: 'This morning’s practice' },
    afternoon: { part: 'afternoon', hello: 'Good afternoon.', line: 'A pause in the day.', practice: 'Today’s practice' },
    evening: { part: 'evening', hello: 'Good evening.', line: 'Let the day settle.', practice: 'Tonight’s practice' },
    you: 'You',
    begin: 'Begin',
    newFrom: (teacher: string) => `New from ${teacher}`,
    noteFrom: (teacher: string) => `A note from ${teacher}`,
    readNote: 'Read the note',
    readTip: 'Read the tip',
    empty: 'The first lessons are on their way. Pull down to look again.',
    // The big card, once its lesson is done today.
    doneToday: 'Done today',
  },
  // The week card on Today and in You: seven candles, Monday to Sunday.
  week: {
    letters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    // Monday first, for screen readers.
    names: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    thisWeek: 'This week',
    streak: (n: number) => (n === 1 ? '1 day' : `${n} days in a row`),
    first: 'Light your first candle',
    today: 'Light today’s candle',
    // Read aloud: "4 days in a row. This week, lit: Monday, Tuesday."
    spoken: (title: string, lit: string[]) =>
      lit.length > 0 ? `${title}. This week, lit: ${lit.join(', ')}.` : `${title}. Nothing lit this week yet.`,
  },
  practice: {
    title: 'Practice',
    search: 'Search lessons',
    clearSearch: 'Clear the search',
    filterAll: 'All',
    filterShort: 'Under 15 min',
    filterSaved: 'Saved',
    series: 'Series',
    seriesCount: (n: number) => (n === 1 ? 'Series · 1 lesson' : `Series · ${n} lessons`),
    allLessons: 'All lessons',
    lessonCount: (n: number) => (n === 1 ? '1 lesson' : `${n} lessons`),
    noMatch: 'Nothing matches that yet. Try another word, or clear the search.',
    empty: 'Lessons and series will gather here, ready when you are.',
    // The "Saved" filter, and You → Saved, with nothing in them.
    savedEmpty: 'Tap the bookmark on a lesson to keep it here.',
    notes: (teacher: string) => `Notes from ${teacher}`,
  },
  lesson: {
    play: 'Play video',
    begin: 'Begin practice',
    need: 'You’ll need',
    flow: 'The flow',
    stepHint: 'Moves the video to this moment',
    noteFrom: (teacher: string) => `A note from ${teacher}`,
    place: (series: string, n: number, total: number) => `${series} · ${n} of ${total}`,
    videoError: 'The video would not play here. It may open in YouTube.',
    openYouTube: 'Open in YouTube',
    gone: 'This lesson is no longer here.',
    toPractice: 'Back to Practice',
    markDone: 'Mark as done',
    doneAgain: 'Done again',
    // A quiet line above the bar, once the lesson was done.
    doneToday: 'Done today',
    doneYesterday: 'Done yesterday',
    doneOn: (date: string) => `Done on ${date}`,
    // The bookmark, on the cover and on Today's big card.
    save: 'Save lesson',
    unsave: 'Remove from saved',
    // Read aloud after a lesson's name in a list.
    isDone: 'done',
    isSaved: 'saved',
  },
  // The closing screen, after a lesson (the "After practice" mockup).
  done: {
    wellDone: 'Well done.',
    // "Twelve quiet minutes, just for you." The minutes are a word up to twelve, a number above.
    words: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'],
    minutes: (n: number, word: string | undefined) =>
      n === 1 ? 'One quiet minute, just for you.' : `${word ?? n} quiet minutes, just for you.`,
    howFelt: 'How did that feel?',
    difficulty: {
      gentle: { title: 'Too gentle', line: 'I could have done more' },
      right: { title: 'Just right', line: 'A good match for today' },
      much: { title: 'Too much', line: 'I had to stop or skip parts' },
    },
    feelingTitle: 'And now you feel… (optional)',
    feelings: { calmer: 'Calmer', energised: 'Energised', stronger: 'Stronger', tired: 'Tired' },
    // Phase 9 changes this line, when the answers start reaching Maria.
    privacy: 'Your answer stays on your phone.',
    close: 'Done',
    // The one hand-off to another area, once that area is built (src/day/record.ts, nextStep).
    next: { breathe: 'Three minutes of breath?', sit: 'Sit for five?', write: 'Write a line about it?' },
  },
  series: {
    facts: (lessons: number, minutes: number) =>
      `${lessons === 1 ? '1 lesson' : `${lessons} lessons`} · ${minutes} min`,
    gone: 'This series is no longer here.',
    progress: (done: number, total: number) => `${done} of ${total} done`,
    allDone: (total: number) => `All ${total} done.`,
    continue: 'Continue',
  },
  // Maria's tips and notes (once the "Journal" tab; the data keeps the name "journal").
  notes: {
    title: (teacher: string) => `Notes from ${teacher}`,
    filterAll: 'All',
    filterTips: 'Tips',
    filterNotes: 'Notes',
    tip: 'Tip',
    note: 'Note',
    tryThis: 'Try this',
    gone: 'This page is no longer here.',
    toNotes: 'Back to Notes',
    noMatch: 'Nothing of that kind yet.',
    empty: 'Maria’s tips and notes will be kept here, a few lines at a time.',
  },
  // Maria's page, behind the billboard (docs/phases/phase-3.md). Every block hides when its content is missing.
  maria: {
    yourTeacher: 'Your teacher',
    whyYoga: 'Why yoga',
    classesWith: (teacher: string) => `Classes with ${teacher}`,
    today: 'Today',
    tomorrow: 'Tomorrow',
    next: 'Next',
    // "18:30 – 19:45" and "All levels · 75 min".
    timeRange: (start: string, end: string) => `${start} – ${end}`,
    joined: (parts: string[]) => parts.join(' · '),
    openInMaps: 'Open in Maps',
    message: (teacher: string) => `Message ${teacher}`,
    call: 'Call',
    instagram: 'Instagram',
    email: 'Email',
    website: 'Website',
    // When a link has nothing on this phone to open it: one calm line, then the address itself.
    notOpened: 'That did not open here.',
  },
  // The welcome: three screens, the very first time the app opens (docs/phases/phase-3.md).
  welcome: {
    next: 'Next',
    begin: 'Begin',
    skip: 'Skip',
    skipHint: 'Goes straight to Home',
    place: (n: number, total: number) => `Screen ${n} of ${total}`,
    first: {
      overline: 'Welcome',
      sentence: 'A quiet place to practise, a few minutes at a time.',
    },
    // The second screen until Breathe, Meditate and Journal are all built…
    lessons: {
      overline: (teacher: string) => `With ${teacher}`,
      title: 'Short lessons, any time',
      sentence: (teacher: string) => `Videos, tips and notes from ${teacher}, new ones as she makes them. Free.`,
    },
    // …and once they are.
    everyDay: {
      overline: 'Every day',
      title: 'Move, breathe, sit, write',
      sentence: (teacher: string) =>
        `${teacher}’s lessons, a few slow breaths, a quiet sitting, a page of your own. One small practice a day.`,
    },
    yours: {
      overline: 'Yours',
      title: 'Nothing to sign up for',
      sentence: 'Open the app and begin. What you do here stays on your phone.',
    },
  },
  // You: the person's own page (settings now; more in later phases).
  me: {
    title: 'You',
    appearance: 'Appearance',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    reduceMotion: 'Reduce motion',
    reduceMotionLine: 'Fewer moving parts. Your phone’s own setting is always followed too.',
    about: 'About',
    privacy: 'Privacy',
    galleryLink: 'Design gallery',
    // The three numbers at the top: "12 days", "184 minutes", "5 longest run".
    days: (n: number) => (n === 1 ? 'day' : 'days'),
    minutes: (n: number) => (n === 1 ? 'minute' : 'minutes'),
    longest: 'longest run',
    nothingYet: 'Your practice will gather here, a candle a day.',
    saved: 'Saved',
    history: 'History',
    deleteData: 'Delete my data',
  },
  // You → Saved.
  saved: {
    title: 'Saved',
  },
  // You → History: what was done, by day.
  history: {
    title: 'History',
    today: 'Today',
    yesterday: 'Yesterday',
  },
  // You → Delete my data. A page of its own, not a pop-up.
  deleteData: {
    title: 'Delete my data',
    sentence:
      'This erases your candles, the lessons you finished and saved, and your answers, from this phone. Your settings stay.',
    delete: 'Delete',
    keep: 'Keep',
  },
  // You → About.
  about: {
    sentence: (teacher: string) => `Made for ${teacher}’s students, and for anyone who wants to begin.`,
    careTitle: 'Look after yourself',
    care:
      'Everything here is general guidance, not medical advice. If you are pregnant, injured, unwell, or unsure whether a practice is right for you, ask a doctor first. Stop if something hurts or makes you feel worse.',
    // Which copy of the app this is (src/lib/version.ts).
    version: (version: string) => `Version ${version}`,
    update: (day: string, time: string) => `Update of ${day}, ${time}`,
    embedded: 'The code that came with this build',
    fingerprint: (short: string) => `Fingerprint ${short}`,
    web: 'Web preview',
    welcomeAgain: 'Show the welcome again',
    licences: 'Open-source licences',
  },
  // You → Privacy. The text itself is docs/legal/privacy-policy.md (src/legal/privacy.json).
  privacy: {
    // A placeholder of the policy whose value is not in content/site.yaml yet.
    notSet: '(not set yet)',
  },
  // You → About → Open-source licences.
  licences: {
    title: 'Open-source licences',
    sentence: 'The app is built with these free libraries and typefaces. Thank you to the people who make them.',
    libraries: 'Libraries',
    fonts: 'Typefaces',
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
    settingsRows: 'Settings rows (a ListCard)',
    switchRow: 'Reduce motion',
    switchLine: 'A row with a switch: the whole row is the touch target.',
    linkRow: 'About',
    sectionTitle: 'New from Maria',
    aurasHero: 'Auras, hero size',
    aurasThumb: 'Auras, thumbnail size',
    cover: 'Cover with scrim',
    coverOverline: '12 min · Gentle',
    coverTitle: 'Evening wind-down',
    coverBody: 'A slow floor sequence to release the hips and lower back before bed.',
    lessonParts: 'Lesson card and rows',
    seriesParts: 'Series cards',
    notesParts: 'Note cards',
    areaCards: 'Area cards (Today, later phases)',
    areaSamples: {
      move: { overline: 'Move · 12 min', title: 'Evening wind-down', line: 'Slow, on the floor.' },
      breathe: { overline: 'Breathe · 3 min', title: 'Long exhale', line: 'In for four, out for six.' },
      sit: { overline: 'Sit · 5 min', title: 'A quiet timer', line: 'A bell to begin, a bell to end.' },
      write: { overline: 'Write · 2 min', title: 'Three good things', line: 'Page 6 of 28.' },
    },
    theme: 'Theme',
    areaColours: 'Area colours',
    richText: 'Rich text',
    search: 'Search field',
    states: 'States: offline, draft, loading, empty',
    tabBar: 'Tab bar',
    sample: 'Sample progress',
    sampleSwitch: 'Show sample progress',
    sampleLine: 'Four days of candles, a series begun, a lesson saved. In memory only, never saved.',
    weekCard: 'Week card',
    choices: 'Answer choices (closing screen)',
    marks: 'Lesson rows: done, saved',
    progress: 'Series progress',
  },
} as const;
