/**
 * A breathing session's closing screen (/breathe-done/long-exhale?minutes=3&at=…;
 * docs/phases/phase-7.md, section 5). It takes the player's place at the end, or after Stop once a
 * full minute was breathed. Always dark, like the lesson's, its overline and small icons in the
 * Breathe colour:
 *   the week's candles with today's lit, a short line, "3 minutes of Long exhale", at most one next
 *   step (nextStep('breathe'): in Phase 7 only "Write a line about it?", opening a free page with
 *   "After practice" chosen), then "Done". No "How did that feel?": that question is for Maria's lessons.
 *
 * THE RECORD. The session is written in the record of the day when this screen opens, on the day it
 * opens (a session that ends after midnight counts on the day it ended). `at` names the session: if
 * an entry already has it (the screen opened again, a reload of the web page), nothing more is
 * written. Without `at` (an address typed by hand), the opening itself names it.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Wind } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { slugsForStaticPages } from '@/content/load';
import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { breatheEntry, nextStep, streak, week } from '@/day/record';
import { useDays } from '@/day/store';
import { useAreas } from '@/lib/areas';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import { Arrive, Button, Candlelight, LoadingPage, NotHere, Overline, Screen, size, Text, WeekCard } from '@/ui';

/** Web preview only: the closing screens to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('breath');
}

export default function BreatheDoneScreen() {
  return (
    <ThemeScope scheme="dark">
      <BreatheDone />
    </ThemeScope>
  );
}

function BreatheDone() {
  const params = useLocalSearchParams<{ slug: string; minutes?: string; at?: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const available = useAreas();
  const back = useBack(params.slug ? routes.breath(params.slug) : routes.breathe);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const entries = useDays((s) => s.entries);
  useDarkTop(true);

  // One name per session: the player's `at`, else this opening.
  const [session] = useState(() => (typeof params.at === 'string' && params.at.length > 0 ? params.at : new Date().toISOString()));
  const exercise = content.breath?.find((e) => e.slug === params.slug);
  const asked = Math.floor(Number(params.minutes));
  const minutes = Number.isFinite(asked) && asked >= 1 ? asked : 1;

  // Written once, as soon as the screen opens (or as soon as the exercise is known, on a first launch).
  useEffect(() => {
    if (!exercise) return;
    const days = useDays.getState();
    if (days.entries.some((e) => e.kind === 'breathe' && e.at === session)) return;
    days.add(breatheEntry(exercise.slug, minutes, new Date(), session), `breathe:${session}`);
  }, [exercise, minutes, session]);

  if (!exercise) {
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.breathe.gone} actionLabel={strings.breathe.toBreathe} onAction={() => router.replace(routes.breathe)} />;
  }

  const today = dayOf(new Date());
  // Counting this session: today's candle is lit, even before the record has drawn again.
  const counted = entries.some((e) => e.kind === 'breathe' && e.at === session)
    ? entries
    : [...entries, breatheEntry(exercise.slug, minutes, new Date(), session)];
  const days = week(counted, today);
  const next = nextStep('breathe', entries, today, available);

  return (
    <Screen
      backdrop={<Candlelight place="top" />}
      contentStyle={styles.page}
      footer={
        <>
          {next === 'write' ? (
            <Button
              kind="quiet"
              label={strings.done.next.write}
              onPress={() => router.replace(routes.freePage({ prompt: 'after-practice' }))}
            />
          ) : null}
          <Button label={strings.breathe.close} onPress={back} />
        </>
      }
    >
      <Arrive index={0} style={styles.header}>
        <View style={styles.overline}>
          <Wind size={size.icon.sm} strokeWidth={size.stroke.regular} color={color.area.breathe} />
          <Overline tone="area" area="breathe">
            {strings.breathe.overline}
          </Overline>
        </View>
        <Text variant="display" center accessibilityRole="header">
          {strings.breathe.closing}
        </Text>
        <Text variant="quote" color="text.secondary" center>
          {strings.breathe.closingLine(minutes, exercise.title)}
        </Text>
      </Arrive>

      <Arrive index={1} style={styles.week}>
        <WeekCard days={days} streak={streak(counted, today)} ever />
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // The words start a little lower than on other pages, under the light (like the lesson's).
  page: { paddingTop: space.xxxl },
  header: { alignItems: 'center', gap: space.sm },
  overline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  week: { marginTop: space.xxxl },
});
