/**
 * WeekCard: this week as seven candles, Monday to Sunday (the "Today" mockup). On Today and in You.
 *
 *   top      a flame and the streak ("4 days in a row") on the left, "This week" on the right;
 *            "Light your first candle" before anything was ever done, "Light today's candle" when
 *            the streak has gone out. Those two invitations stand alone, without "This week":
 *            beside it they would break onto two lines on a phone.
 *   candles  a lit day is a small gold candle with its glow; an empty day a hairline ring; today
 *            has a ring around it, lit or not; days still to come are quieter.
 *
 * The candles are the app's only reward (docs/V2.md): no numbers beyond the streak, no badges.
 */
import { Flame } from 'lucide-react-native';
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { WeekDay } from '@/day/record';
import { strings } from '@/strings';
import { space } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

import { Card } from './Card';
import { size } from './sizes';
import { Text } from './Text';

export type WeekCardProps = {
  days: WeekDay[];
  /** Days in a row, counting today (or yesterday until midnight). */
  streak: number;
  /** Something was done at least once, ever. */
  ever: boolean;
};

/** The words at the top left. */
export function weekTitle(streak: number, ever: boolean): string {
  if (streak > 0) return strings.week.streak(streak);
  return ever ? strings.week.today : strings.week.first;
}

export function WeekCard({ days, streak, ever }: WeekCardProps) {
  const { color } = useTheme();
  const title = weekTitle(streak, ever);
  const lit = days.filter((d) => d.lit).map((d) => strings.week.names[days.indexOf(d)]);
  return (
    <Card style={styles.card}>
      <View accessible accessibilityLabel={strings.week.spoken(title, lit)} style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.title}>
            <Flame size={size.icon.lg} strokeWidth={size.stroke.regular} color={color.accent.gold} />
            <Text variant="h3" style={styles.titleText}>
              {title}
            </Text>
          </View>
          {streak > 0 ? (
            <Text variant="meta" color="text.muted" numberOfLines={1} style={styles.thisWeek}>
              {strings.week.thisWeek}
            </Text>
          ) : null}
        </View>
        <View style={styles.days}>
          {days.map((d) => (
            <View key={d.day} style={styles.day}>
              <Text variant="meta" color={d.isToday ? 'accent.gold' : 'text.muted'}>
                {d.letter}
              </Text>
              <Candle day={d} />
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

/** One day: a lit candle with its glow, or a hairline ring; today has a ring around it. */
function Candle({ day }: { day: WeekDay }) {
  const { color } = useTheme();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const box = size.candleGlow;
  const c = box / 2;
  const r = size.candle / 2;
  const ring = r + size.candleRing + size.stroke.hairline / 2;
  return (
    <Svg width={box} height={box}>
      {day.lit ? (
        <>
          <Defs>
            <RadialGradient id={id} cx="50%" cy="50%" r="50%">
              <Stop offset={r / c} stopColor={color.accent.goldBright} stopOpacity={size.candleGlowAlpha} />
              <Stop offset={1} stopColor={color.accent.goldBright} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={c} fill={`url(#${id})`} />
          <Circle cx={c} cy={c} r={r} fill={color.accent.goldBright} />
        </>
      ) : (
        <Circle
          cx={c}
          cy={c}
          r={r - size.stroke.hairline / 2}
          fill="none"
          stroke={day.isFuture ? color.border.subtle : color.border.strong}
          strokeWidth={size.stroke.hairline}
        />
      )}
      {day.isToday ? (
        <Circle cx={c} cy={c} r={ring} fill="none" stroke={color.accent.gold} strokeWidth={size.stroke.hairline} />
      ) : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: space.md },
  inner: { gap: space.md },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, paddingHorizontal: space.xxs },
  title: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexShrink: 1 },
  titleText: { flexShrink: 1 },
  thisWeek: { flexShrink: 0 },
  days: { flexDirection: 'row' },
  // Each day takes a seventh of the width; its glow may reach a little past it.
  day: { flex: 1, alignItems: 'center', gap: space.xxs },
});
