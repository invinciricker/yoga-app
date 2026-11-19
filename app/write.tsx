/**
 * Writing a page of a guided journal (docs/phases/phase-5.md, sections 3 and 5).
 *
 *   /write?journal=gratitude              today's page: the next one, if it is open today
 *   /write?journal=gratitude&entry=<id>   a page written before: its answers in place, editable
 *
 * In the phone's theme, like a sheet of paper in the light one. At the top: the back button, the
 * overline ("Gratitude · Week 1 · Noticing", or the day a past page was written), the page's title
 * and, in meta, the long date and "Page 3 of 28". Then the prompts. At the end, the gold "Done"
 * (it saves, gives a light tick and goes back) and, on a page that has one, a quiet skip button.
 * The field being typed in stays above the keyboard (Screen keyboard).
 *
 * The page this opening writes on is decided once, when it opens: the first answer makes the page
 * "written" (src/journal/useWriting.ts), and from then on the journal's NEXT page is another one.
 * In the preview app and on the web, &page=<id> opens any page, to check how it looks.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GuidedJournal, GuidedPrompt } from '../shared/content-schema';

import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { longDay } from '@/journal/dates';
import { answerLines } from '@/journal/exportText';
import {
  findPrompt,
  isOpenToday,
  isVisible,
  nextPageOf,
  nothingToAnswer,
  pageAt,
  pageNumber,
  pageNumberText,
  recallOf,
  stepOfPage,
  type Step,
} from '@/journal/guided';
import { useJournal } from '@/journal/store';
import { hasWriting, newEntryId, withAnswer, type Answer, type JournalEntry } from '@/journal/types';
import { useWriting } from '@/journal/useWriting';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { canShowSample } from '@/practice/demo';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, Card, EmptyState, IconButton, LoadingPage, NotHere, Overline, Prompt, Screen, Text } from '@/ui';

type Params = { journal?: string; entry?: string; page?: string };

export default function WriteScreen() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const content = useContent((s) => s.content);
  const status = useContent((s) => s.status);
  const entry = useJournal((s) => (params.entry ? s.entries.find((e) => e.id === params.entry) : undefined));
  const journal = content.guidedJournals?.find((j) => j.slug === params.journal);

  if (!journal) {
    // A page of a journal no longer in the content: still readable, with the words it kept.
    if (entry) return <ReadingPage entry={entry} />;
    if (status === 'loading') return <LoadingPage />;
    return <NotHere sentence={strings.journal.gone} actionLabel={strings.journal.toJournal} onAction={() => router.replace(routes.journal)} />;
  }
  return <GuidedPage key={`${journal.slug}|${params.entry ?? ''}|${params.page ?? ''}`} journal={journal} entryId={params.entry} pageId={params.page} />;
}

/** What this opening writes on: a new page at a step, a page written before, or nothing (written today). */
type Target = { kind: 'new'; id: string; step: Step } | { kind: 'past'; id: string } | { kind: 'closed'; id: '' };

function GuidedPage({ journal, entryId, pageId }: { journal: GuidedJournal; entryId?: string; pageId?: string }) {
  const router = useRouter();
  const back = useBack(routes.guided(journal.slug));
  const all = useJournal((s) => s.entries);

  const [target] = useState<Target>(() => {
    if (entryId) return { kind: 'past', id: entryId };
    const preview = pageId && canShowSample ? stepOfPage(journal, pageId) : undefined;
    if (preview) return { kind: 'new', id: newEntryId(), step: preview };
    const entries = useJournal.getState().entries;
    const next = nextPageOf(journal, entries);
    if (next && isOpenToday(journal, entries, dayOf(new Date()))) return { kind: 'new', id: newEntryId(), step: next };
    return { kind: 'closed', id: '' };
  });
  const { entry, save, keepAsWritten } = useWriting(target.id);

  if (target.kind === 'closed') {
    return (
      <Screen scroll={false}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <EmptyState sentence={strings.journal.nothingOpen} aura={journal.aura} fill />
      </Screen>
    );
  }
  if (target.kind === 'past' && !entry) {
    // Erased meanwhile (Delete my data), or an old link.
    return <NotHere sentence={strings.notes.gone} actionLabel={strings.journal.toJournal} onAction={() => router.replace(routes.journal)} />;
  }

  const step: Step =
    target.kind === 'new'
      ? target.step
      : { section: entry!.section ?? '', page: entry!.page ?? '', round: entry!.round ?? 1, time: entry!.time ?? 1 };
  const at = pageAt(journal, step);
  if (!at) return <ReadingPage entry={entry!} journal={journal} />;
  const { section, page } = at;
  const number = pageNumber(journal, step);
  const answers = entry?.answers ?? {};
  const today = dayOf(new Date());

  /** The page as it is first written: its place, and the titles it has today. */
  const fresh = (): JournalEntry => {
    const now = new Date();
    return {
      id: target.id,
      kind: 'guided',
      day: dayOf(now),
      created: now.toISOString(),
      updated: now.toISOString(),
      journal: journal.slug,
      ...step,
      answers: {},
      titles: { journal: journal.title, section: section.title, page: page.title },
    };
  };

  const answer = (promptId: string, value: Answer) => {
    // Writing on a page that was passed makes it a written page.
    save({ ...withAnswer(entry ?? fresh(), promptId, value), skipped: false });
  };

  const done = () => {
    tick(); // a light tick in the hand
    // A page with nothing to answer is written by "Done" alone.
    if (!entry && target.kind === 'new' && nothingToAnswer(page)) keepAsWritten(fresh());
    back();
  };

  /** "Not today", or the way past a page this version cannot draw: the next page opens at once. */
  const pass = () => {
    tick();
    save({ ...fresh(), skipped: true });
    router.replace(routes.write(journal.slug));
  };

  const overline =
    target.kind === 'new' ? `${journal.title} · ${section.title}` : strings.journal.writtenOn(longDay(entry!.day));
  const meta = (target.kind === 'new' ? [longDay(today)] : [journal.title, section.title])
    .concat(number ? [pageNumberText(number)] : [])
    .join(' · ');
  const canSkip = target.kind === 'new' && !!page.skip && !(entry && hasWriting(entry));
  const known = new Set(page.prompts.flatMap((p) => ('id' in p ? [p.id] : [])));
  const leftOver = Object.entries(answers).filter(([id]) => !known.has(id));

  return (
    <Screen keyboard contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.titles}>
          <Overline tone="area" area="write">
            {overline}
          </Overline>
          <Text variant="h1" accessibilityRole="header">
            {page.title}
          </Text>
          <Text variant="meta" color="text.secondary">
            {meta}
          </Text>
        </View>
      </Arrive>

      <Arrive index={1} style={styles.prompts}>
        {page.prompts.length === 0 ? (
          // Every prompt of this page is of a kind this version cannot draw (docs/CONTENT.md, "Older apps").
          <Card>
            <Text variant="body" color="text.secondary">
              {strings.journal.newerApp}
            </Text>
          </Card>
        ) : null}
        {page.prompts.map((prompt, i) =>
          isVisible(prompt, answers) ? (
            <Prompt
              key={'id' in prompt ? prompt.id : `${prompt.kind}-${i}`}
              prompt={prompt}
              answer={'id' in prompt ? answers[prompt.id] : undefined}
              onAnswer={(value) => {
                if ('id' in prompt) answer(prompt.id, value);
              }}
              recalled={prompt.kind === 'recall' ? recalled(journal, all, prompt, target.id) : undefined}
            />
          ) : null,
        )}
        {leftOver.length > 0 ? <KeptAnswers answers={leftOver} journal={journal} /> : null}
      </Arrive>

      <Arrive index={2} style={styles.end}>
        {page.prompts.length === 0 && target.kind === 'new' ? (
          <Button kind="ghost" label={strings.journal.passPage} onPress={pass} />
        ) : null}
        <Button label={strings.journal.done} onPress={done} />
        {canSkip ? <Button kind="quiet" label={page.skip!} onPress={pass} /> : null}
      </Arrive>
    </Screen>
  );
}

/** An earlier answer for a recall: its lines and its day, or undefined when there is none. */
function recalled(journal: GuidedJournal, entries: JournalEntry[], prompt: Extract<GuidedPrompt, { kind: 'recall' }>, writing: string) {
  const found = recallOf(journal, entries, prompt.of, prompt.which, writing);
  return found ? { lines: answerLines(found, findPrompt(journal, prompt.of)), day: longDay(found.day) } : undefined;
}

/** Answers whose question is no longer on the page: kept and shown as they were written. */
function KeptAnswers({ answers, journal }: { answers: [string, Answer][]; journal?: GuidedJournal }) {
  return (
    <View style={styles.kept}>
      {answers.map(([id, answer]) => (
        <View key={id} style={styles.keptOne}>
          <Text variant="title">{answer.ask}</Text>
          <Text variant="bodyLarge" color="text.secondary">
            {answerLines(answer, journal ? findPrompt(journal, id) : undefined).join('\n')}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** A page whose page (or whole journal) is no longer in the content: read only, with the words it kept. */
function ReadingPage({ entry, journal }: { entry: JournalEntry; journal?: GuidedJournal }) {
  const back = useBack(routes.journal);
  const title = entry.titles?.page ?? entry.page ?? '';
  const meta = [journal?.title ?? entry.titles?.journal, entry.titles?.section].filter(Boolean).join(' · ');
  return (
    <Screen contentStyle={styles.sections}>
      <Arrive index={0} style={styles.header}>
        <IconButton icon={ChevronLeft} accessibilityLabel={strings.common.back} onPress={back} />
        <View style={styles.titles}>
          <Overline tone="area" area="write">
            {strings.journal.writtenOn(longDay(entry.day))}
          </Overline>
          <Text variant="h1" accessibilityRole="header">
            {title}
          </Text>
          {meta ? (
            <Text variant="meta" color="text.secondary">
              {meta}
            </Text>
          ) : null}
        </View>
      </Arrive>
      <Arrive index={1} style={styles.prompts}>
        <Card>
          <Text variant="body" color="text.secondary">
            {strings.journal.pageGone}
          </Text>
        </Card>
        <KeptAnswers answers={Object.entries(entry.answers ?? {})} journal={journal} />
      </Arrive>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xxl },
  header: { gap: space.xl },
  titles: { gap: space.xs },
  prompts: { gap: space.xxl },
  kept: { gap: space.xl },
  keptOne: { gap: space.xxs },
  end: { gap: space.xs, marginTop: space.sm },
});
