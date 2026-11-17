/**
 * The practice store, with the phone's storage replaced by a fake that can refuse to save.
 */
import { readJson, removeKey, writeJson } from '@/lib/storage';

import { usePractice } from './store';

jest.mock('@/lib/storage', () => ({
  storageKeys: { practice: 'ywm:practice:v1' },
  readJson: jest.fn(),
  writeJson: jest.fn(),
  removeKey: jest.fn(),
}));

const read = readJson as jest.MockedFunction<typeof readJson>;
const write = writeJson as jest.MockedFunction<typeof writeJson>;
const remove = removeKey as jest.MockedFunction<typeof removeKey>;

beforeEach(() => {
  jest.clearAllMocks();
  write.mockResolvedValue(true);
  remove.mockResolvedValue(true);
  usePractice.getState().showSample(undefined);
  usePractice.setState({ started: false, saved: [], reactions: {}, sample: false });
});

it('reads what was saved when the app opens', async () => {
  read.mockResolvedValue({ saved: ['wind-down'], reactions: {} });
  await usePractice.getState().start();
  expect(usePractice.getState()).toMatchObject({ started: true, saved: ['wind-down'] });
});

it('saves and unsaves, the newest first, and stores it at once', () => {
  expect(usePractice.getState().toggleSave('a')).toBe(true);
  expect(usePractice.getState().toggleSave('b')).toBe(true);
  expect(usePractice.getState().saved).toEqual(['b', 'a']);
  expect(usePractice.getState().toggleSave('a')).toBe(false);
  expect(write).toHaveBeenLastCalledWith('ywm:practice:v1', { saved: ['b'], reactions: {} });
});

it('replaces an answer with a new one, feeling included', () => {
  usePractice.getState().answer('wind-down', 'right', 'calmer');
  usePractice.getState().answer('wind-down', 'much', undefined);
  const reaction = usePractice.getState().reactions['wind-down'];
  expect(reaction).toMatchObject({ difficulty: 'much', sent: false });
  expect(reaction.feeling).toBeUndefined();
});

it('carries on when the phone refuses to save', () => {
  write.mockResolvedValue(false);
  usePractice.getState().toggleSave('wind-down');
  usePractice.getState().answer('wind-down', 'right', undefined);
  expect(usePractice.getState().saved).toEqual(['wind-down']);
  expect(usePractice.getState().reactions['wind-down'].difficulty).toBe('right');
});

it('forgets everything on Delete my data', async () => {
  usePractice.getState().toggleSave('wind-down');
  usePractice.getState().answer('wind-down', 'right', undefined);
  await usePractice.getState().clear();
  expect(usePractice.getState()).toMatchObject({ saved: [], reactions: {} });
  expect(remove).toHaveBeenCalledWith('ywm:practice:v1');
});

it('shows sample progress in memory only, and gives the person’s own back', () => {
  usePractice.getState().toggleSave('own');
  write.mockClear();
  usePractice.getState().showSample({ saved: ['sample'], reactions: {} });
  usePractice.getState().toggleSave('during-sample');
  expect(write).not.toHaveBeenCalled();
  expect(usePractice.getState().saved).toEqual(['during-sample', 'sample']);
  usePractice.getState().showSample(undefined);
  expect(usePractice.getState()).toMatchObject({ sample: false, saved: ['own'] });
});
