import { contentFile } from '../../shared/content-schema';

import { rawTestContent } from '@/content/testContent';

import { areasWithContent } from './areas';

// The content store reads the phone's storage; only the pure function is tested here.
jest.mock('@/content/store', () => ({ useContent: jest.fn() }));

describe('areasWithContent', () => {
  it('opens Breathe when there are exercises', () => {
    expect(areasWithContent(contentFile.parse(rawTestContent)).breathe).toBe(true);
  });

  it('hides Breathe when there is none to show (a file built before Phase 7, or none published)', () => {
    const { breath: _, ...before } = rawTestContent;
    expect(areasWithContent(contentFile.parse(before)).breathe).toBe(false);
    expect(areasWithContent(contentFile.parse({ ...rawTestContent, breath: [] })).breathe).toBe(false);
  });

  it('keeps the Journal as it is built', () => {
    expect(areasWithContent(contentFile.parse(rawTestContent)).journal).toBe(true);
  });
});
