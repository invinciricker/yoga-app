/**
 * WritingField: where a person writes in the Journal.
 *   - a box (bg.raised, a hairline, radius 14) that starts at `lines` rows and grows with the
 *     writing; it sinks a little (bg.sunken) while it is being typed in;
 *   - `single`: one line (a line of a list, a blank of a fill);
 *   - `bare`: no box at all, the writing on the page itself (a free page).
 * The writing is in bodyLarge. Its question is its name for screen readers (`label`).
 * The field never scrolls inside itself: it grows, and the page scrolls (Screen keyboard).
 */
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, type StyleProp, type TextStyle } from 'react-native';

import { font, layout, radius, space, type } from '@/theme';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';

import { size } from './sizes';

export type WritingFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Read aloud as the field's name: its question. */
  label: string;
  /** Rows it starts at (it grows from there). Default 3. */
  lines?: number;
  /** One line only. */
  single?: boolean;
  /** No box: the writing sits on the page. */
  bare?: boolean;
  /** At least this high (a free page fills the screen). */
  minHeight?: number;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
};

const LINE = type.bodyLarge.lineHeight;

export function WritingField({ value, onChangeText, label, lines = 3, single = false, bare = false, minHeight, placeholder, style }: WritingFieldProps) {
  const { color } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  // The height of the writing as the field reports it, its padding included (Android measures the
  // text, the web its scrollHeight, which never shrinks below the box: so it cannot feed on itself).
  // The field is never shorter than its rows.
  const [contentHeight, setContentHeight] = useState(0);
  const padding = bare ? 0 : space.sm * 2;
  const rows = single ? 1 : Math.max(1, lines);
  const least = Math.max(minHeight ?? 0, rows * LINE + padding, layout.touchMin);
  const height = single ? undefined : Math.max(least, contentHeight);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={color.text.muted}
      selectionColor={color.accent.gold}
      cursorColor={color.accent.gold}
      multiline={!single}
      scrollEnabled={false}
      textAlignVertical="top"
      autoCapitalize="sentences"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onContentSizeChange={single ? undefined : (e) => setContentHeight(Math.ceil(e.nativeEvent.contentSize.height))}
      maxFontSizeMultiplier={size.fontScaleMax}
      style={[
        styles.input,
        bare ? shape.bare : [styles.box, focused && styles.focused],
        single ? { minHeight: layout.touchMin } : { height },
        style,
      ]}
    />
  );
}

const shape = StyleSheet.create({
  bare: { paddingHorizontal: 0, paddingVertical: 0, borderWidth: 0, backgroundColor: 'transparent' },
});

const useStyles = makeStyles((color) =>
  StyleSheet.create({
    input: {
      ...type.bodyLarge,
      fontFamily: font.body,
      color: color.text.primary,
      // The web draws its own outline around a focused field; the box is enough.
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    box: {
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      borderWidth: size.stroke.hairline,
      borderColor: color.border.subtle,
      backgroundColor: color.bg.raised,
    },
    focused: { backgroundColor: color.bg.sunken, borderColor: color.border.strong },
  }),
);
