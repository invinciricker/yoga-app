/**
 * SettingsRow: one row of You (and of the pages under it). A label, an optional line under it,
 * and on the right either a switch or a chevron. At least 56 high; the whole row is the touch
 * target. Put rows in a <ListCard> so they share one card with hairlines between them.
 *
 *   <SettingsRow label="Reduce motion" line="Fewer moving parts…" value={on} onValueChange={setOn} />
 *   <SettingsRow label="About" onPress={() => router.push(routes.about)} />
 *
 * A row may show a short `detail` before its chevron (the number of saved lessons), and a
 * destructive row (Delete my data) is `danger`: its label in support.danger.
 */
import { ChevronRight } from 'lucide-react-native';
import { Platform, StyleSheet, Switch, View } from 'react-native';

import { layout, space } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

/** Props that only react-native-web knows (not in React Native's types): given on the web only. */
const webOnly = (props: Record<string, string>): object => (Platform.OS === 'web' ? props : {});

type Common = {
  label: string;
  /** A short line under the label. */
  line?: string;
  accessibilityHint?: string;
  /** A short word or number before the chevron. */
  detail?: string;
  /** A destructive row: the label in support.danger. */
  danger?: boolean;
};

export type SettingsRowProps = Common &
  (
    | { /** A switch on the right. */ value: boolean; onValueChange: (value: boolean) => void; onPress?: never }
    | { /** A chevron on the right: the row opens a page. */ onPress: () => void; value?: never; onValueChange?: never }
  );

export function SettingsRow(props: SettingsRowProps) {
  const { scheme, color } = useTheme();
  const { label, line, accessibilityHint, detail, danger } = props;
  const isSwitch = props.onValueChange !== undefined;
  // The knob: ivory in the dark, white on paper, the same whether on or off.
  const thumb = scheme === 'dark' ? color.text.primary : color.bg.elevated;

  const onPress = () => {
    if (props.onValueChange) props.onValueChange(!props.value);
    else props.onPress?.();
  };

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={[label, detail, line].filter(Boolean).join('. ')}
      accessibilityHint={accessibilityHint}
      accessibilityRole={isSwitch ? 'switch' : 'button'}
      accessibilityState={isSwitch ? { checked: !!props.value } : undefined}
      style={styles.row}
    >
      <View style={styles.words}>
        <Text variant="title" color={danger ? 'support.danger' : 'text.primary'}>
          {label}
        </Text>
        {line ? (
          <Text variant="meta" color="text.secondary">
            {line}
          </Text>
        ) : null}
      </View>
      {isSwitch ? (
        // The row answers the touch; the switch only shows the state (and is not read twice).
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Switch
            value={!!props.value}
            trackColor={{ false: color.border.strong, true: color.accent.fill }}
            thumbColor={thumb}
            ios_backgroundColor={color.border.strong}
            // The web mirror's switch has its own colour for the knob when on (a teal): ours instead.
            {...webOnly({ activeThumbColor: thumb })}
          />
        </View>
      ) : (
        <>
          {detail ? (
            <Text variant="meta" color="text.muted" tabular>
              {detail}
            </Text>
          ) : null}
          <ChevronRight size={size.icon.md} strokeWidth={size.stroke.regular} color={color.text.muted} />
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: Math.max(size.settingsRow, layout.touchMin),
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  words: { flex: 1, gap: space.xxs / 2 },
});
