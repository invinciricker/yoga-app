/**
 * A lesson's closing screen: "Well done." and "How did that feel?" (the "After practice" mockup).
 * It covers the lesson, opened by "Mark as done" or by the video reaching its end, and is always
 * dark ("the room dims", docs/V2.md), with its overline and small icons in the Move colour.
 *
 *   - The lesson is written in the record of the day when this screen OPENS, once per opening,
 *     so leaving it in any way (Done, back, closing the app) still counts. A success vibration.
 *   - One tap on an answer is a complete answer: stored at once, on the phone. Then the optional
 *     feeling chips appear (one at most; a second tap clears it). Leaving without an answer is fine.
 *   - At most one hand-off to another area (nextStep), once those areas are built. From Phase 5:
 *     "Write a line about it?" opens a new free page with the "After practice" line chosen, in
 *     place of this screen (back then leads to the lesson).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { areas } from '@/config';
import { slugsForStaticPages } from '@/content/load';
import { dayOf, findLesson } from '@/content/selectors';
import { useContent } from '@/content/store';
import { lessonEntry, nextStep, streak } from '@/day/record';
import { useDays } from '@/day/store';
import { success, tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { usePractice } from '@/practice/store';
import { difficulties, feelings, type Difficulty, type Feeling } from '@/practice/types';
import { strings } from '@/strings';
import { space } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import { AnswerChoice, Arrive, Button, Candlelight, Chip, LoadingPage, NotHere, Overline, Screen, size, Text } from '@/ui';

/** Web preview only: the closing screens to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('lessons');
}

/** Where each hand-off leads. */
const nextRoute = { breathe: routes.breathe, sit: routes.meditate, write: routes.freePage({ prompt: 'after-practice' }) };

export default function LessonDoneScreen() {
  return (
    <ThemeScope scheme="dark">
      <LessonDone />
    </ThemeScope>
  );
}

function LessonDone() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { color } = useTheme();
  const back = useBack(slug ? routes.lesson(slug) : routes.practice);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const entries = useDays((s) => s.entries);
  useDarkTop(true);

  // One name per opening of this screen: the record ignores a second write under the same name.
  const [opening] = useState(() => `${Date.now()}-${Math.random()}`);
  const [difficulty, setDifficulty] = useState<Difficulty>();
  const [feeling, setFeeling] = useState<Feeling>();

  const lesson = findLesson(content, slug);

  // Written as soon as the screen opens (or as soon as the lesson is known, on a first launch).
  // Nothing is written for a lesson that does not exist.
  useEffect(() => {
    if (!lesson) return;
    if (useDays.getState().add(lessonEntry(lesson, new Date()), opening)) success();
  }, [lesson, opening]);

  if (!lesson) {
    if (status === 'loading') return <LoadingPage />;
    return (
      <NotHere
        sentence={strings.lesson.gone}
        actionLabel={strings.lesson.toPractice}
        onAction={() => router.replace(routes.practice)}
      />
    );
  }

  const today = dayOf(new Date());
  // Counting today: this lesson lights today's candle, even before the record has drawn again.
  const days = streak([...entries, lessonEntry(lesson, new Date())], today);
  const next = nextStep('move', entries, today, areas);
  const minutes = lesson.minutes;

  const choose = (d: Difficulty) => {
    tick(); // a light tick in the hand
    setDifficulty(d);
    usePractice.getState().answer(lesson.slug, d, feeling);
  };
  const feel = (f: Feeling) => {
    if (!difficulty) return;
    tick();
    const chosen = feeling === f ? undefined : f; // a second tap clears it
    setFeeling(chosen);
    usePractice.getState().answer(lesson.slug, difficulty, chosen);
  };

  return (
    <Screen
      backdrop={<Candlelight place="top" />}
      contentStyle={styles.page}
      footer={
        <>
          <Text variant="meta" color="text.muted" center style={styles.privacy}>
            {strings.done.privacy}
          </Text>
          {next ? (
            <Button
              kind="quiet"
              label={strings.done.next[next]}
              onPress={() => (next === 'write' ? router.replace(nextRoute.write) : router.navigate(nextRoute[next]))}
            />
          ) : null}
          <Button label={strings.done.close} onPress={back} />
        </>
      }
    >
      <Arrive index={0} style={styles.header}>
        <View style={styles.streak}>
          <Flame size={size.icon.sm} strokeWidth={size.stroke.regular} color={color.area.move} />
          <Overline tone="area" area="move">
            {strings.week.streak(days)}
          </Overline>
        </View>
        <Text variant="display" center accessibilityRole="header">
          {strings.done.wellDone}
        </Text>
        <Text variant="quote" color="text.secondary" center>
          {strings.done.minutes(minutes, strings.done.words[minutes - 1])}
        </Text>
      </Arrive>

      <Arrive index={1} style={styles.answers}>
        <Text variant="title" accessibilityRole="header" style={styles.question}>
          {strings.done.howFelt}
        </Text>
        <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={strings.done.howFelt}>
          {difficulties.map((d) => (
            <AnswerChoice
              key={d}
              title={strings.done.difficulty[d].title}
              line={strings.done.difficulty[d].line}
              selected={difficulty === d}
              onPress={() => choose(d)}
            />
          ))}
        </View>
      </Arrive>

      {difficulty ? (
        <Arrive index={0} style={styles.feelings}>
          <Text variant="meta" color="text.muted">
            {strings.done.feelingTitle}
          </Text>
          <View style={styles.chips}>
            {feelings.map((f) => (
              <Chip key={f} look="soft" label={strings.done.feelings[f]} selected={feeling === f} onPress={() => feel(f)} />
            ))}
          </View>
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // The words start a little lower than on other pages, under the light (the mockup).
  page: { paddingTop: space.xxxl },
  header: { alignItems: 'center', gap: space.sm },
  streak: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  answers: { marginTop: space.xxxl, gap: space.sm },
  question: { marginBottom: space.xxs },
  choices: { gap: space.sm },
  feelings: { marginTop: space.xl, gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, paddingVertical: space.xxs },
  privacy: { marginBottom: space.xs },
});
