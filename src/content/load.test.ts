import AsyncStorage from '@react-native-async-storage/async-storage';

import { storageKeys } from '@/lib/storage';

import { accept, fetchFresh, loadSaved, withKnownAuras } from './load';
import { useContent } from './store';
import { rawTestContent } from './testContent';

// The phone's storage, replaced by a plain object for the tests.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => void store.set(key, value)),
      clear: jest.fn(async () => store.clear()),
    },
  };
});

const realFetch = global.fetch;
/** Makes the next download answer with this. */
function serverSays(body: unknown, ok = true) {
  global.fetch = jest.fn(async () => ({ ok, json: async () => body })) as unknown as typeof fetch;
}
function noNetwork() {
  global.fetch = jest.fn(async () => {
    throw new TypeError('Network request failed');
  }) as unknown as typeof fetch;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useContent.setState({ status: 'loading', started: false, refreshing: false });
});
afterAll(() => {
  global.fetch = realFetch;
});

describe('accept', () => {
  it('accepts a good file, ignores fields it does not know, fills in what is optional', () => {
    const newer = {
      ...rawTestContent,
      somethingNew: true,
      lessons: rawTestContent.lessons.map((l) => ({ ...l, difficulty: 3 })),
    };
    const content = accept(newer);
    expect(content?.lessons.length).toBe(4);
    expect(content?.lessons[1]).toMatchObject({ props: [], flow: [], body: [], featured: false, draft: false });
  });

  it('refuses a file that breaks the contract, or a newer format', () => {
    expect(accept({ ...rawTestContent, lessons: [{ slug: 'x' }] })).toBeUndefined();
    expect(accept({ ...rawTestContent, schemaVersion: 2 })).toBeUndefined();
    expect(accept('<html>Not found</html>')).toBeUndefined();
    expect(accept(undefined)).toBeUndefined();
  });

  it('gives an aura it does not know a stable one from the slug', () => {
    const raw = { ...rawTestContent, lessons: [{ ...rawTestContent.lessons[0], aura: 'aurora' }] };
    const fixed = withKnownAuras(raw) as typeof raw;
    expect(['dusk', 'forest', 'candle', 'ember', 'moss']).toContain(fixed.lessons[0].aura);
    expect(accept(raw)?.lessons[0].aura).toBe(fixed.lessons[0].aura);
    // A known one is left alone.
    expect(accept(rawTestContent)?.journal[0].aura).toBe('moss');
  });
});

describe('fetchFresh', () => {
  it('saves a good download and gives it back', async () => {
    serverSays(rawTestContent);
    const fresh = await fetchFresh();
    expect(fresh?.lessons.length).toBe(4);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://invinciricker.github.io/yoga-app/content/v1/preview.json',
      expect.objectContaining({ cache: 'no-cache' }),
    );
    expect((await loadSaved())?.generatedAt).toBe(rawTestContent.generatedAt);
  });

  it('keeps the saved copy when the download is wrong, refused or impossible', async () => {
    serverSays(rawTestContent);
    await fetchFresh();
    const saved = await AsyncStorage.getItem(storageKeys.content);

    serverSays({ schemaVersion: 1, lessons: 'oops' });
    expect(await fetchFresh()).toBeUndefined();
    serverSays(rawTestContent, false);
    expect(await fetchFresh()).toBeUndefined();
    noNetwork();
    expect(await fetchFresh()).toBeUndefined();

    expect(await AsyncStorage.getItem(storageKeys.content)).toBe(saved);
  });

  it('gives up after the time limit', async () => {
    global.fetch = jest.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    ) as unknown as typeof fetch;
    expect(await fetchFresh('https://example.com/content.json', 20)).toBeUndefined();
  });
});

describe('the store', () => {
  it('starts with nothing saved and no network: stays empty and says the refresh failed', async () => {
    noNetwork();
    await useContent.getState().start();
    expect(useContent.getState()).toMatchObject({ status: 'stale', started: true, refreshing: false });
    expect(useContent.getState().content.lessons).toEqual([]);
  });

  it('shows the saved copy at once, then the fresh one', async () => {
    await AsyncStorage.setItem(storageKeys.content, JSON.stringify(rawTestContent));
    const newer = { ...rawTestContent, generatedAt: '2026-11-17T08:00:00.000Z' };
    let seenWhileDownloading: string | undefined;
    global.fetch = jest.fn(async () => {
      seenWhileDownloading = `${useContent.getState().status} ${useContent.getState().content.generatedAt}`;
      return { ok: true, json: async () => newer };
    }) as unknown as typeof fetch;

    await useContent.getState().start();
    expect(seenWhileDownloading).toBe(`ready ${rawTestContent.generatedAt}`);
    expect(useContent.getState()).toMatchObject({ status: 'ready', content: { generatedAt: newer.generatedAt } });
  });

  it('keeps showing the saved copy when a refresh fails, and recovers on the next one', async () => {
    await AsyncStorage.setItem(storageKeys.content, JSON.stringify(rawTestContent));
    noNetwork();
    await useContent.getState().start();
    expect(useContent.getState()).toMatchObject({ status: 'stale', content: { generatedAt: rawTestContent.generatedAt } });

    serverSays(rawTestContent);
    await useContent.getState().refresh();
    expect(useContent.getState().status).toBe('ready');
  });
});
