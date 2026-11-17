/**
 * DraftChip: the small "Draft" label on something Maria has not published yet.
 * Only the preview app ever receives drafts, and only the preview app shows this.
 * On a cover, give it onCover: it then keeps its dark look in both themes.
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isPreview } from '@/lib/variant';
import { strings } from '@/strings';
import { radius, space } from '@/theme';
import { makeStyles, ThemeScope } from '@/theme/ThemeProvider';

import { size } from './sizes';
import { Text } from './Text';

export type DraftChipProps = {
  /** The item it labels: the chip appears only when the item is a draft. */
  item: { draft?: boolean };
  /** True when it sits on a cover or an aura. */
  onCover?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DraftChip({ item, onCover = false, style }: DraftChipProps) {
  if (!isPreview || !item.draft) return null;
  const chip = <Chip style={style} />;
  return onCover ? <ThemeScope scheme="dark">{chip}</ThemeScope> : chip;
}

function Chip({ style }: { style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={[styles.chip, style]}>
      <Text variant="overline" color="support.ember">
        {strings.common.draft}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((color) =>
  StyleSheet.create({
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
  }),
);
