/**
 * The privacy policy names the app, the teacher, the contact address and the publisher. They come
 * from the content (content/site.yaml, downloaded as content.json), so the page is right as soon as
 * the content changes, with no new version of the app. A value that is not set yet shows as
 * "(not set yet)". Pure functions, tested in fill.test.ts. The website does the same in
 * tools/site/build.mjs.
 */
import type { Block, ContentFile, Span } from '../../shared/content-schema';

import { strings } from '@/strings';

export type PlaceholderValues = { appName: string; teacher: string; contactEmail: string; publisher: string };

export function placeholderValues(site: ContentFile['site']): PlaceholderValues {
  const or = (value: string | undefined) => (value?.trim() ? value.trim() : strings.privacy.notSet);
  return {
    appName: site.appName,
    teacher: site.teacherFirstName,
    contactEmail: or(site.contactEmail),
    publisher: or(site.publisher),
  };
}

/** "{appName} by {teacher}" → "Yoga with Maria by Maria". A name not in the list is left as it is. */
function fill(text: string, values: PlaceholderValues): string {
  return text.replace(/\{(appName|teacher|contactEmail|publisher)\}/g, (_, name: keyof PlaceholderValues) => values[name]);
}

const fillSpans = (spans: Span[], values: PlaceholderValues): Span[] => spans.map((s) => ({ ...s, text: fill(s.text, values) }));

export function fillPlaceholders(blocks: Block[], values: PlaceholderValues): Block[] {
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading':
        return { ...block, text: fill(block.text, values) };
      case 'paragraph':
      case 'quote':
        return { ...block, spans: fillSpans(block.spans, values) };
      case 'list':
        return { ...block, items: block.items.map((item) => fillSpans(item, values)) };
      default:
        return block;
    }
  });
}
