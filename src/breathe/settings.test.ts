import { readJson, writeJson } from '@/lib/storage';

import { defaultSettings, parseSettings, useBreathe } from './settings';

// The phone's storage, replaced by a fake.
jest.mock('@/lib/storage', () => ({
  storageKeys: { breathe: 'ywm:breathe:v1' },
  readJson: jest.fn(),
  writeJson: jest.fn(() => Promise.resolve(true)),
}));

describe('parseSettings', () => {
  it('starts at 3 minutes, Sound off, Vibration on', () => {
    expect(parseSettings(undefined)).toEqual({ minutes: 3, sound: false, vibration: true });
    expect(defaultSettings).toEqual({ minutes: 3, sound: false, vibration: true });
  });

  it('reads back what was saved', () => {
    expect(parseSettings({ minutes: 5, sound: true, vibration: false })).toEqual({ minutes: 5, sound: true, vibration: false });
  });

  it('keeps the first value of anything broken, one setting at a time', () => {
    expect(parseSettings({ minutes: 4, sound: 'yes', vibration: false })).toEqual({ minutes: 3, sound: false, vibration: false });
    expect(parseSettings('broken')).toEqual(defaultSettings);
  });
});

describe('the settings store', () => {
  it('reads the saved settings once, and saves all three at every change', async () => {
    (readJson as jest.Mock).mockResolvedValueOnce({ minutes: 1, sound: true });
    await useBreathe.getState().start();
    expect(useBreathe.getState()).toMatchObject({ started: true, minutes: 1, sound: true, vibration: true });
    useBreathe.getState().set({ minutes: 5 });
    expect(writeJson).toHaveBeenLastCalledWith('ywm:breathe:v1', { minutes: 5, sound: true, vibration: true });
  });
});
