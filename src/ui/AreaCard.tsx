/**
 * AreaCard: how Today will show one suggestion of an area (Breathe, Sit, Write…).
 * A card on the area's soft ground: a round disc holding the area's icon, an overline in the
 * area's colour, a title and one line, and a chevron on the right. At least 88 high.
 * With `done`, the line follows the sage tick ("Written today"). Phase 5 puts Write on Today.
 */
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { radius, space, withAlpha, type Area } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { Card } from './Card';
import { DoneTick } from './DoneTick';
import { Overline } from './Overline';
import { PressableScale } from './PressableScale';
import { size } from './sizes';
import { Text } from './Text';

export type AreaCardProps = {
  area: Area;
  icon: LucideIcon;
  /** The small label: "Breathe · 3 min". */
  overline: string;
  title: string;
  /** One line under the title. */
  line: string;
  /** Done today: the sage tick before the line. */
  done?: boolean;
  onPress: () => void;
};

export function AreaCard({ area, icon: Icon, overline, title, line, done = false, onPress }: AreaCardProps) {
  const { color } = useTheme();
  const ink = color.area[area];
  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${overline}, ${title}, ${line}`}>
      <Card style={[styles.card, { backgroundColor: color.areaSoft[area] }]}>
        <View style={[styles.disc, { backgroundColor: withAlpha(ink, size.areaCard.discAlpha) }]}>
          <Icon size={size.icon.md} strokeWidth={size.stroke.regular} color={ink} />
        </View>
        <View style={styles.words}>
          <Overline tone="area" area={area} numberOfLines={1}>
            {overline}
          </Overline>
          <Text variant="h3">{title}</Text>
          <View style={styles.line}>
            {done ? <DoneTick /> : null}
            <Text variant="body" color="text.secondary" numberOfLines={1} style={styles.lineText}>
              {line}
            </Text>
          </View>
        </View>
        <ChevronRight size={size.icon.md} strokeWidth={size.stroke.regular} color={color.text.muted} />
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: size.areaCard.min, flexDirection: 'row', alignItems: 'center', gap: space.md },
  disc: {
    width: size.areaCard.disc,
    height: size.areaCard.disc,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flex: 1, gap: space.xxs },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  lineText: { flexShrink: 1 },
});
