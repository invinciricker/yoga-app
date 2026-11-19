/**
 * The Journal on the phone, with the phone's storage replaced by the in-memory one that
 * AsyncStorage ships for tests. "Watch out for" 1 and 5 of docs/phases/phase-5.md: losing words,
 * and "Delete my data" leaving a ghost behind.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SAVE_WITHIN_MS, useJournal } from './store';
import type { JournalEntry } from './types';

// The in-memory storage that AsyncStorage ships for tests (it knows getAllKeys, multiGet, multiRemove).
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const page = (id: string, text: string): JournalEntry => ({
  id,
  kind: 'free',
  day: '2026-11-20',
  created: '2026-11-20T20:00:00.000Z',
  updated: '2026-11-20T20:00:00.000Z',
  text,
});

/** The app closing and opening again: memory is gone, only the phone's storage remains. */
async function restart(): Promise<void> {
  useJournal.setState({ started: false, entries: [], begun: [], cycles: {}, carried: undefined, sample: false });
  await useJournal.getState().start();
}

const savedKeys = async () => (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('ywm:journal:v1:')).sort();

beforeEach(async () => {
  jest.useRealTimers();
  await useJournal.getState().clear();
  await AsyncStorage.clear();
  useJournal.setState({ started: false, entries: [], begun: [], cycles: {}, carried: undefined, sample: false });
});

it('keeps a draft through a restart: one key per page', async () => {
  useJournal.getState().put(page('a', 'Half a sent'));
  await useJournal.getState().flush();
  await restart();
  expect(useJournal.getState().entries).toEqual([page('a', 'Half a sent')]);
  expect(await savedKeys()).toEqual(['ywm:journal:v1:page:a']);
});

it('writes to the phone within the save delay while typing goes on, never waiting for a pause', async () => {
  jest.useFakeTimers();
  // The test storage's setItem is already a recording mock: read its calls.
  const set = AsyncStorage.setItem as jest.Mock;
  set.mockClear();
  // A letter every 100 ms, without a pause, for longer than the delay.
  let text = '';
  for (let i = 0; i < 10; i++) {
    text += 'a';
    useJournal.getState().put(page('a', text));
    jest.advanceTimersByTime(100);
  }
  expect(set).toHaveBeenCalled();
  const firstWrite = JSON.parse(set.mock.calls[0][1] as string) as JournalEntry;
  expect(firstWrite.text!.length).toBeLessThanOrEqual(Math.ceil(SAVE_WITHIN_MS / 100) + 1);
});

it('writes what is waiting at once when asked (the page is left, the app goes to the background)', async () => {
  useJournal.getState().put(page('a', 'Words'));
  expect(await AsyncStorage.getItem('ywm:journal:v1:page:a')).toBeNull();
  await useJournal.getState().flush();
  expect(JSON.parse((await AsyncStorage.getItem('ywm:journal:v1:page:a'))!)).toEqual(page('a', 'Words'));
});

it('keeps one answer of 10,000 characters whole', async () => {
  const long = 'x'.repeat(10_000);
  useJournal.getState().put(page('a', long));
  await useJournal.getState().flush();
  await restart();
  expect(useJournal.getState().entries[0].text).toBe(long);
});

it('leaves out a saved page it cannot read, and keeps the others', async () => {
  await AsyncStorage.setItem('ywm:journal:v1:page:bad', '{ not json');
  await AsyncStorage.setItem('ywm:journal:v1:page:odd', JSON.stringify({ id: 'odd', kind: 'drawing' }));
  await AsyncStorage.setItem('ywm:journal:v1:page:a', JSON.stringify(page('a', 'Fine')));
  await restart();
  expect(useJournal.getState().entries).toEqual([page('a', 'Fine')]);
});

it('remembers the journals begun', async () => {
  useJournal.getState().begin('gratitude');
  useJournal.getState().begin('gratitude');
  await restart();
  expect(useJournal.getState().begun).toEqual(['gratitude']);
});

it('forgets a deleted page on the phone too', async () => {
  useJournal.getState().put(page('a', 'One'));
  useJournal.getState().put(page('b', 'Two'));
  await useJournal.getState().flush();
  useJournal.getState().remove('a');
  await restart();
  expect(useJournal.getState().entries.map((e) => e.id)).toEqual(['b']);
});

it('"Delete my data" erases every journal key, even a save still waiting, and nothing else', async () => {
  jest.useFakeTimers();
  await AsyncStorage.setItem('ywm:appearance:v1', '"dark"');
  useJournal.getState().put(page('a', 'Saved'));
  await useJournal.getState().flush();
  useJournal.getState().begin('gratitude');
  useJournal.getState().put(page('b', 'Still waiting to be saved'));
  await useJournal.getState().clear();
  jest.advanceTimersByTime(SAVE_WITHIN_MS * 3); // the waiting save must not land afterwards
  jest.useRealTimers();
  await restart();
  expect(useJournal.getState()).toMatchObject({ entries: [], begun: [] });
  expect(await savedKeys()).toEqual([]);
  expect(await AsyncStorage.getItem('ywm:appearance:v1')).toBe('"dark"');
});

it('saves nothing while sample progress shows, and gives the person their own pages back after', async () => {
  useJournal.getState().put(page('mine', 'Mine'));
  await useJournal.getState().flush();
  useJournal.getState().showSample({ entries: [page('s', 'Sample')], begun: ['gratitude'] });
  useJournal.getState().put(page('t', 'Typed in the sample'));
  useJournal.getState().begin('other');
  await useJournal.getState().flush();
  expect(await savedKeys()).toEqual(['ywm:journal:v1:page:mine']);
  useJournal.getState().showSample(undefined);
  expect(useJournal.getState()).toMatchObject({ entries: [page('mine', 'Mine')], begun: [], sample: false });
});

// ------------------------------------------------------------------ Phase 6: starting again, carrying an answer
it('remembers each journal started again, through a restart', async () => {
  useJournal.getState().startAgain('habit');
  useJournal.getState().startAgain('habit');
  useJournal.getState().startAgain('health');
  await restart();
  expect(useJournal.getState().cycles).toEqual({ habit: 3, health: 2 });
});

it('"Delete my data" erases the starts too, and an answer on its way to another journal', async () => {
  useJournal.getState().startAgain('habit');
  useJournal.getState().carry({ journal: 'habit', prompt: 'h-want', text: 'Walk' });
  await useJournal.getState().clear();
  await restart();
  expect(useJournal.getState()).toMatchObject({ cycles: {}, carried: undefined });
  expect(await savedKeys()).toEqual([]);
});

it('keeps a carried answer in memory only: gone when the app closes', async () => {
  useJournal.getState().carry({ journal: 'habit', prompt: 'h-want', text: 'Walk' });
  expect(useJournal.getState().carried).toEqual({ journal: 'habit', prompt: 'h-want', text: 'Walk' });
  expect(await savedKeys()).toEqual([]);
});

it('keeps sample starts in memory, and gives the person their own back after', async () => {
  useJournal.getState().startAgain('habit');
  useJournal.getState().showSample({ entries: [], begun: ['habit'], cycles: { habit: 5 } });
  expect(useJournal.getState().cycles).toEqual({ habit: 5 });
  useJournal.getState().startAgain('habit');
  expect(JSON.parse((await AsyncStorage.getItem('ywm:journal:v1:cycles'))!)).toEqual({ habit: 2 });
  useJournal.getState().showSample(undefined);
  expect(useJournal.getState().cycles).toEqual({ habit: 2 });
});
