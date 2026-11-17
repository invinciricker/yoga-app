/**
 * RichText: draws the text of a lesson, a series or a journal entry.
 *
 * The content build has already turned Maria's Markdown into simple "blocks" (paragraph, heading,
 * list, quote, picture: see shared/content-schema.ts). This part gives each block its type style.
 * A kind of block this version of the app does not know is skipped, never an error.
 */
import * as Linking from 'expo-linking';
import { StyleSheet, View } from 'react-native';

import type { Block, Span } from '../../shared/content-schema';

import { font, space, type, type InkColor } from '@/theme';
import { makeStyles } from '@/theme/ThemeProvider';

import { Card } from './Card';
import { Cover } from './Cover';
import { size } from './sizes';
import { Text, type TextVariant } from './Text';

export type RichTextProps = {
  blocks: Block[];
  /** The colour of paragraphs and lists: full ivory for a reading page, softer on a lesson. */
  ink?: InkColor;
};

/**
 * The words of one paragraph, each piece with its own styling. A styled piece keeps the size
 * and the colour of the sentence it sits in. Links are gold and open in the browser.
 */
function Spans({ spans, variant, ink }: { spans: Span[]; variant: TextVariant; ink: InkColor }) {
  return (
    <>
      {spans.map((span, i) => {
        if (!span.bold && !span.italic && !span.href) return span.text;
        const href = span.href;
        return (
          <Text
            key={i}
            variant={variant}
            color={href ? 'accent.gold' : ink}
            accessibilityRole={href ? 'link' : undefined}
            onPress={href ? () => void Linking.openURL(href).catch(() => {}) : undefined}
            style={[span.bold && styles.bold, span.italic && styles.italic, href && styles.link]}
          >
            {span.text}
          </Text>
        );
      })}
    </>
  );
}

export function RichText({ blocks, ink = 'text.primary' }: RichTextProps) {
  const dots = useDots();
  return (
    <View style={styles.blocks}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <Text key={i} variant="bodyLarge" color={ink}>
                <Spans spans={block.spans} variant="bodyLarge" ink={ink} />
              </Text>
            );
          case 'heading':
            return (
              <Text key={i} variant="h3" accessibilityRole="header">
                {block.text}
              </Text>
            );
          case 'list':
            return (
              <View key={i} style={styles.list}>
                {block.items.map((item, n) => (
                  <View key={n} style={styles.item}>
                    {block.ordered ? (
                      <Text variant="bodyLarge" color="accent.gold" tabular style={styles.number}>
                        {n + 1}.
                      </Text>
                    ) : (
                      <View style={styles.bulletBox}>
                        <View style={dots.bullet} />
                      </View>
                    )}
                    <Text variant="bodyLarge" color={ink} style={styles.itemText}>
                      <Spans spans={item} variant="bodyLarge" ink={ink} />
                    </Text>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            // A card, never a coloured line down the left side (docs/DESIGN.md).
            return (
              <Card key={i} padding="xl">
                <Text variant="quote">
                  <Spans spans={block.spans} variant="quote" ink="text.primary" />
                </Text>
              </Card>
            );
          case 'image':
            return (
              <Cover
                key={i}
                aura="candle"
                image={block.image}
                aspect={block.image.w / block.image.h}
                radius="lg"
              />
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: { gap: space.lg },
  bold: { fontFamily: font.bodyStrong },
  italic: { fontStyle: 'italic' },
  link: { textDecorationLine: 'underline' },
  list: { gap: space.xs },
  item: { flexDirection: 'row', gap: space.sm },
  itemText: { flex: 1 },
  number: { minWidth: space.lg },
  // The dot sits in a box as tall as one line of text, so it stays level with the first line.
  bulletBox: { width: space.lg, height: type.bodyLarge.lineHeight, alignItems: 'center', justifyContent: 'center' },
});

const useDots = makeStyles((color) =>
  StyleSheet.create({
    bullet: { width: size.bullet, height: size.bullet, borderRadius: size.bullet, backgroundColor: color.accent.gold },
  }),
);
