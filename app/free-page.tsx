/**
 * A free page (/free-page, or /free-page?entry=<id> for one written before).
 *
 * The long date as its overline; the chosen prompt in italic above the text; then one large field
 * that fills the screen. While the page is still empty, a quiet "Give me a prompt": each tap shows
 * the next line of the pool (strings.journal.freePrompts), and the one showing when writing starts
 * is kept with the page. ?prompt=after-practice opens it with that line already chosen (the
 * hand-off after a lesson). At the end, the gold "Done", and at the very bottom a quiet "Delete
 * this page", confirmed in place ("Delete" and "Keep"), never with a system pop-up.
 *
 * Saving, the candle and leaving are those of every writing screen (src/journal/useWriting.ts).
 */
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { dayOf } from '@/content/selectors';
import { longDay } from '@/journal/dates';
import { hasWriting, newEntryId, type JournalEntry } from '@/journal/types';
import { useWriting } from '@/journal/useWriting';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, IconButton, Overline, Screen, size, Text, WritingField } from '@/ui';

const pool = strings.journal.freePrompts;
const promptText = (id: string | undefined) => pool.find((p) => p.id === id)?.text;

export default function FreePageScreen() {
  const params = useLocalSearchParams<{ entry?: string; prompt?: string }>();
  const back = useBack(routes.freePages);
  const { height } = useWindowDimensions();
  const [id] = useState(() => params.entry ?? newEntryId());
  const { entry, save, forget } = useWriting(id);
  // The line of the pool showing now (before writing starts; then the page keeps its own).
  const [shown, setShown] = useState<string | undefined>(() => entry?.prompt ?? (promptText(params.prompt) ? params.prompt : undefined));
  const [confirming, setConfirming] = useState(false);
  const written = !!entry && hasWriting(entry);
  const prompt = written ? entry.prompt : shown;
  const day = entry?.day ?? dayOf(new Date());

  const write = (text: string) => {
    const now = new Date().toISOString();
    const base: JournalEntry = entry ?? { id, kind: 'free', day: dayOf(new Date()), created: now, updated: now };
    // The prompt showing when the writing starts is the one the page keeps.
    save({ ...base, text, ...(written ? null : { prompt: shown }) });
  };

  const nextPrompt = () => {
    tick();
    const at = pool.findIndex((p) => p.id === shown);
    setShown(pool[(at + 1) % pool.length].id);
  };

  const done = () => {
    tick(); // a light tick in the hand
    back();
  };

  const erase = () => {
    tick();
    forget();
    back();
  };

  return (
    <Screen keyboard contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.titles}>
          <Overline tone="area" area="write" accessibilityRole="header">
            {longDay(day)}
          </Overline>
          {promptText(prompt) ? (
            <Text variant="quote" color="text.secondary">
              {promptText(prompt)}
            </Text>
          ) : null}
          {written ? null : (
            <Button
              kind="quiet"
              icon={Sparkles}
              label={shown ? strings.journal.anotherPrompt : strings.journal.giveMePrompt}
              onPress={nextPrompt}
              style={styles.promptButton}
            />
          )}
        </View>
      </Arrive>

      <Arrive index={1} style={styles.page}>
        <WritingField
          bare
          value={entry?.text ?? ''}
          onChangeText={write}
          label={promptText(prompt) ?? strings.journal.freeField}
          placeholder={strings.journal.freeField}
          minHeight={height * size.freePage}
        />
      </Arrive>

      <Arrive index={2} style={styles.end}>
        <Button label={strings.journal.done} onPress={done} />
        {entry ? (
          confirming ? (
            <View style={styles.confirm}>
              <Text variant="meta" color="text.secondary" center>
                {strings.journal.deleteConfirm}
              </Text>
              <Button kind="danger" label={strings.journal.delete} onPress={erase} />
              <Button kind="quiet" label={strings.journal.keep} onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <Button kind="quiet" label={strings.journal.deletePage} onPress={() => setConfirming(true)} />
          )
        ) : null}
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl, flexGrow: 1 },
  header: { gap: space.xl },
  titles: { gap: space.sm },
  promptButton: { alignSelf: 'flex-start', marginLeft: -space.md },
  page: { flexGrow: 1 },
  end: { gap: space.xs, marginTop: space.sm },
  confirm: { gap: space.xs, paddingTop: space.sm },
});
