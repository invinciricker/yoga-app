import { asAppearance, asScheme, resolveScheme } from './scheme';

describe('resolveScheme', () => {
  it('follows the phone when the setting is "system"', () => {
    expect(resolveScheme('system', 'light')).toBe('light');
    expect(resolveScheme('system', 'dark')).toBe('dark');
  });

  it('is dark when the phone gives no answer', () => {
    expect(resolveScheme('system', null)).toBe('dark');
    expect(resolveScheme('system', undefined)).toBe('dark');
    expect(resolveScheme('system', 'unspecified')).toBe('dark');
  });

  it('obeys the setting over the phone', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('obeys a forced scheme over everything', () => {
    expect(resolveScheme('dark', 'dark', 'light')).toBe('light');
    expect(resolveScheme('system', 'light', 'dark')).toBe('dark');
  });
});

describe('reading values back', () => {
  it('knows only light and dark as schemes', () => {
    expect(asScheme('light')).toBe('light');
    expect(asScheme('dark')).toBe('dark');
    expect(asScheme('system')).toBeUndefined();
    expect(asScheme(['light'])).toBeUndefined();
  });

  it('turns anything unknown into "system"', () => {
    expect(asAppearance('light')).toBe('light');
    expect(asAppearance('dark')).toBe('dark');
    expect(asAppearance('system')).toBe('system');
    expect(asAppearance(undefined)).toBe('system');
    expect(asAppearance(42)).toBe('system');
  });
});
