import { emptyPractice, parsePractice, toggled, type Practice } from './types';

describe('parsePractice', () => {
  const practice: Practice = {
    saved: ['wind-down', 'morning'],
    reactions: {
      'wind-down': { difficulty: 'right', feeling: 'calmer', at: '2026-11-17T19:00:00.000Z', sent: false },
      morning: { difficulty: 'much', at: '2026-11-16T07:00:00.000Z', sent: false },
    },
  };

  it('reads back what was saved', () => {
    expect(parsePractice(JSON.parse(JSON.stringify(practice)))).toEqual(practice);
  });

  it('survives a broken or empty file', () => {
    expect(parsePractice(undefined)).toEqual(emptyPractice);
    expect(parsePractice('nonsense')).toEqual(emptyPractice);
    expect(parsePractice({ saved: 'wind-down', reactions: [] })).toEqual(emptyPractice);
  });

  it('leaves out broken answers and words it does not know, and keeps the rest', () => {
    const raw = {
      saved: ['wind-down', 3, '', 'wind-down'],
      reactions: {
        a: { difficulty: 'right', feeling: 'sleepy', at: 'x', sent: false },
        b: { difficulty: 'meh', at: 'x' },
        c: null,
      },
      later: 'a field from a later version',
    };
    expect(parsePractice(raw)).toEqual({ saved: ['wind-down'], reactions: { a: { difficulty: 'right', at: 'x', sent: false } } });
  });
});

describe('toggled', () => {
  it('puts a newly saved lesson first, and takes an unsaved one out', () => {
    expect(toggled(['a', 'b'], 'c')).toEqual(['c', 'a', 'b']);
    expect(toggled(['c', 'a', 'b'], 'a')).toEqual(['c', 'b']);
  });
});
