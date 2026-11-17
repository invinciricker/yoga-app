/**
 * RoomPlaceholder: what a tab shows in the preview app while its area is still being built
 * (Breathe, Meditate, Journal in Phase 2). Its aura over the whole screen, always dark, the
 * area's name and one line. The public app hides these tabs instead (src/config.ts, "areas").
 */
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/strings';
import { layout, space, type AuraName } from '@/theme';
import { useDarkTop } from '@/theme/statusBar';
import { ThemeScope } from '@/theme/ThemeProvider';

import { Arrive } from './Arrive';
import { Cover } from './Cover';
import { Text } from './Text';

export type RoomPlaceholderProps = { title: string; aura: AuraName };

export function RoomPlaceholder({ title, aura }: RoomPlaceholderProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  useDarkTop(true);
  // The words end 24 above the top of the floating tab bar.
  const bottom = insets.bottom + layout.tabBarInset + layout.tabBarHeight + space.xl;
  return (
    <ThemeScope scheme="dark">
      <Cover aura={aura} height={height} radius="none" scrim style={styles.fill}>
        <View style={[styles.words, { bottom }]}>
          <Arrive index={0}>
            <Text variant="display" color="onCover.primary" accessibilityRole="header">
              {title}
            </Text>
          </Arrive>
          <Arrive index={1}>
            <Text variant="bodyLarge" color="onCover.secondary">
              {strings.areas.building}
            </Text>
          </Arrive>
        </View>
      </Cover>
    </ThemeScope>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  words: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    gap: space.xs,
    alignSelf: 'center',
    maxWidth: layout.maxContentWidth - layout.gutter * 2,
  },
});
