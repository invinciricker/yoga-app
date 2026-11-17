/**
 * DraftChip: the small "Draft" label on something Maria has not published yet.
 * Only the preview app ever receives drafts, and only the preview app shows this.
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { color, radius, space } from '@/theme';

import { size } from './sizes';
import { Text } from './Text';

export type DraftChipProps = {
  /** The item it labels: the chip appears only when the item is a draft. */
  item: { draft?: boolean };
  style?: StyleProp<ViewStyle>;
};

export function DraftChip({ item, style }: DraftChipProps) {
  if (!isPreview || !item.draft) return null;
  return (
    <View style={[styles.chip, style]}>
      <Text variant="overline" color="support.ember">
        {strings.common.draft}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    minHeight: size.draftChip,
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: size.stroke.hairline,
    borderColor: color.border.strong,
    backgroundColor: color.bg.elevated,
  },
});
