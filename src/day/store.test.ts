/**
 * The record's store, with the phone's storage replaced by a fake that can refuse to save.
 */
import { readJson, removeKey, writeJson } from '@/lib/storage';

import type { DayEntry } from './record';
import { useDays } from './store';

jest.mock('@/lib/storage', () => ({
  storageKeys: { days: 'ywm:days:v1' },
  readJson: jest.fn(),
  writeJson: jest.fn(),
  removeKey: jest.fn(),
}));

const read = readJson as jest.MockedFunction<typeof readJson>;
const write = writeJson as jest.MockedFunction<typeof writeJson>;
const remove = removeKey as jest.MockedFunction<typeof removeKey>;

const did = (day: string, ref = 'wind-down'): DayEntry => ({ day, kind: 'move', ref, minutes: 12, at: `${day}T19:00:00.000Z` });

beforeEach(() => {
  jest.clearAllMocks();
  write.mockResolvedValue(true);
  remove.mockResolvedValue(true);
  useDays.setState({ started: false, entries: [], sample: false });
  useDays.getState().showSample(undefined);
});

it('reads the saved list when the app opens, leaving out what is broken', async () => {
  read.mockResolvedValue([did('2026-11-16'), { day: 'broken' }]);
  await useDays.getState().start();
  expect(useDays.getState()).toMatchObject({ started: true, entries: [did('2026-11-16')] });
});

it('saves the whole list on each new entry', () => {
  useDays.getState().add(did('2026-11-16'));
  useDays.getState().add(did('2026-11-17'));
  expect(write).toHaveBeenLastCalledWith('ywm:days:v1', [did('2026-11-16'), did('2026-11-17')]);
});

it('carries on when the phone refuses to save: the session keeps what was done', () => {
  write.mockResolvedValue(false);
  useDays.getState().add(did('2026-11-17'));
  expect(useDays.getState().entries).toEqual([did('2026-11-17')]);
  // The next change tries to save everything again.
  write.mockResolvedValue(true);
  useDays.getState().add(did('2026-11-17', 'breath'));
  expect(write).toHaveBeenLastCalledWith('ywm:days:v1', [did('2026-11-17'), did('2026-11-17', 'breath')]);
});

it('writes once per opening of a closing screen, never once per drawing', () => {
  const add = useDays.getState().add;
  expect(add(did('2026-11-17'), 'opening-1')).toBe(true);
  expect(add(did('2026-11-17'), 'opening-1')).toBe(false); // the same screen drawn again
  expect(useDays.getState().entries).toHaveLength(1);
  expect(add(did('2026-11-17'), 'opening-2')).toBe(true); // opened again (or the web page reloaded)
  expect(useDays.getState().entries).toHaveLength(2);
});

it('forgets everything on Delete my data', async () => {
  useDays.getState().add(did('2026-11-17'));
  await useDays.getState().clear();
  expect(useDays.getState().entries).toEqual([]);
  expect(remove).toHaveBeenCalledWith('ywm:days:v1');
});

it('shows sample progress in memory only, and gives the person’s own back', () => {
  useDays.getState().add(did('2026-11-10', 'own'));
  write.mockClear();
  useDays.getState().showSample([did('2026-11-16', 'sample')]);
  expect(useDays.getState()).toMatchObject({ sample: true, entries: [did('2026-11-16', 'sample')] });
  useDays.getState().add(did('2026-11-17', 'during-sample'));
  expect(write).not.toHaveBeenCalled();
  useDays.getState().showSample(undefined);
  expect(useDays.getState()).toMatchObject({ sample: false, entries: [did('2026-11-10', 'own')] });
});

it('Delete my data during sample progress empties both', async () => {
  useDays.getState().add(did('2026-11-10', 'own'));
  useDays.getState().showSample([did('2026-11-16', 'sample')]);
  await useDays.getState().clear();
  useDays.getState().showSample(undefined);
  expect(useDays.getState()).toMatchObject({ sample: false, entries: [] });
});
