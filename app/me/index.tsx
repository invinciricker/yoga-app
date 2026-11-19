/**
 * You: the person's own page, opened from the round "You" button on Home. A settings page in the
 * phone's theme. From the top: the title; the person's practice (three numbers, the week card,
 * Saved, History and, once something is written, Export my journal); the settings: Appearance and
 * Reduce motion, About and Privacy; Delete my data; and in the preview app only the design gallery.
 *
 * Before anything has been done, the numbers, the week and History give their place to one quiet
 * line. Saved stays whenever something is saved (otherwise, with fewer than 8 lessons, the saved
 * lessons could not be found anywhere).
 */
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useContent } from '@/content/store';
import { useWeek } from '@/day/hooks';
import { longestStreak, totals } from '@/day/record';
import { useDays } from '@/day/store';
import { useJournal } from '@/journal/store';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { usePrefs } from '@/lib/prefs';
import { isPreview } from '@/lib/variant';
import { savedLessons } from '@/practice/progress';
import { usePractice } from '@/practice/store';
import { strings } from '@/strings';
import { space, type Appearance } from '@/theme';
import { Arrive, Button, Chip, IconButton, ListCard, Screen, SectionHeader, SettingsRow, size, Text, WeekCard } from '@/ui';

const choices: { key: Appearance; label: string }[] = [
  { key: 'system', label: strings.me.system },
  { key: 'light', label: strings.me.light },
  { key: 'dark', label: strings.me.dark },
];

export default function YouScreen() {
  const router = useRouter();
  const back = useBack(routes.home);
  const appearance = usePrefs((s) => s.appearance);
  const setAppearance = usePrefs((s) => s.setAppearance);
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const setReduceMotion = usePrefs((s) => s.setReduceMotion);
  const content = useContent((s) => s.content);
  const entries = useDays((s) => s.entries);
  const saved = usePractice((s) => s.saved);
  const written = useJournal((s) => s.entries.some((e) => !e.skipped));
  const weekCard = useWeek();
  const sum = totals(entries);
  const savedCount = savedLessons(content, saved).length;
  const numbers = [
    { value: sum.days, word: strings.me.days(sum.days) },
    { value: sum.minutes, word: strings.me.minutes(sum.minutes) },
    { value: longestStreak(entries), word: strings.me.longest },
  ];
  const savedRow =
    savedCount > 0 || entries.length > 0 ? (
      <SettingsRow label={strings.me.saved} detail={String(savedCount)} onPress={() => router.push(routes.saved)} />
    ) : null;
  // The journal leaves the phone only by the person's own hand (Phase 5).
  const exportRow = written ? <SettingsRow label={strings.journal.exportTitle} onPress={() => router.push(routes.exportJournal)} /> : null;

  const choose = (key: Appearance) => {
    if (key === appearance) return;
    tick(); // a light tick in the hand
    setAppearance(key);
  };

  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <Text variant="display" accessibilityRole="header">
          {strings.me.title}
        </Text>
      </Arrive>

      {/* The person's practice: what was done, and where to find it again. */}
      <Arrive index={1} style={styles.block}>
        {entries.length > 0 ? (
          <>
            <View style={styles.numbers}>
              {numbers.map((n) => (
                <View key={n.word} style={styles.number} accessible accessibilityLabel={`${n.value} ${n.word}`}>
                  <Text variant="h1" style={styles.figure}>
                    {n.value}
                  </Text>
                  <Text variant="meta" color="text.muted">
                    {n.word}
                  </Text>
                </View>
              ))}
            </View>
            <WeekCard days={weekCard.days} streak={weekCard.streak} ever={weekCard.ever} />
            <ListCard>
              {savedRow}
              <SettingsRow label={strings.me.history} onPress={() => router.push(routes.history)} />
              {exportRow}
            </ListCard>
          </>
        ) : (
          <>
            <Text variant="bodyLarge" color="text.secondary">
              {strings.me.nothingYet}
            </Text>
            {savedRow || exportRow ? (
              <ListCard>
                {savedRow}
                {exportRow}
              </ListCard>
            ) : null}
          </>
        )}
      </Arrive>

      <Arrive index={2} style={styles.block}>
        <SectionHeader title={strings.me.appearance} />
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={strings.me.appearance}>
          {choices.map((c) => (
            <Chip key={c.key} label={c.label} selected={appearance === c.key} onPress={() => choose(c.key)} />
          ))}
        </View>
        <ListCard>
          <SettingsRow
            label={strings.me.reduceMotion}
            line={strings.me.reduceMotionLine}
            value={reduceMotion}
            onValueChange={(on) => {
              tick();
              setReduceMotion(on);
            }}
          />
        </ListCard>
      </Arrive>

      <Arrive index={3}>
        <ListCard>
          <SettingsRow label={strings.me.about} onPress={() => router.push(routes.about)} />
          <SettingsRow label={strings.me.privacy} onPress={() => router.push(routes.privacy)} />
        </ListCard>
      </Arrive>

      <Arrive index={4}>
        <ListCard>
          <SettingsRow label={strings.me.deleteData} danger onPress={() => router.push(routes.deleteData)} />
        </ListCard>
      </Arrive>

      {isPreview ? (
        <Arrive index={5}>
          <Button
            kind="quiet"
            label={strings.me.galleryLink}
            onPress={() => router.push(routes.gallery)}
            style={styles.galleryLink}
          />
        </Arrive>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  block: { gap: space.md },
  chips: { flexDirection: 'row', gap: space.xs, paddingVertical: space.xxs },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md },
  number: { flex: 1, minWidth: size.numberColumn, gap: space.xxs },
  // "Lining" figures: the old-style figures of this typeface sit low and look like letters.
  figure: { fontVariant: ['lining-nums', 'tabular-nums'] },
  // The quiet button's words line up with the text above.
  galleryLink: { alignSelf: 'flex-start', marginLeft: -space.md },
});
