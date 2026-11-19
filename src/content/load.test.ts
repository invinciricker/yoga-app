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

describe('accept, with guided journals (Phase 5)', () => {
  const page = (id: string, prompts: unknown[]) => ({ id, title: `Page ${id}`, prompts });
  const journal = (slug: string, more: Record<string, unknown> = {}) => ({
    slug,
    title: 'Gratitude',
    summary: 'Noticing.',
    aura: 'rose',
    order: 1,
    minutes: 3,
    intro: [{ title: 'About', text: [{ type: 'paragraph', spans: [{ text: 'Hello.' }] }] }],
    sections: [
      {
        id: 'week-1',
        title: 'Week 1',
        pages: [
          page('d01', [
            { kind: 'text', id: 'why', ask: 'Why?' },
            // A kind a later version of the app knows, and this one does not.
            { kind: 'drawing', id: 'sketch', ask: 'Draw it.', colours: 3 },
          ]),
          page('d02', [{ kind: 'drawing', id: 'only', ask: 'Draw.' }]),
        ],
      },
    ],
    ...more,
  });

  it('reads a file built before guided journals existed', () => {
    expect(accept(rawTestContent)?.guidedJournals).toBeUndefined();
  });

  it('survives newer content: skips a prompt kind it does not know, a field it does not know, a journal it cannot read', () => {
    const content = accept({
      ...rawTestContent,
      guidedJournals: [
        journal('gratitude', { mood: 'a field from a later version' }),
        journal('broken', { sections: 'not a list' }),
        { slug: 'no-title' },
      ],
    });
    // The rest of the content still loads.
    expect(content?.lessons.map((l) => l.slug)).toEqual(['wind-down', 'morning', 'breath', 'legs']);
    // The journal it can read is there, without the prompt it cannot draw.
    expect(content?.guidedJournals?.map((j) => j.slug)).toEqual(['gratitude']);
    const [d01, d02] = content!.guidedJournals![0].sections[0].pages;
    expect(d01.prompts).toEqual([{ kind: 'text', id: 'why', ask: 'Why?', lines: 3 }]);
    // A page left with nothing to show: the app says it needs a newer version (src/journal/).
    expect(d02.prompts).toEqual([]);
  });

  it('survives a list of journals that is not a list', () => {
    expect(accept({ ...rawTestContent, guidedJournals: 'later' })?.guidedJournals).toEqual([]);
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
