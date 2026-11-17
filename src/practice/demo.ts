/**
 * Sample progress for checking the screens: the switch "Show sample progress" in the design
 * gallery, and ?demo=streak in the address. In the preview app and on the web only.
 * It fills the record of the day and the practice store IN MEMORY ONLY (never saved) until the
 * app closes or the switch goes off; the person's own progress then comes back as it was.
 */
import { useGlobalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { isPreview } from '@/lib/variant';

import { sampleProgress } from './sample';
import { usePractice } from './store';

/** The public app never shows sample progress. */
export const canShowSample = isPreview || Platform.OS === 'web';

export function setSampleProgress(on: boolean): void {
  if (!canShowSample) return;
  if (!on) {
    useDays.getState().showSample(undefined);
    usePractice.getState().showSample(undefined);
    return;
  }
  const { entries, practice } = sampleProgress(useContent.getState().content, dayOf(new Date()));
  useDays.getState().showSample(entries);
  usePractice.getState().showSample(practice);
}

/** On the web, the address can be read at once; moving to another page drops it. */
function demoInAddress(): boolean {
  if (Platform.OS !== 'web' || typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('demo') === 'streak';
}

/**
 * Turns sample progress on when the address asks for it (?demo=streak), once the content and the
 * person's own progress have been read. Drawn once, near the root of the app.
 */
export function SampleFromAddress(): null {
  const params = useGlobalSearchParams<{ demo?: string }>();
  const [onWeb] = useState(() => canShowSample && demoInAddress());
  const wanted = canShowSample && (onWeb || params.demo === 'streak');
  const daysStarted = useDays((s) => s.started);
  const practiceStarted = usePractice((s) => s.started);
  const contentReady = useContent((s) => s.status !== 'loading');
  const ready = daysStarted && practiceStarted && contentReady;

  useEffect(() => {
    if (wanted && ready) setSampleProgress(true);
  }, [wanted, ready]);
  return null;
}
