import { welcomeSlides } from './welcome';

const names = { app: 'Yoga with Maria', teacher: 'Maria' };
const none = { breathe: false, meditate: false, journal: false };

describe('welcomeSlides', () => {
  it('gives three screens: welcome, the lessons, nothing to sign up for', () => {
    const slides = welcomeSlides(none, names);
    expect(slides.map((s) => s.aura)).toEqual(['saffron', 'forest', 'dusk']);
    expect(slides.map((s) => s.button)).toEqual(['Next', 'Next', 'Begin']);
    expect(slides.map((s) => s.skip)).toEqual([true, true, false]);
  });

  it('writes the names from the content', () => {
    const slides = welcomeSlides(none, { app: 'Quiet Hour', teacher: 'Ana' });
    expect(slides[0].title).toBe('Quiet Hour');
    expect(slides[0].overline).toBe('Welcome');
    expect(slides[1].overline).toBe('With Ana');
    expect(slides[1].sentence).toBe('Videos, tips and notes from Ana, new ones as she makes them. Free.');
  });

  it('never names a room that is not built', () => {
    for (const built of [none, { ...none, journal: true }, { breathe: true, meditate: true, journal: false }]) {
      const second = welcomeSlides(built, names)[1];
      expect(second.title).toBe('Short lessons, any time');
      expect(`${second.title} ${second.sentence}`).not.toMatch(/breath|sit|page/i);
    }
  });

  it('speaks of the whole day once Breathe, Meditate and Journal are all built', () => {
    const second = welcomeSlides({ breathe: true, meditate: true, journal: true }, names)[1];
    expect(second.aura).toBe('tide');
    expect(second.overline).toBe('Every day');
    expect(second.title).toBe('Move, breathe, sit, write');
    expect(second.sentence).toBe(
      'Maria’s lessons, a few slow breaths, a quiet sitting, a page of your own. One small practice a day.',
    );
  });

  it('ends on the promise that nothing leaves the phone', () => {
    const last = welcomeSlides(none, names)[2];
    expect(last.title).toBe('Nothing to sign up for');
    expect(last.sentence).toBe('Open the app and begin. What you do here stays on your phone.');
  });
});
