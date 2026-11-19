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
 * In the preview app and on the web, &page=<id> opens any page, to check how it looks, and
 * &round=<n> opens it as if in that round (week 3, week 10).
 *
 * Phase 6: prompts shown only in some rounds; "Week 3 · Day 5"; the week's dots, read from the
 * pages of the start this page belongs to (src/journal/cycles.ts) and from what is on screen now;
 * a choice filled in from today's lessons, kept with the page's next answer or by "Done"; the
 * button that hands an answer to another journal ("Make it a habit"), and the page that receives it.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GuidedJournal, GuidedPrompt } from '../shared/content-schema';

import { dayOf } from '@/content/selectors';
import { useContent } from '@/content/store';
import { useDays } from '@/day/store';
import { atCycle, currentCycle, inCycles } from '@/journal/cycles';
import { longDay } from '@/journal/dates';
import { dotsOf } from '@/journal/dots';
import { answerLines } from '@/journal/exportText';
import {
  findPrompt,
  isFree,
  isOpenToday,
  isStarted,
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
import { canPrefill, lessonMinutes, suggestedOption, suggestionsOf } from '@/journal/prefill';
import { useJournal } from '@/journal/store';
import { cycleOf, hasWriting, isEmptyValue, newEntryId, withAnswer, type Answer, type JournalEntry } from '@/journal/types';
import { useJournalPages } from '@/journal/usePages';
import { useWriting } from '@/journal/useWriting';
import { tick } from '@/lib/haptics';
import { routes, useBack } from '@/lib/nav';
import { canShowSample } from '@/practice/demo';
import { strings } from '@/strings';
import { space } from '@/theme';
import { Arrive, Button, Card, EmptyState, IconButton, LoadingPage, NotHere, Overline, Prompt, Screen, Text } from '@/ui';

type Params = { journal?: string; entry?: string; page?: string; round?: string };

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
  return (
    <GuidedPage
      key={`${journal.slug}|${params.entry ?? ''}|${params.page ?? ''}|${params.round ?? ''}`}
      journal={journal}
      entryId={params.entry}
      pageId={params.page}
      round={Number(params.round) || 1}
    />
  );
}

/** What this opening writes on: a new page at a step, a page written before, or nothing (written today). */
type Target = { kind: 'new'; id: string; step: Step } | { kind: 'past'; id: string } | { kind: 'closed'; id: '' };

type PageProps = { journal: GuidedJournal; entryId?: string; pageId?: string; round: number };

function GuidedPage({ journal, entryId, pageId, round: previewRound }: PageProps) {
  const router = useRouter();
  const back = useBack(routes.guided(journal.slug));
  const { all, current, cycles, begun } = useJournalPages();
  const journals = useContent((s) => s.content.guidedJournals ?? []);
  const days = useDays((s) => s.entries);
  // Choices filled in from today's practice and then tapped away on this page, not yet kept with it.
  const [declinedHere, setDeclinedHere] = useState<string[]>([]);

  const [target] = useState<Target>(() => {
    if (entryId) return { kind: 'past', id: entryId };
    const preview = pageId && canShowSample ? stepOfPage(journal, pageId, previewRound) : undefined;
    if (preview) return { kind: 'new', id: newEntryId(), step: preview };
    const { entries, cycles: now } = useJournal.getState();
    const seen = inCycles(entries, now);
    const next = nextPageOf(journal, seen);
    if (next && isOpenToday(journal, seen, dayOf(new Date()))) return { kind: 'new', id: newEntryId(), step: next };
    return { kind: 'closed', id: '' };
  });
  const { entry, save, keepAsWritten } = useWriting(target.id);
  const received = useRef(false);

  const step: Step | undefined =
    target.kind === 'new'
      ? target.step
      : entry
        ? { section: entry.section ?? '', page: entry.page ?? '', round: entry.round ?? 1, time: entry.time ?? 1 }
        : undefined;
  const at = step ? pageAt(journal, step) : undefined;
  const answers = entry?.answers ?? {};
  const today = dayOf(new Date());
  // The start this page belongs to: today's page, the current one; a page reread, its own.
  const cycle = target.kind === 'new' ? currentCycle(cycles, journal.slug) : entry ? cycleOf(entry) : 1;
  const ofItsStart = atCycle(all, cycles, journal.slug, cycle);

  // Today's practice, known without asking: a choice with `prefill`, on a page of today, with no answer yet.
  const declined = [...new Set([...(entry?.declined ?? []), ...declinedHere])];
  const ofToday = target.kind === 'new' || entry?.day === today;
  const minutes = lessonMinutes(days, today);
  const suggestions = at ? suggestionsOf(at.page.prompts, answers, declined, minutes, ofToday, step!.round) : {};
  const shown = { ...answers, ...suggestions };

  /** The page as it is first written: its place, its start, and the titles it has today. */
  const fresh = (): JournalEntry => {
    const now = new Date();
    return {
      id: target.id,
      kind: 'guided',
      day: dayOf(now),
      created: now.toISOString(),
      updated: now.toISOString(),
      journal: journal.slug,
      ...step!,
      cycle: currentCycle(useJournal.getState().cycles, journal.slug),
      answers: {},
      titles: { journal: journal.title, section: at!.section.title, page: at!.page.title },
    };
  };

  /** The page with today's suggestions still showing kept in it. */
  const withSuggestions = (page: JournalEntry, except: readonly string[]): JournalEntry =>
    Object.entries(suggestions).reduce((kept, [id, suggestion]) => (except.includes(id) ? kept : withAnswer(kept, id, suggestion)), page);

  const answer = (prompt: GuidedPrompt, value: Answer) => {
    if (!('id' in prompt)) return;
    // Touching a choice filled in from today's practice makes it the person's own: never suggested again here.
    const nowDeclined = canPrefill(prompt) && !declined.includes(prompt.id) ? [...declined, prompt.id] : declined;
    if (nowDeclined !== declined) setDeclinedHere(nowDeclined);
    // Nothing to keep yet: a page is made by its first answer, not by a suggestion tapped away.
    if (!entry && isEmptyValue(value.value)) return;
    const next = withSuggestions(withAnswer(entry ?? fresh(), prompt.id, value), [prompt.id, ...nowDeclined]);
    // Writing on a page that was passed makes it a written page.
    save({ ...next, skipped: false, ...(nowDeclined.length > 0 ? { declined: nowDeclined } : {}) });
  };

  // An answer handed from another journal ("Make it a habit") lands on its page as if typed, once.
  const carried = useJournal((s) => s.carried);
  useEffect(() => {
    if (received.current || !carried || carried.journal !== journal.slug || target.kind !== 'new' || !at) return;
    const prompt = at.page.prompts.find((p) => p.kind === 'text' && p.id === carried.prompt);
    if (!prompt || prompt.kind !== 'text') return;
    received.current = true;
    useJournal.getState().carry(undefined);
    const page = useJournal.getState().entries.find((e) => e.id === target.id);
    if (isEmptyValue(page?.answers?.[prompt.id]?.value) && carried.text.trim() !== '') {
      // As if typed: the page's first answer, with today's suggestions kept along.
      const answered = withAnswer(page ?? fresh(), prompt.id, { ask: prompt.ask, value: carried.text });
      save({ ...withSuggestions(answered, [prompt.id, ...declined]), skipped: false });
    }
    // Once, when the page opens with an answer waiting for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carried]);

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
  if (!at || !step) return <ReadingPage entry={entry!} journal={journal} />;
  const { section, page } = at;
  const number = pageNumber(journal, step);

  const done = () => {
    tick(); // a light tick in the hand
    if (target.kind === 'new' || entry) {
      if (Object.keys(suggestions).length > 0) {
        // "Done" keeps what today's practice filled in: the page is written with it.
        const next = withSuggestions(entry ?? fresh(), []);
        if (entry) save(next);
        else keepAsWritten(next);
      } else if (!entry && nothingToAnswer(page)) {
        // A page with nothing to answer is written by "Done" alone.
        keepAsWritten(fresh());
      }
    }
    back();
  };

  /** "Not today", or the way past a page this version cannot draw: the next page opens at once. */
  const pass = () => {
    tick();
    save({ ...fresh(), skipped: true });
    router.replace(routes.write(journal.slug));
  };

  /** The button that hands a text to another journal, while that journal is free (one habit at a time). */
  const carryOf = (prompt: GuidedPrompt) => {
    if (prompt.kind !== 'text' || !prompt.carry) return undefined;
    const { to, prompt: into, label } = prompt.carry;
    const other = journals.find((j) => j.slug === to);
    if (!other || !isFree(other, current)) return undefined;
    return {
      label,
      onPress: () => {
        const text = typeof shown[prompt.id]?.value === 'string' ? (shown[prompt.id].value as string) : '';
        useJournal.getState().carry({ journal: to, prompt: into, text });
        router.push(isStarted(other, all, begun) ? routes.write(to) : routes.guidedAbout(to));
      },
    };
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
        {page.prompts.map((prompt, i) => {
          if (!isVisible(prompt, shown, step.round)) return null;
          const own = 'id' in prompt ? shown[prompt.id] : undefined;
          // The line under a choice of today whose chosen option is the one today's practice picks.
          const picked = ofToday ? suggestedOption(prompt, minutes) : undefined;
          return (
            <Prompt
              key={'id' in prompt ? prompt.id : `${prompt.kind}-${i}`}
              prompt={prompt}
              answer={own}
              onAnswer={(value) => answer(prompt, value)}
              recalled={prompt.kind === 'recall' ? recalled(journal, ofItsStart, prompt, target.id) : undefined}
              dots={prompt.kind === 'dots' ? dotsOf(journal, ofItsStart, step, prompt.rows, { id: target.id, answers: shown }) : undefined}
              prefillLine={picked !== undefined && own?.value === picked ? strings.journal.fromPractice(minutes) : undefined}
              carry={carryOf(prompt)}
            />
          );
        })}
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
