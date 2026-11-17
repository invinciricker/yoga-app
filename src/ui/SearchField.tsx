/**
 * SearchField: the box where a word is typed to find a lesson.
 * A cross appears when there is text, to empty it in one tap.
 */
import { Search, X } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { color, font, layout, radius, space, type } from '@/theme';

import { size } from './sizes';

export type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Shown while the box is empty, and read aloud as its name. */
  placeholder: string;
  /** What the cross does, read aloud ("Clear the search"). */
  clearLabel: string;
};

export function SearchField({ value, onChangeText, placeholder, clearLabel }: SearchFieldProps) {
  return (
    <View style={styles.box}>
      <Search size={size.icon.md} strokeWidth={size.stroke.regular} color={color.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.text.muted}
        accessibilityLabel={placeholder}
        selectionColor={color.accent.gold}
        cursorColor={color.accent.gold}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        maxFontSizeMultiplier={size.fontScaleMax}
        style={styles.input}
      />
      {value !== '' ? (
        <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} onPress={() => onChangeText('')} style={styles.clear}>
          <X size={size.icon.md} strokeWidth={size.stroke.regular} color={color.text.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: size.search,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.md,
    borderRadius: radius.md,
    borderWidth: size.stroke.hairline,
    borderColor: color.border.subtle,
    backgroundColor: color.bg.raised,
  },
  // The size of "title", in the regular weight: what is typed is not a heading.
  input: {
    ...type.title,
    fontFamily: font.body,
    color: color.text.primary,
    flex: 1,
    minWidth: 0,
    minHeight: layout.touchMin,
    paddingVertical: 0,
    paddingRight: space.md,
    // The web draws its own outline around a focused field; the box is enough.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  clear: { width: layout.touchMin, height: layout.touchMin, alignItems: 'center', justifyContent: 'center' },
});
