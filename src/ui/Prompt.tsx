/**
 * Prompt: one prompt of a guided journal's page (docs/phases/phase-5.md, section 2).
 *
 *   note    a quiet card, its text in body, text.secondary
 *   text    a field that starts at `lines` rows and grows; with `share`, a quiet button with those
 *           words and a send icon appears under it once it holds text (the system share sheet)
 *   list    `count` one-line fields, numbered in meta
 *   choice  chips, one chosen or several; a second tap clears a chip
 *   scale   round buttons from `from` to `to`, the chosen one filled gold; `low` and `high` under
 *           the two ends; 0 to 10 makes two rows (0 to 5, 6 to 10), every button at least 48
 *   yesno   two chips, "Yes" and "No"
 *   fill    the sentence, with a short field for each blank, wrapping like text
 *   recall  a quote: its label, an earlier answer, and the day it was written (given by the page)
 *   dots    the week as rows of dots (Phase 6, the Dots part), its rows worked out by the page
 *
 * Phase 6 also gives a hint to a choice, a scale and a yes or no (drawn as on a text); a line under
 * a choice filled in from today's practice ("From your practice today: 25 min"); and, on a text
 * that hands its answer to another journal, a quiet button with an arrow ("Make it a habit").
 *
 * The question is in `title`, a hint under it in `meta`. Every field has its question as its name
 * for screen readers. The chips use the soft look: "Done" is the page's one gold fill, besides the
 * chosen number of a scale.
 */
import { ArrowRight, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { sentencePieces, type GuidedPrompt } from '../../shared/content-schema';

import type { DotsRow } from '@/journal/dots';
import type { Answer } from '@/journal/types';
import { tick } from '@/lib/haptics';
import { strings } from '@/strings';
import { radius, space } from '@/theme';
import { makeStyles } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Dots } from './Dots';
import { PressableScale } from './PressableScale';
import { RichText } from './RichText';
import { size } from './sizes';
import { Text } from './Text';
import { WritingField } from './WritingField';

export type Recalled = { lines: string[]; day: string };

export type PromptProps = {
  prompt: GuidedPrompt;
  answer?: Answer;
  onAnswer: (answer: Answer) => void;
  /** A recall: the earlier answer as lines, and its day in words. Nothing shows without it. */
  recalled?: Recalled;
  /** Dots: their rows, worked out by the page (dotsOf in src/journal/dots.ts). */
  dots?: DotsRow[];
  /** A choice filled in from today's practice: the line under its chips. */
  prefillLine?: string;
  /** A text whose answer can go to another journal: the button's words and what it does. */
  carry?: { label: string; onPress: () => void };
};

/** The question and its hint. */
function Question({ ask, hint }: { ask: string; hint?: string }) {
  return (
    <View style={styles.question}>
      <Text variant="title" accessibilityRole="header">
        {ask}
      </Text>
      {hint ? (
        <Text variant="meta" color="text.secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function Prompt({ prompt, answer, onAnswer, recalled, dots, prefillLine, carry }: PromptProps) {
  const value = answer?.value;
  switch (prompt.kind) {
    case 'note':
      return (
        <Card style={styles.note}>
          <RichText blocks={prompt.text} ink="text.secondary" size="body" />
        </Card>
      );

    case 'text': {
      const text = typeof value === 'string' ? value : '';
      const share = prompt.share;
      return (
        <View style={styles.prompt}>
          <Question ask={prompt.ask} hint={prompt.hint} />
          <WritingField value={text} onChangeText={(t) => onAnswer({ ask: prompt.ask, value: t })} label={prompt.ask} lines={prompt.lines} />
          {share && text.trim() !== '' ? (
            <Button
              kind="quiet"
              icon={Send}
              label={share}
              onPress={() => void Share.share({ message: text }).catch(() => {})}
              style={styles.share}
            />
          ) : null}
          {carry && text.trim() !== '' ? (
            <Button kind="quiet" icon={ArrowRight} label={carry.label} onPress={carry.onPress} style={styles.share} />
          ) : null}
        </View>
      );
    }

    case 'list': {
      const lines = Array.from({ length: prompt.count }, (_, i) => (Array.isArray(value) ? (value[i] ?? '') : ''));
      return (
        <View style={styles.prompt}>
          <Question ask={prompt.ask} hint={prompt.hint} />
          <View style={styles.list}>
            {lines.map((line, i) => (
              <View key={i} style={styles.listRow}>
                <Text variant="meta" color="area.write" tabular style={styles.listNumber}>
                  {i + 1}
                </Text>
                <View style={styles.grow}>
                  <WritingField
                    single
                    value={line}
                    label={`${prompt.ask} ${strings.journal.line(i + 1)}`}
                    onChangeText={(t) => onAnswer({ ask: prompt.ask, value: lines.map((l, n) => (n === i ? t : l)) })}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }

    case 'choice': {
      const chosen = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
      const choose = (option: string) => {
        tick();
        if (prompt.many) {
          const next = chosen.includes(option) ? chosen.filter((o) => o !== option) : [...chosen, option];
          onAnswer({ ask: prompt.ask, value: prompt.options.filter((o) => next.includes(o)) });
        } else {
          onAnswer({ ask: prompt.ask, value: chosen.includes(option) ? '' : option }); // a second tap clears it
        }
      };
      return (
        <View style={styles.prompt}>
          <Question ask={prompt.ask} hint={prompt.hint} />
          <View style={styles.chips} accessibilityRole={prompt.many ? undefined : 'radiogroup'} accessibilityLabel={prompt.ask}>
            {prompt.options.map((option) => (
              <Chip key={option} look="soft" label={option} selected={chosen.includes(option)} onPress={() => choose(option)} />
            ))}
          </View>
          {prefillLine ? (
            <Text variant="meta" color="text.secondary">
              {prefillLine}
            </Text>
          ) : null}
        </View>
      );
    }

    case 'scale':
      return <Scale prompt={prompt} value={typeof value === 'number' ? value : undefined} onAnswer={onAnswer} />;

    case 'yesno': {
      const choose = (yes: boolean) => {
        tick();
        // A second tap clears the answer (an empty text is "no answer").
        onAnswer({ ask: prompt.ask, value: value === yes ? '' : yes });
      };
      return (
        <View style={styles.prompt}>
          <Question ask={prompt.ask} hint={prompt.hint} />
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={prompt.ask}>
            <Chip look="soft" label={strings.journal.yes} selected={value === true} onPress={() => choose(true)} />
            <Chip look="soft" label={strings.journal.no} selected={value === false} onPress={() => choose(false)} />
          </View>
        </View>
      );
    }

    case 'fill':
      return <Fill sentence={prompt.sentence} value={Array.isArray(value) ? value : []} onAnswer={onAnswer} />;

    case 'recall':
      if (!recalled) return null;
      return (
        <Card padding="xl" style={styles.recall}>
          {prompt.label ? (
            <Text variant="meta" color="text.muted">
              {prompt.label}
            </Text>
          ) : null}
          <Text variant="quote">{recalled.lines.join('\n')}</Text>
          <Text variant="meta" color="text.muted">
            {recalled.day}
          </Text>
        </Card>
      );

    case 'dots':
      return <Dots ask={prompt.ask} hint={prompt.hint} rows={dots ?? []} />;

    default:
      // A kind this version does not know never reaches here (the content reader leaves it out).
      return null;
  }
}

type ScalePrompt = Extract<GuidedPrompt, { kind: 'scale' }>;

/** Round buttons, at most six to a row; the chosen one filled gold. */
function Scale({ prompt, value, onAnswer }: { prompt: ScalePrompt; value: number | undefined; onAnswer: (a: Answer) => void }) {
  const look = useScaleStyles();
  // The width the scale has, known after its first layout: with large text on a small phone, six
  // buttons of 48 may not fit on a row, and then each row holds as many as fit (columns in line).
  const [width, setWidth] = useState(0);
  const numbers = Array.from({ length: prompt.to - prompt.from + 1 }, (_, i) => prompt.from + i);
  const wanted = numbers.length > size.scaleRow ? Math.ceil(numbers.length / 2) : numbers.length;
  const fit = width > 0 ? Math.max(1, Math.floor((width + space.xxs) / (size.scale + space.xxs))) : wanted;
  const perRow = Math.min(wanted, fit);
  const rows = Array.from({ length: Math.ceil(numbers.length / perRow) }, (_, r) => numbers.slice(r * perRow, (r + 1) * perRow));
  const choose = (n: number) => {
    tick();
    onAnswer({ ask: prompt.ask, value: value === n ? '' : n }); // a second tap clears it
  };
  return (
    <View style={styles.prompt}>
      <Question ask={prompt.ask} hint={prompt.hint} />
      <View
        style={styles.scale}
        accessibilityRole="radiogroup"
        accessibilityLabel={prompt.ask}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {rows.map((row, r) => (
          <View key={r} style={styles.scaleRow}>
            {Array.from({ length: perRow }, (_, i) => row[i]).map((n, i) =>
              n === undefined ? (
                <View key={`gap-${i}`} style={styles.scaleGap} />
              ) : (
                <PressableScale
                  key={n}
                  onPress={() => choose(n)}
                  accessibilityRole="radio"
                  accessibilityLabel={strings.journal.outOf(n, prompt.to)}
                  accessibilityState={{ selected: value === n }}
                  style={[styles.scaleButton, value === n ? look.chosen : look.open]}
                >
                  <Text variant="label" color={value === n ? 'text.onAccent' : 'text.secondary'} tabular>
                    {n}
                  </Text>
                </PressableScale>
              ),
            )}
          </View>
        ))}
        <View style={styles.scaleEnds}>
          <Text variant="meta" color="text.secondary">
            {prompt.low}
          </Text>
          <Text variant="meta" color="text.secondary" style={styles.high}>
            {prompt.high}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * The sentence, word by word, with a short field for each blank, wrapping like text. What follows a
 * blank without a space ("___, then", "___.") stays with it, so a line never starts with a comma.
 */
function Fill({ sentence, value, onAnswer }: { sentence: string; value: string[]; onAnswer: (a: Answer) => void }) {
  const look = useBlankStyles();
  const pieces = sentencePieces(sentence);
  const blanks = pieces.length - 1;
  const answer = Array.from({ length: blanks }, (_, i) => value[i] ?? '');
  // The first word of each piece after a blank, when it is written right against the blank.
  const glued = pieces.map((piece, i) => (i > 0 ? (/^\S+/.exec(piece)?.[0] ?? '') : ''));
  return (
    <View style={styles.fill}>
      {pieces.map((piece, i) => (
        <View key={i} style={styles.fillPiece}>
          {piece
            .slice(glued[i].length)
            .split(/\s+/)
            .filter((word) => word !== '')
            .map((word, w) => (
              <Text key={w} variant="bodyLarge" style={styles.fillWord}>
                {word}
              </Text>
            ))}
          {i < blanks ? (
            <View style={styles.fillBlank}>
              <WritingField
                single
                bare
                value={answer[i]}
                label={`${sentence} ${strings.journal.blank(i + 1)}`}
                onChangeText={(t) => onAnswer({ ask: sentence, value: answer.map((a, n) => (n === i ? t : a)) })}
                style={[styles.blank, look.line]}
              />
              {glued[i + 1] ? (
                <Text variant="bodyLarge" style={styles.fillWord}>
                  {glued[i + 1]}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { gap: space.sm },
  question: { gap: space.xxs },
  note: { gap: space.sm },
  share: { alignSelf: 'flex-start', marginLeft: -space.md },
  list: { gap: space.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  listNumber: { minWidth: space.sm },
  grow: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, paddingVertical: space.xxs },
  scale: { gap: space.sm },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xxs },
  scaleButton: {
    width: size.scale,
    height: size.scale,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleGap: { width: size.scale },
  scaleEnds: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  high: { textAlign: 'right' },
  // The pieces sit side by side and wrap; each piece wraps its own words.
  fill: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.xs },
  fillPiece: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.xs, flexShrink: 1 },
  fillWord: { paddingVertical: space.xxs },
  fillBlank: { flexDirection: 'row', alignItems: 'center' },
  blank: { minWidth: size.blank, paddingHorizontal: space.xxs },
  recall: { gap: space.xs },
});

const useScaleStyles = makeStyles((color) =>
  StyleSheet.create({
    open: { borderWidth: size.stroke.hairline, borderColor: color.border.strong },
    chosen: { backgroundColor: color.accent.fill, borderWidth: size.stroke.hairline, borderColor: color.accent.fillBorder },
  }),
);

/** A blank of a fill: a line to write on. */
const useBlankStyles = makeStyles((color) =>
  StyleSheet.create({
    line: { borderBottomWidth: size.stroke.hairline, borderBottomColor: color.border.strong },
  }),
);
