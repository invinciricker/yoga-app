/**
 * A lesson: its cover (with a play button when there is a video), its facts, its description,
 * what is needed, the flow of poses, and a note from Maria.
 *
 * Pressing play (on the cover, or "Begin practice" at the bottom) puts the video in place of the
 * cover. Tapping a step of the flow that has a time moves the video there.
 * The video plays on a stage that is always dark, whatever the theme ("the room dims", docs/V2.md).
 *
 * The bar at the bottom: "Begin practice" (gold) with "Mark as done" (quiet) under it; without a
 * video (or while it plays), "Mark as done" alone, as a ghost button. A lesson done before shows a
 * quiet line above the bar ("Done yesterday") and its button reads "Done again". "Mark as done",
 * and the video reaching its end, open the closing screen (app/lesson-done/[slug].tsx), which records it.
 * The bookmark at the top right saves the lesson (You → Saved).
 */
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChartNoAxesColumnIncreasing, Check, ChevronLeft, Clock, Play, Target } from 'lucide-react-native';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { focusLine, levelLabel, secondsOf } from '@/content/labels';
import { slugsForStaticPages } from '@/content/load';
import { dayOf, findLesson, placeInSeries } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { tick } from '@/lib/haptics';
import { useReduceMotion } from '@/lib/motion';
import { routes, useBack } from '@/lib/nav';
import { doneLine, lastDone } from '@/practice/progress';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { layout, space } from '@/theme';
import { makeStyles, ThemeScope, useTheme } from '@/theme/ThemeProvider';
import {
  Arrive,
  Button,
  canPlay,
  Card,
  Chip,
  Cover,
  DraftChip,
  Fact,
  FlowStep,
  IconButton,
  LoadingPage,
  NotHere,
  Overline,
  PlayButton,
  RichText,
  Screen,
  SectionHeader,
  size,
  Text,
  VideoPlayer,
  youTubeUrl,
  type SeekRequest,
} from '@/ui';

/** Web preview only: the lesson pages to prepare when the website is built. */
export function generateStaticParams() {
  return slugsForStaticPages('lessons');
}

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = useBack(routes.practice);
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const stageStyles = useStageStyles();
  const [stageHeight, setStageHeight] = useState(0);
  const reduce = useReduceMotion();
  const { color } = useTheme();
  const entries = useDays((s) => s.entries);
  const saved = usePractice((s) => (slug ? s.saved.includes(slug) : false));

  const [playing, setPlaying] = useState(false); // the video has taken the place of the cover
  const [failed, setFailed] = useState(false); // the video would not play
  const [seek, setSeek] = useState<SeekRequest>(); // "go to this moment", from a step of the flow

  // "Mark as done", or the video reaching its end: the closing screen opens over the lesson.
  const finish = useCallback(() => {
    if (slug) router.push(routes.lessonDone(slug));
  }, [router, slug]);

  const lesson = findLesson(content, slug);
  if (!lesson) {
    // On a very first launch the content may still be on its way.
    if (status === 'loading') return <LoadingPage />;
    return (
      <NotHere
        sentence={strings.lesson.gone}
        actionLabel={strings.lesson.toPractice}
        onAction={() => router.replace(routes.practice)}
      />
    );
  }

  const video = lesson.video;
  const playable = canPlay(video);
  const place = placeInSeries(content, lesson);
  const anyTime = lesson.flow.some((step) => step.at);

  const play = () => {
    setFailed(false);
    setPlaying(true);
    scroll.current?.scrollTo({ y: 0, animated: !reduce });
  };
  const jumpTo = (seconds: number) => {
    setSeek((last) => ({ seconds, count: (last?.count ?? 0) + 1 }));
    play();
  };
  const onVideoError = () => {
    setPlaying(false);
    setFailed(true);
  };
  const toggleSave = () => {
    tick(); // a light tick in the hand
    usePractice.getState().toggleSave(lesson.slug);
  };
  const saveLabel = saved ? strings.lesson.unsave : strings.lesson.save;

  // Done before: a quiet line above the bar, and "Done again".
  const last = lastDone(entries, lesson.slug);
  const markLabel = last ? strings.lesson.doneAgain : strings.lesson.markDone;
  const footer = (
    <>
      {last ? (
        <View style={styles.doneLine}>
          <Check size={size.icon.xs} strokeWidth={size.tickStroke} color={color.support.sage} />
          <Text variant="meta" color="text.muted">
            {doneLine(last, dayOf(new Date()))}
          </Text>
        </View>
      ) : null}
      {playable && !playing ? (
        <>
          <Button label={strings.lesson.begin} icon={Play} iconFilled onPress={play} />
          <Button kind="quiet" label={markLabel} onPress={finish} />
        </>
      ) : (
        <Button kind="ghost" label={markLabel} onPress={finish} />
      )}
    </>
  );

  return (
    <Screen
      bleed
      scrollRef={scroll}
      // The top of the page is dark: the cover (down to where it melts away), or the video's stage.
      darkTop={playable && playing ? stageHeight : size.cover.lesson * (1 - size.fadeHeight / 2)}
      footer={footer}
    >
      {playable && playing ? (
        // The video, 16:9, on the darkest ground, with the back button above it.
        <ThemeScope scheme="dark">
          <View
            style={[stageStyles.stage, { paddingTop: insets.top + space.sm }]}
            onLayout={(e) => setStageHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.stageTop}>
              <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
              <IconButton icon={Bookmark} active={saved} accessibilityLabel={saveLabel} onPress={toggleSave} />
            </View>
            <VideoPlayer video={video} seek={seek} onError={onVideoError} onEnd={finish} />
          </View>
        </ThemeScope>
      ) : (
        <Cover aura={lesson.aura} image={lesson.cover} height={size.cover.lesson} radius="none" fade>
          <View style={[styles.coverTop, { top: insets.top + space.md }]}>
            <IconButton icon={ChevronLeft} kind="glass" accessibilityLabel={strings.common.back} onPress={back} />
            <IconButton icon={Bookmark} kind="glass" active={saved} accessibilityLabel={saveLabel} onPress={toggleSave} />
          </View>
          {playable ? (
            <View style={styles.coverCentre} pointerEvents="box-none">
              <PlayButton accessibilityLabel={strings.lesson.play} onPress={play} />
            </View>
          ) : null}
        </Cover>
      )}

      <View style={[styles.sections, playing ? styles.underStage : styles.overCover]}>
        <Arrive index={0} style={styles.header}>
          {place || lesson.draft ? (
            <View style={styles.labels}>
              {place ? (
                <Overline tone="area" area="move">
                  {strings.lesson.place(place.series.title, place.position, place.count)}
                </Overline>
              ) : null}
              <DraftChip item={lesson} />
            </View>
          ) : null}
          <Text variant="h1" accessibilityRole="header">
            {lesson.title}
          </Text>
          <View style={styles.facts}>
            <Fact icon={Clock} ink="area.move" label={strings.common.minutes(lesson.minutes)} />
            <Fact icon={ChartNoAxesColumnIncreasing} ink="area.move" label={levelLabel(lesson.level)} />
            {lesson.focus.length > 0 ? <Fact icon={Target} ink="area.move" label={focusLine(lesson.focus)} /> : null}
          </View>
        </Arrive>

        {failed && playable ? (
          <Card style={styles.problem}>
            <Text variant="body" color="text.secondary">
              {strings.lesson.videoError}
            </Text>
            <Button
              kind="ghost"
              label={strings.lesson.openYouTube}
              onPress={() => void Linking.openURL(youTubeUrl(video, seek?.seconds)).catch(() => {})}
            />
          </Card>
        ) : null}

        <Arrive index={1}>
          {lesson.body.length > 0 ? (
            <RichText blocks={lesson.body} ink="text.secondary" />
          ) : (
            <Text variant="bodyLarge" color="text.secondary">
              {lesson.summary}
            </Text>
          )}
        </Arrive>

        {lesson.props.length > 0 ? (
          <Arrive index={2} style={styles.need}>
            <SectionHeader title={strings.lesson.need} />
            <View style={styles.props}>
              {lesson.props.map((prop) => (
                <Chip key={prop} label={prop} />
              ))}
            </View>
          </Arrive>
        ) : null}

        {lesson.flow.length > 0 ? (
          <Arrive index={3} style={styles.flow}>
            <SectionHeader title={strings.lesson.flow} />
            <View>
              {lesson.flow.map((step, i) => {
                const seconds = playable ? secondsOf(step.at) : undefined;
                return (
                  <FlowStep
                    key={i}
                    name={step.name}
                    note={step.note}
                    at={step.at}
                    timeColumn={anyTime}
                    last={i === lesson.flow.length - 1}
                    onPress={seconds === undefined ? undefined : () => jumpTo(seconds)}
                    accessibilityHint={strings.lesson.stepHint}
                  />
                );
              })}
            </View>
          </Arrive>
        ) : null}

        {lesson.note ? (
          <Arrive index={4}>
            <Card padding="xl" style={styles.note}>
              <Overline tone="area" area="move">
                {strings.lesson.noteFrom(content.site.teacherFirstName)}
              </Overline>
              <Text variant="quote">{lesson.note}</Text>
            </Card>
          </Arrive>
        ) : null}
      </View>
    </Screen>
  );
}

// The video's stage: always dark (drawn inside a dark ThemeScope).
const useStageStyles = makeStyles((color) =>
  StyleSheet.create({
    stage: { backgroundColor: color.bg.sunken, gap: space.sm },
  }),
);

const styles = StyleSheet.create({
  stageTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: layout.gutter },
  coverTop: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Lower than the top of the bar's fade, so the words behind it never show through the line.
  doneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
    marginTop: space.md,
    marginBottom: space.xs,
  },
  coverCentre: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sections: { paddingHorizontal: layout.gutter, gap: space.xxl },
  // The title climbs onto the lower, faded part of the cover.
  overCover: { marginTop: -size.coverOverlap },
  underStage: { marginTop: space.xl },
  header: { gap: space.sm },
  labels: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.xs },
  problem: { gap: space.md },
  need: { gap: space.sm },
  props: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  flow: { gap: space.xxs },
  note: { gap: space.sm },
});
